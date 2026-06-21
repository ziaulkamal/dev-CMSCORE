// src/modules/settings/settings.service.ts — Settings key-value global.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service settings — listing dasar; perluas sesuai PRD. */
@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.setting.findMany({ take: 50 });
  }
}
