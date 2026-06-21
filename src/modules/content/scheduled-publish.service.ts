/**
 * src/modules/content/scheduled-publish.service.ts
 * Producer job scheduled-publish: enqueue delayed job, cancel/reschedule per konten (PRD §6).
 */
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  JOB_PUBLISH_CONTENT,
  QUEUE_SCHEDULED_PUBLISH,
  scheduledJobId,
} from '../../common/queue/queue.constants';

@Injectable()
export class ScheduledPublishService {
  constructor(@InjectQueue(QUEUE_SCHEDULED_PUBLISH) private readonly queue: Queue) {}

  /** Jadwalkan publish pada publishAt; replace job lama bila ada (reschedule). */
  async schedule(contentId: string, publishAt: Date): Promise<void> {
    await this.cancel(contentId);
    const delay = Math.max(0, publishAt.getTime() - Date.now());
    await this.queue.add(
      JOB_PUBLISH_CONTENT,
      { contentId },
      { jobId: scheduledJobId(contentId), delay },
    );
  }

  /** Batalkan job terjadwal (dipakai saat status diubah dari scheduled). */
  async cancel(contentId: string): Promise<void> {
    const existing = await this.queue.getJob(scheduledJobId(contentId));
    if (existing) await existing.remove().catch(() => undefined);
  }
}
