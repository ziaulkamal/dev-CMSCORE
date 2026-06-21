// src/common/queue/queue.constants.ts — nama queue & job antar-modul (hindari magic string).

export const QUEUE_SCHEDULED_PUBLISH = 'scheduled-publish';
export const QUEUE_WEBHOOK_DELIVERY = 'webhook-delivery';

export const JOB_PUBLISH_CONTENT = 'publish-content';
export const JOB_DELIVER_WEBHOOK = 'deliver-webhook';

/** Prefix jobId scheduled-publish agar bisa di-cancel/replace per konten. */
export function scheduledJobId(contentId: string): string {
  return `publish:${contentId}`;
}
