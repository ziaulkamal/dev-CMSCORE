/**
 * src/modules/taxonomies/taxonomies.service.ts
 * Taxonomy & Term (PRD §10.1): listing, create taxonomy, list/create term per taxonomy.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictError, NotFoundError } from '../../common/errors/domain.error';
import { slugify } from '../../common/utils/slug';
import { CreateTaxonomyDto, CreateTermDto } from './dto/taxonomy.dto';

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
    return this.prisma.term.findMany({
      where: { taxonomyId: taxonomy.id },
      orderBy: { name: 'asc' },
      take: 100,
    });
  }

  async createTerm(taxonomySlug: string, dto: CreateTermDto) {
    const taxonomy = await this.getTaxonomyOrThrow(taxonomySlug);
    const slug = slugify(dto.slug ?? dto.name);
    const dup = await this.prisma.term.findUnique({
      where: { taxonomyId_slug: { taxonomyId: taxonomy.id, slug } },
    });
    if (dup) throw new ConflictError('TERM_EXISTS', `Term '${slug}' sudah ada di taxonomy ini`);

    return this.prisma.term.create({
      data: {
        taxonomyId: taxonomy.id,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        parentId: dto.parent_id ?? null,
      },
    });
  }

  private async getTaxonomyOrThrow(slug: string) {
    const taxonomy = await this.prisma.taxonomy.findUnique({ where: { slug } });
    if (!taxonomy) throw new NotFoundError(`Taxonomy '${slug}' tidak ditemukan`);
    return taxonomy;
  }
}
