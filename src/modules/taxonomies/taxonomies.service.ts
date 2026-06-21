// src/modules/taxonomies/taxonomies.service.ts — Taxonomy & Term.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service taxonomies — listing dasar; perluas sesuai PRD. */
@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.taxonomy.findMany({ take: 50 });
  }
}
