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
import { AuthorModule } from '../authors/authors.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_SCHEDULED_PUBLISH }),
    AuthorModule,
  ],
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
