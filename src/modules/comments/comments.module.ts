// src/modules/comments/comments.module.ts — wiring modul comments (stub).
import { Module } from '@nestjs/common';
import { CommentController } from './comments.controller';
import { CommentService } from './comments.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
