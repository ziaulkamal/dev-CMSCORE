// src/modules/comments/comments.controller.ts — endpoint comments (stub listing).
import { Controller, Get } from '@nestjs/common';
import { CommentService } from './comments.service';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@Controller('comments')
export class CommentController {
  constructor(private readonly service: CommentService) {}

  @RequireCapabilities('manage_comments')
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
