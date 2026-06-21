// src/modules/comments/comments.module.ts — wiring modul comments (global + nested).
import { Module } from '@nestjs/common';
import { CommentController, ContentCommentController } from './comments.controller';
import { CommentService } from './comments.service';

@Module({
  controllers: [CommentController, ContentCommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
