/**
 * src/modules/webhooks/webhooks.service.ts
 * Registrasi webhook + enqueue delivery untuk tiap event domain (PRD §11).
 */
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/domain.error';
import { JOB_DELIVER_WEBHOOK, QUEUE_WEBHOOK_DELIVERY } from '../../common/queue/queue.constants';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_WEBHOOK_DELIVERY) private readonly queue: Queue,
  ) {}

  list() {
    return this.prisma.webhook.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
  }

  /** Secret di-generate bila tidak diberikan (untuk tanda tangan HMAC). */
  create(dto: CreateWebhookDto) {
    return this.prisma.webhook.create({
      data: {
        event: dto.event,
        targetUrl: dto.target_url,
        secret: dto.secret ?? randomBytes(24).toString('hex'),
        active: dto.active ?? true,
      },
    });
  }

  async remove(id: string) {
    const found = await this.prisma.webhook.findUnique({ where: { id } });
    if (!found) throw new NotFoundError('Webhook tidak ditemukan');
    await this.prisma.webhook.delete({ where: { id } });
    return { deleted: true };
  }

  /** Enqueue satu delivery job per webhook aktif yang mendengarkan event ini. */
  async dispatch(event: string, payload: Record<string, unknown>): Promise<void> {
    const hooks = await this.prisma.webhook.findMany({ where: { event, active: true } });
    await Promise.all(
      hooks.map((hook) =>
        this.queue.add(JOB_DELIVER_WEBHOOK, { webhookId: hook.id, event, payload }),
      ),
    );
  }
}
