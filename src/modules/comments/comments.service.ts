/**
 * src/modules/comments/comments.service.ts
 * Comment (PRD §10): buat (publik, default pending), list per konten, moderasi status.
 */
import { Injectable } from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { NotFoundError } from '../../common/errors/domain.error';
import { sanitizeBody } from '../../common/utils/sanitize';
import { APP_EVENTS } from '../../common/events/app-events';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /** Listing global untuk moderasi (manage_comments). */
  list() {
    return this.prisma.comment.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
  }

  /** Komentar approved untuk satu konten (tampilan publik). */
  async listForContent(contentId: string) {
    await this.assertContentExists(contentId);
    return this.prisma.comment.findMany({
      where: { contentId, status: 'approved' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  /** Buat komentar; body disanitasi, status awal pending (anti-spam). */
  async create(contentId: string, dto: CreateCommentDto, user?: AuthenticatedUser) {
    await this.assertContentExists(contentId);
    const comment = await this.prisma.comment.create({
      data: {
        contentId,
        parentId: dto.parent_id ?? null,
        body: sanitizeBody(dto.body) ?? '',
        userId: user?.id ?? null,
        guestName: user ? null : (dto.guest_name ?? null),
        guestEmail: user ? null : (dto.guest_email ?? null),
        status: 'pending',
      },
    });
    this.events.emit(APP_EVENTS.commentCreated, {
      comment_id: comment.id,
      content_id: contentId,
      status: comment.status,
    });
    return comment;
  }

  /** Moderasi: approve/spam/trash/pending. */
  async moderate(id: string, status: CommentStatus) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundError('Komentar tidak ditemukan');

    const updated = await this.prisma.comment.update({ where: { id }, data: { status } });
    this.events.emit(APP_EVENTS.commentStatusChanged, {
      comment_id: updated.id,
      status: updated.status,
    });
    return updated;
  }

  private async assertContentExists(contentId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    });
    if (!content) throw new NotFoundError('Content tidak ditemukan');
  }
}
