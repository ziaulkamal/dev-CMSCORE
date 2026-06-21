/**
 * src/modules/settings/settings.service.ts
 * Settings key-value global (PRD §10.1): baca semua, upsert batch.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Kembalikan settings sebagai map key → value. */
  async list() {
    const rows = await this.prisma.setting.findMany({ take: 200 });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  /** Upsert seluruh pasangan key-value dalam satu transaksi. */
  async update(settings: Record<string, unknown>) {
    const ops = Object.entries(settings).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { key },
        update: { value: value as Prisma.InputJsonValue },
        create: { key, value: value as Prisma.InputJsonValue },
      }),
    );
    await this.prisma.$transaction(ops);
    return this.list();
  }
}
