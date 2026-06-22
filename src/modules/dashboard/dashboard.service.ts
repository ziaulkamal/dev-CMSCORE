/**
 * src/modules/dashboard/dashboard.service.ts
 * Ringkasan dashboard difilter capability pemanggil (req #4).
 * Hanya kembalikan metrik yang boleh dilihat role tersebut.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(user: AuthenticatedUser) {
    const caps = new Set(user.capabilities);
    const result: Record<string, unknown> = {};

    // Konten per status (semua yang boleh kelola konten orang lain melihat global).
    const canSeeAll = caps.has('edit_others_post') || caps.has('manage_users');

    if (canSeeAll) {
      const byStatus = await this.prisma.content.groupBy({
        by: ['status'],
        _count: { _all: true },
      });
      result.content_by_status = Object.fromEntries(
        byStatus.map((r) => [r.status, r._count._all]),
      );
    } else {
      // Author/Contributor: hanya konten miliknya.
      const byStatus = await this.prisma.content.groupBy({
        by: ['status'],
        where: { createdById: user.id },
        _count: { _all: true },
      });
      result.my_content_by_status = Object.fromEntries(
        byStatus.map((r) => [r.status, r._count._all]),
      );
    }

    if (caps.has('manage_comments')) {
      result.pending_comments = await this.prisma.comment.count({
        where: { status: 'pending' },
      });
    }

    if (caps.has('manage_media')) {
      result.media_count = await this.prisma.media.count();
    }

    if (caps.has('manage_users')) {
      result.user_count = await this.prisma.user.count();
      result.banned_users = await this.prisma.user.count({ where: { status: 'banned' } });
    }

    // Audit terbaru hanya untuk admin (punya manage_settings).
    if (caps.has('manage_settings')) {
      result.recent_audit = await this.prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, action: true, targetType: true, createdAt: true },
      });
    }

    return result;
  }
}
