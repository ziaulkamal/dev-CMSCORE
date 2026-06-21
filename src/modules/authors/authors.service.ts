// src/modules/authors/authors.service.ts — Author byline publik (terpisah dari user).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service authors — listing dasar; perluas sesuai PRD. */
@Injectable()
export class AuthorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.author.findMany({ take: 50 });
  }
}
