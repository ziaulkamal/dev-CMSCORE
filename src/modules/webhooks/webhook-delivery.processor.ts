/**
 * src/modules/webhooks/webhook-delivery.processor.ts
 * Worker delivery: tanda tangan HMAC, POST ke target, catat percobaan, retry via BullMQ.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QUEUE_WEBHOOK_DELIVERY } from '../../common/queue/queue.constants';

interface DeliveryJobData {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
}

const TIMEOUT_MS = 10_000;

@Processor(QUEUE_WEBHOOK_DELIVERY)
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<DeliveryJobData>): Promise<void> {
    const { webhookId, event, payload } = job.data;
    const webhook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || !webhook.active) return; // dinonaktifkan sejak di-enqueue

    const body = JSON.stringify({ event, payload, delivered_at: new Date().toISOString() });
    const signature = createHmac('sha256', webhook.secret).update(body).digest('hex');

    let status: number | null = null;
    try {
      const res = await this.post(webhook.targetUrl, body, signature);
      status = res.status;
      if (!res.ok) throw new Error(`Target merespons ${res.status}`);
    } catch (err) {
      await this.record(webhookId, payload, status, job.attemptsMade + 1);
      this.logger.warn(`Delivery webhook ${webhookId} gagal: ${(err as Error).message}`);
      throw err; // biarkan BullMQ retry dengan backoff
    }

    await this.record(webhookId, payload, status, job.attemptsMade + 1);
  }

  /** Catat percobaan ke webhook_delivery (audit pengiriman). */
  private record(
    webhookId: string,
    payload: Record<string, unknown>,
    responseStatus: number | null,
    attempt: number,
  ) {
    return this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        payload: payload as Prisma.InputJsonValue,
        responseStatus,
        attempt,
        deliveredAt: new Date(),
      },
    });
  }

  /** POST dengan timeout & header signature; fetch native Node 18+. */
  private async post(url: string, body: string, signature: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
