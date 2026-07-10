/**
 * src/modules/settings/settings.service.ts
 * Settings key-value global (PRD §10.1): baca semua, upsert batch.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Namespace yang AMAN dibaca publik (identitas situs, konfigurasi beranda,
 * tautan sosial). Key di luar ini (mis. kredensial/konfig internal) TIDAK ikut
 * di endpoint publik. Cocokkan berdasarkan prefix "<ns>.".
 */
const PUBLIC_SETTING_NAMESPACES = ['site.', 'home.', 'social.'] as const;

function isPublicKey(key: string): boolean {
  return PUBLIC_SETTING_NAMESPACES.some((ns) => key.startsWith(ns));
}

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Kembalikan settings sebagai map key → value. */
  async list() {
    const rows = await this.prisma.setting.findMany({ take: 200 });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  /** Subset settings yang aman dibaca publik (whitelist namespace). */
  async listPublic() {
    const rows = await this.prisma.setting.findMany({ take: 200 });
    return Object.fromEntries(rows.filter((r) => isPublicKey(r.key)).map((r) => [r.key, r.value]));
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
