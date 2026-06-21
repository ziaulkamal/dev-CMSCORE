// src/modules/roles/roles.service.ts — Role & capabilities (read-only listing).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service roles — listing dasar; perluas sesuai PRD. */
@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.role.findMany({ take: 50 });
  }
}
