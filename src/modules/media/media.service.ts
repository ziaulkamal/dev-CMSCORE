// src/modules/media/media.service.ts — Media (metadata; upload menyusul via MinIO).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service media — listing dasar; perluas sesuai PRD. */
@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.media.findMany({ take: 50 });
  }
}
