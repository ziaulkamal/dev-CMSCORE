// src/modules/users/users.service.ts — User & akun login (RBAC).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service users — listing dasar; perluas sesuai PRD. */
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.user.findMany({ take: 50 });
  }
}
