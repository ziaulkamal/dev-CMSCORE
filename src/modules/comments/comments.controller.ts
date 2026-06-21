/**
 * src/modules/comments/comments.controller.ts
 * Endpoint komentar (PRD §10.1): list moderasi global, list/create per konten, moderasi status.
 */
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommentService } from './comments.service';
import { CreateCommentDto, ModerateCommentDto } from './dto/comment.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { ok } from '../../common/http/api-response';

/** Listing moderasi global & moderasi per komentar. */
@Controller('comments')
export class CommentController {
  constructor(private readonly service: CommentService) {}

  @RequireCapabilities('manage_comments')
  @Get()
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_comments')
  @Put(':id/status')
  async moderate(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    return ok(await this.service.moderate(id, dto.status));
  }
}

/** Komentar yang ter-nest di bawah satu konten. */
@Controller('contents/:contentId/comments')
export class ContentCommentController {
  constructor(private readonly service: CommentService) {}

  @Public()
  @Get()
  async list(@Param('contentId') contentId: string) {
    return ok(await this.service.listForContent(contentId));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  async create(
    @Param('contentId') contentId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return ok(await this.service.create(contentId, dto, user));
  }
}
