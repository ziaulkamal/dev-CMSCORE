// src/modules/comments/comments.service.ts — Comment + moderasi.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service comments — listing dasar; perluas sesuai PRD. */
@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.comment.findMany({ take: 50 });
  }
}
