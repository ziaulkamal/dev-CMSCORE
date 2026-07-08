/**
 * src/modules/content/content.service.ts
 * Logika Content: CRUD, slug unik per type, EAV meta, listing feed, transisi status.
 */
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentStatus, Prisma } from '@prisma/client';
import { ContentRepository } from './content.repository';
import { ScheduledPublishService } from './scheduled-publish.service';
import { AuthorService } from '../authors/authors.service';
import { APP_EVENTS } from '../../common/events/app-events';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { TransitionDto } from './dto/transition.dto';
import { ListContentQuery } from './dto/list-content.query';
import { allowedMetaKeys } from './content-type.registry';
import { isLegalTransition, requiredCapabilityFor } from './content-status.machine';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain.error';
import { slugify } from '../../common/utils/slug';
import { sanitizeBody } from '../../common/utils/sanitize';
import {
  CursorPayload,
  decodeCursor,
  encodeCursor,
  normalizeLimit,
} from '../../common/pagination/cursor';

@Injectable()
export class ContentService {
  constructor(
    private readonly repo: ContentRepository,
    private readonly scheduler: ScheduledPublishService,
    private readonly events: EventEmitter2,
    private readonly authors: AuthorService,
  ) {}

  /** Buat content + meta + authors + terms dalam satu transaksi. */
  async create(dto: CreateContentDto, user: AuthenticatedUser) {
    const slug = await this.uniqueSlug(dto.type, dto.title);
    const meta = this.filterMeta(dto.type, dto.meta);

    // Default penulis utama = penulis yang ter-link ke user login (auto-buat
    // bila belum ada). Bisa di-override bila dto.primary_author_id dikirim.
    const primaryAuthorId =
      dto.primary_author_id ?? (await this.authors.ensureAuthorForUser(user.id));

    return this.repo.client.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          type: dto.type,
          title: dto.title,
          slug,
          body: sanitizeBody(dto.body),
          excerpt: dto.excerpt ?? null,
          parentId: dto.parent_id ?? null,
          featuredMediaId: dto.featured_media_id ?? null,
          primaryAuthorId,
          createdById: user.id,
        },
      });

      await this.persistRelations(tx, content.id, { ...dto, primary_author_id: primaryAuthorId }, meta);
      return tx.content.findUniqueOrThrow({
        where: { id: content.id },
        include: ContentRepository.detailInclude,
      });
    });
  }

  /** Update field + relasi; konten tidak bisa diubah saat dikunci user lain. */
  async update(id: string, dto: UpdateContentDto, user: AuthenticatedUser) {
    const existing = await this.getOwnedOrThrow(id, user, 'edit');
    const meta = this.filterMeta(existing.type, dto.meta);

    return this.repo.client.$transaction(async (tx) => {
      await tx.content.update({
        where: { id },
        data: {
          title: dto.title ?? undefined,
          body: dto.body !== undefined ? sanitizeBody(dto.body) : undefined,
          excerpt: dto.excerpt ?? undefined,
          parentId: dto.parent_id ?? undefined,
          featuredMediaId: dto.featured_media_id ?? undefined,
          primaryAuthorId: dto.primary_author_id ?? undefined,
        },
      });
      await this.persistRelations(tx, id, dto, meta);
      return tx.content.findUniqueOrThrow({
        where: { id },
        include: ContentRepository.detailInclude,
      });
    });
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const content = await this.repo.findById(id);
    if (!content) throw new NotFoundError('Content tidak ditemukan');
    // Konten non-published hanya untuk user terautentikasi (akses dasar).
    if (content.status !== 'published' && !user) {
      throw new NotFoundError('Content tidak ditemukan');
    }
    return content;
  }

  /** Detail konten via slug (slug unik per type; type opsional bila ingin batasi). */
  async findBySlug(slug: string, type?: string, user?: AuthenticatedUser) {
    const content = await this.repo.findBySlug(slug, type);
    if (!content) throw new NotFoundError('Content tidak ditemukan');
    if (content.status !== 'published' && !user) {
      throw new NotFoundError('Content tidak ditemukan');
    }
    return content;
  }

  /** Soft-delete (trash) via transisi; bukan hard delete. */
  async trash(id: string, user: AuthenticatedUser) {
    await this.getOwnedOrThrow(id, user, 'delete');
    return this.repo.updateStatus(id, {
      status: 'trashed',
    });
  }

  async list(query: ListContentQuery, user?: AuthenticatedUser) {
    const limit = normalizeLimit(query.limit);
    const cursor = decodeCursor(query.cursor);
    const direction = query.sort?.startsWith('-') ? 'desc' : 'asc';

    const where: Prisma.ContentWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) {
      where.status = query.status;
    } else if (!user) {
      where.status = 'published'; // anonim hanya melihat published
    }

    // Filter term: cocokkan by id ATAU slug; opsional dibatasi taxonomy.
    if (query.term) {
      where.terms = {
        some: {
          term: {
            OR: [{ id: query.term }, { slug: query.term }],
            ...(query.taxonomy ? { taxonomy: { slug: query.taxonomy } } : {}),
          },
        },
      };
    }

    // Filter author: cocokkan primary atau co-author byline.
    if (query.author) {
      where.OR = [
        { primaryAuthorId: query.author },
        { authors: { some: { authorId: query.author } } },
      ];
    }

    // Pencarian sederhana: judul atau excerpt mengandung kata kunci.
    if (query.q) {
      const q = query.q.trim();
      if (q) {
        where.AND = [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { excerpt: { contains: q, mode: 'insensitive' } },
            ],
          },
        ];
      }
    }

    const rows = await this.repo.listFeed({ where, cursor, limit, direction });
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];
    const nextCursor: string | null =
      hasMore && last
        ? encodeCursor({ id: last.id, createdAt: last.createdAt.toISOString() } as CursorPayload)
        : null;

    return { data, meta: { next_cursor: nextCursor, limit } };
  }

  /** Transisi status: validasi legalitas (PRD §6) + capability + scheduled_at. */
  async transition(id: string, dto: TransitionDto, user: AuthenticatedUser) {
    const content = await this.repo.findById(id);
    if (!content) throw new NotFoundError('Content tidak ditemukan');

    const from = content.status;
    const to = dto.to;

    if (!isLegalTransition(from, to)) {
      throw new ConflictError(
        'INVALID_STATUS_TRANSITION',
        `${from} tidak dapat langsung ke ${to}`,
        {
          from,
          to,
        },
      );
    }

    const requiredCap = requiredCapabilityFor(from, to);
    if (requiredCap && !user.capabilities.includes(requiredCap)) {
      throw new ForbiddenError('Capability tidak mencukupi untuk transisi ini', {
        required: requiredCap,
      });
    }

    const data = this.buildTransitionData(to, dto);
    const updated = await this.repo.updateStatus(id, data);

    // Sinkronkan job scheduler & pancarkan event sesuai status tujuan.
    await this.applyScheduling(from, to, updated);
    return updated;
  }

  /** Kelola job terjadwal & event saat status berpindah. */
  private async applyScheduling(
    from: ContentStatus,
    to: ContentStatus,
    content: {
      id: string;
      type: string;
      slug: string;
      scheduledAt: Date | null;
      publishedAt: Date | null;
    },
  ): Promise<void> {
    if (to === 'scheduled' && content.scheduledAt) {
      await this.scheduler.schedule(content.id, content.scheduledAt);
      return;
    }
    // Keluar dari scheduled (selain ke scheduled) → batalkan job lama.
    if (from === 'scheduled' && to !== 'scheduled') {
      await this.scheduler.cancel(content.id);
    }
    if (to === 'published') {
      this.events.emit(APP_EVENTS.contentPublished, {
        content_id: content.id,
        type: content.type,
        slug: content.slug,
        published_at: content.publishedAt,
      });
    }
    if (to === 'trashed') {
      this.events.emit(APP_EVENTS.contentTrashed, { content_id: content.id });
    }
  }

  async getMeta(id: string) {
    const content = await this.repo.findById(id);
    if (!content) throw new NotFoundError('Content tidak ditemukan');
    return Object.fromEntries(content.metas.map((m) => [m.metaKey, m.metaValue]));
  }

  async upsertMeta(id: string, meta: Record<string, string>, user: AuthenticatedUser) {
    const content = await this.getOwnedOrThrow(id, user, 'edit');
    const filtered = this.filterMeta(content.type, meta);
    await this.repo.upsertMeta(id, filtered);
    return this.getMeta(id);
  }

  // ── Helpers privat ───────────────────────────────────────

  /** Set published_at/scheduled_at sesuai target status. */
  private buildTransitionData(to: ContentStatus, dto: TransitionDto): Prisma.ContentUpdateInput {
    if (to === 'scheduled') {
      if (!dto.published_at) {
        throw new ValidationError('published_at wajib untuk status scheduled');
      }
      const at = new Date(dto.published_at);
      if (at.getTime() <= Date.now()) {
        throw new ValidationError('published_at harus di masa depan');
      }
      return { status: to, scheduledAt: at, publishedAt: at };
    }
    if (to === 'published') {
      return { status: to, publishedAt: new Date(), scheduledAt: null };
    }
    return { status: to };
  }

  /** Persist meta, primary+co-authors, dan terms (dipakai create & update). */
  private async persistRelations(
    tx: Prisma.TransactionClient,
    contentId: string,
    dto: CreateContentDto | UpdateContentDto,
    meta: Record<string, string>,
  ) {
    if (Object.keys(meta).length > 0) {
      for (const [metaKey, metaValue] of Object.entries(meta)) {
        await tx.contentMeta.upsert({
          where: { contentId_metaKey: { contentId, metaKey } },
          update: { metaValue },
          create: { contentId, metaKey, metaValue },
        });
      }
    }

    if (dto.primary_author_id || dto.co_author_ids) {
      await tx.contentAuthor.deleteMany({ where: { contentId } });
      const authors: Prisma.ContentAuthorCreateManyInput[] = [];
      if (dto.primary_author_id) {
        authors.push({ contentId, authorId: dto.primary_author_id, role: 'primary', sortOrder: 0 });
      }
      (dto.co_author_ids ?? []).forEach((authorId, i) =>
        authors.push({ contentId, authorId, role: 'co_author', sortOrder: i + 1 }),
      );
      if (authors.length)
        await tx.contentAuthor.createMany({ data: authors, skipDuplicates: true });
    }

    if (dto.terms) {
      await tx.contentTerm.deleteMany({ where: { contentId } });
      if (dto.terms.length) {
        await tx.contentTerm.createMany({
          data: dto.terms.map((termId) => ({ contentId, termId })),
          skipDuplicates: true,
        });
      }
    }
  }

  /** Buang meta_key yang tidak terdaftar untuk type (whitelist EAV). */
  private filterMeta(type: string, meta?: Record<string, string>): Record<string, string> {
    if (!meta) return {};
    const allowed = new Set(allowedMetaKeys(type));
    return Object.fromEntries(Object.entries(meta).filter(([k]) => allowed.has(k)));
  }

  /** Slug unik per type; tambahkan suffix angka bila bentrok. */
  private async uniqueSlug(type: string, title: string): Promise<string> {
    const base = slugify(title) || 'untitled';
    let slug = base;
    let n = 1;
    while (await this.repo.slugExists(type, slug)) {
      slug = `${base}-${++n}`;
    }
    return slug;
  }

  /** Cek kepemilikan: non-owner butuh edit_others_post / publish_post. */
  private async getOwnedOrThrow(id: string, user: AuthenticatedUser, action: 'edit' | 'delete') {
    const content = await this.repo.findById(id);
    if (!content) throw new NotFoundError('Content tidak ditemukan');

    const isOwner = content.createdById === user.id;
    const elevatedCap = action === 'delete' ? 'delete_post' : 'edit_others_post';
    if (!isOwner && !user.capabilities.includes(elevatedCap)) {
      throw new ForbiddenError('Tidak berwenang atas konten ini');
    }
    if (isOwner && !user.capabilities.includes('edit_post')) {
      throw new ForbiddenError('Capability edit_post diperlukan');
    }
    return content;
  }
}
