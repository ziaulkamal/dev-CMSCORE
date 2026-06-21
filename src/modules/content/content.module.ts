// src/modules/content/content.module.ts — wiring modul Content (CRUD, meta, locking, scheduler).
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentRepository } from './content.repository';
import { ContentLockService } from './content-lock.service';
import { ScheduledPublishService } from './scheduled-publish.service';
import { ScheduledPublishProcessor } from './scheduled-publish.processor';
import { QUEUE_SCHEDULED_PUBLISH } from '../../common/queue/queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_SCHEDULED_PUBLISH })],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentRepository,
    ContentLockService,
    ScheduledPublishService,
    ScheduledPublishProcessor,
  ],
  exports: [ContentService, ContentRepository],
})
export class ContentModule {}
