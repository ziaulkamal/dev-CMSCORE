// src/modules/feed/feed.module.ts — wiring modul feed publik.
import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
