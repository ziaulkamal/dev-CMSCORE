// src/modules/webhooks/webhooks.service.ts — Webhook & delivery.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service webhooks — listing dasar; perluas sesuai PRD. */
@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.webhook.findMany({ take: 50 });
  }
}
