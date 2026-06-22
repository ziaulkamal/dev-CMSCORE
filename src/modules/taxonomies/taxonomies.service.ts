/**
 * src/modules/taxonomies/taxonomies.service.ts
 * Taxonomy & Term (PRD §10.1): listing, create taxonomy, list/create term per taxonomy.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictError, NotFoundError } from '../../common/errors/domain.error';
import { slugify } from '../../common/utils/slug';
import {
  CreateTaxonomyDto,
  CreateTermDto,
  UpdateTaxonomyDto,
  UpdateTermDto,
} from './dto/taxonomy.dto';

/** Bentuk term di Prisma (kolom internal camelCase). */
interface TermRow {
  id: string;
  taxonomyId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
}

/** Serialisasi term ke kontrak API (snake_case), konsisten dengan endpoint lain. */
function toTermDto(t: TermRow) {
  return {
    id: t.id,
    taxonomy_id: t.taxonomyId,
    name: t.name,
    slug: t.slug,
    description: t.description,
    parent_id: t.parentId,
  };
}

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.taxonomy.findMany({ take: 50, orderBy: { slug: 'asc' } });
  }

  async create(dto: CreateTaxonomyDto) {
    const slug = slugify(dto.slug);
    const exists = await this.prisma.taxonomy.findUnique({ where: { slug } });
    if (exists) throw new ConflictError('TAXONOMY_EXISTS', `Taxonomy '${slug}' sudah ada`);
    return this.prisma.taxonomy.create({
      data: { slug, label: dto.label, hierarchical: dto.hierarchical ?? false },
    });
  }

  /** Term di bawah taxonomy tertentu (identifikasi via slug taxonomy). */
  async listTerms(taxonomySlug: string) {
    const taxonomy = await this.getTaxonomyOrThrow(taxonomySlug);
    const terms = await this.prisma.term.findMany({
      where: { taxonomyId: taxonomy.id },
      orderBy: { name: 'asc' },
      take: 100,
    });
    return terms.map(toTermDto);
  }

  async createTerm(taxonomySlug: string, dto: CreateTermDto) {
    const taxonomy = await this.getTaxonomyOrThrow(taxonomySlug);
    const slug = slugify(dto.slug ?? dto.name);
    const dup = await this.prisma.term.findUnique({
      where: { taxonomyId_slug: { taxonomyId: taxonomy.id, slug } },
    });
    if (dup) throw new ConflictError('TERM_EXISTS', `Term '${slug}' sudah ada di taxonomy ini`);

    const created = await this.prisma.term.create({
      data: {
        taxonomyId: taxonomy.id,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        parentId: dto.parent_id ?? null,
      },
    });
    return toTermDto(created);
  }

  /** Update label / hierarchical taxonomy. */
  async update(taxonomySlug: string, dto: UpdateTaxonomyDto) {
    const taxonomy = await this.getTaxonomyOrThrow(taxonomySlug);
    return this.prisma.taxonomy.update({
      where: { id: taxonomy.id },
      data: {
        label: dto.label ?? taxonomy.label,
        hierarchical: dto.hierarchical ?? taxonomy.hierarchical,
      },
    });
  }

  /** Hapus taxonomy (term ikut terhapus — cascade di schema). */
  async remove(taxonomySlug: string) {
    const taxonomy = await this.getTaxonomyOrThrow(taxonomySlug);
    await this.prisma.taxonomy.delete({ where: { id: taxonomy.id } });
    return { id: taxonomy.id };
  }

  async updateTerm(taxonomySlug: string, termId: string, dto: UpdateTermDto) {
    const taxonomy = await this.getTaxonomyOrThrow(taxonomySlug);
    const term = await this.getTermOrThrow(taxonomy.id, termId);

    // Slug baru (bila name/slug berubah) wajib unik dalam taxonomy.
    let slug = term.slug;
    if (dto.slug !== undefined || dto.name !== undefined) {
      slug = slugify(dto.slug ?? dto.name ?? term.name);
      const dup = await this.prisma.term.findUnique({
        where: { taxonomyId_slug: { taxonomyId: taxonomy.id, slug } },
      });
      if (dup && dup.id !== term.id) {
        throw new ConflictError('TERM_EXISTS', `Term '${slug}' sudah ada di taxonomy ini`);
      }
    }

    // Validasi parent: harus term lain di taxonomy yang sama, bukan diri sendiri/keturunannya.
    let parentId = term.parentId;
    if (dto.parent_id !== undefined) {
      parentId = dto.parent_id;
      if (parentId) await this.assertValidParent(taxonomy.id, term.id, parentId);
    }

    const updated = await this.prisma.term.update({
      where: { id: term.id },
      data: {
        name: dto.name ?? term.name,
        slug,
        description: dto.description ?? term.description,
        parentId,
      },
    });
    return toTermDto(updated);
  }

  /** Hapus term; anaknya otomatis jadi root (parent_id → null via schema). */
  async removeTerm(taxonomySlug: string, termId: string) {
    const taxonomy = await this.getTaxonomyOrThrow(taxonomySlug);
    const term = await this.getTermOrThrow(taxonomy.id, termId);
    await this.prisma.term.delete({ where: { id: term.id } });
    return { id: term.id };
  }

  private async getTermOrThrow(taxonomyId: string, termId: string) {
    const term = await this.prisma.term.findFirst({ where: { id: termId, taxonomyId } });
    if (!term) throw new NotFoundError(`Term '${termId}' tidak ditemukan di taxonomy ini`);
    return term;
  }

  /** Cegah parent ilegal: diri sendiri, taxonomy lain, atau keturunan (siklus). */
  private async assertValidParent(taxonomyId: string, termId: string, parentId: string) {
    if (parentId === termId) {
      throw new ConflictError('INVALID_PARENT', 'Term tidak boleh menjadi induk dirinya sendiri');
    }
    const parent = await this.prisma.term.findFirst({ where: { id: parentId, taxonomyId } });
    if (!parent) throw new NotFoundError('Term induk tidak ditemukan di taxonomy ini');

    // Telusuri ke atas dari parent; bila menemui termId → siklus.
    let cursor: string | null = parent.parentId;
    while (cursor) {
      if (cursor === termId) {
        throw new ConflictError('INVALID_PARENT', 'Induk tidak boleh keturunan term ini');
      }
      const up = await this.prisma.term.findUnique({ where: { id: cursor } });
      cursor = up?.parentId ?? null;
    }
  }

  private async getTaxonomyOrThrow(slug: string) {
    const taxonomy = await this.prisma.taxonomy.findUnique({ where: { slug } });
    if (!taxonomy) throw new NotFoundError(`Taxonomy '${slug}' tidak ditemukan`);
    return taxonomy;
  }
}
