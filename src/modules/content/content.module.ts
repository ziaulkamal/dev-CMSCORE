// src/modules/content/content.module.ts — wiring modul Content (CRUD, meta, locking).
import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentRepository } from './content.repository';
import { ContentLockService } from './content-lock.service';

@Module({
  controllers: [ContentController],
  providers: [ContentService, ContentRepository, ContentLockService],
  exports: [ContentService, ContentRepository],
})
export class ContentModule {}
