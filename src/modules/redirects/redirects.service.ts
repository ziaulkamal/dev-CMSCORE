// src/modules/redirects/redirects.service.ts — Redirect from_path -> to_path.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service redirects — listing dasar; perluas sesuai PRD. */
@Injectable()
export class RedirectService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.redirect.findMany({ take: 50 });
  }
}
