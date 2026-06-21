// src/modules/audit/audit.service.ts — Audit log (read-only).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service audit — listing dasar; perluas sesuai PRD. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.auditLog.findMany({ take: 50 });
  }
}
