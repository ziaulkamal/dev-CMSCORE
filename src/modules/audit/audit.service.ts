// src/modules/audit/audit.service.ts — Audit log (read-only).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service audit — listing dasar; perluas sesuai PRD. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.auditLog.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
  }

  /** Catat satu aksi audit (best-effort; jangan gagalkan operasi utama). */
  async log(entry: {
    actorId?: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        metadata: (entry.metadata ?? undefined) as never,
        ip: entry.ip ?? null,
      },
    });
  }
}
