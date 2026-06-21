/**
 * src/modules/content/scheduled-publish.processor.ts
 * Worker: saat job tiba, promosikan konten scheduled → published & pancarkan event.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QUEUE_SCHEDULED_PUBLISH } from '../../common/queue/queue.constants';
import { APP_EVENTS } from '../../common/events/app-events';

interface PublishJobData {
  contentId: string;
}

@Processor(QUEUE_SCHEDULED_PUBLISH)
export class ScheduledPublishProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledPublishProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<PublishJobData>): Promise<void> {
    const { contentId } = job.data;
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });

    // Hanya publish bila masih scheduled (mungkin sudah diubah manual).
    if (!content || content.status !== 'scheduled') {
      this.logger.log(`Lewati publish ${contentId}: status bukan scheduled`);
      return;
    }

    const published = await this.prisma.content.update({
      where: { id: contentId },
      data: { status: 'published', publishedAt: new Date(), scheduledAt: null },
    });

    this.events.emit(APP_EVENTS.contentPublished, {
      content_id: published.id,
      type: published.type,
      slug: published.slug,
      published_at: published.publishedAt,
    });
    this.logger.log(`Konten ${contentId} dipublikasikan via scheduler`);
  }
}
