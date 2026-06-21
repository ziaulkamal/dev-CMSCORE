/**
 * src/modules/content/content.repository.ts
 * Akses data Content: CRUD, meta EAV, listing cursor, slug uniqueness, lock fields.
 */
import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CursorPayload } from '../../common/pagination/cursor';

const DETAIL_INCLUDE = {
  metas: true,
  authors: { include: { author: true } },
  terms: { include: { term: true } },
} satisfies Prisma.ContentInclude;

@Injectable()
export class ContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Akses transaksi untuk operasi multi-langkah (create + meta + relasi). */
  get client(): PrismaService {
    return this.prisma;
  }

  findById(id: string) {
    return this.prisma.content.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  }

  /** Cek apakah slug sudah dipakai untuk type tertentu (slug unik per type). */
  slugExists(type: string, slug: string, exceptId?: string) {
    return this.prisma.content.findFirst({
      where: { type, slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
  }

  /** Listing cursor-based (keyset pada createdAt+id) dengan filter & sort. */
  async listFeed(params: {
    where: Prisma.ContentWhereInput;
    cursor: CursorPayload | null;
    limit: number;
    direction: 'asc' | 'desc';
  }) {
    const { where, cursor, limit, direction } = params;
    const keyset: Prisma.ContentWhereInput = cursor
      ? {
          OR: [
            {
              createdAt: direction === 'desc' ? { lt: cursor.createdAt } : { gt: cursor.createdAt },
            },
            {
              createdAt: cursor.createdAt,
              id: direction === 'desc' ? { lt: cursor.id } : { gt: cursor.id },
            },
          ],
        }
      : {};

    return this.prisma.content.findMany({
      where: { AND: [where, keyset] },
      orderBy: [{ createdAt: direction }, { id: direction }],
      take: limit + 1,
    });
  }

  updateLock(id: string, data: Prisma.ContentUpdateInput) {
    return this.prisma.content.update({ where: { id }, data });
  }

  updateStatus(id: string, data: Prisma.ContentUpdateInput) {
    return this.prisma.content.update({ where: { id }, data, include: DETAIL_INCLUDE });
  }

  /** Upsert daftar meta dalam satu transaksi (DRY, dipakai create & meta endpoint). */
  upsertMeta(contentId: string, meta: Record<string, string>) {
    const ops = Object.entries(meta).map(([metaKey, metaValue]) =>
      this.prisma.contentMeta.upsert({
        where: { contentId_metaKey: { contentId, metaKey } },
        update: { metaValue },
        create: { contentId, metaKey, metaValue },
      }),
    );
    return this.prisma.$transaction(ops);
  }

  findMeta(contentId: string) {
    return this.prisma.contentMeta.findMany({ where: { contentId } });
  }

  static get detailInclude() {
    return DETAIL_INCLUDE;
  }

  static publicStatuses(): ContentStatus[] {
    return ['published'];
  }
}
