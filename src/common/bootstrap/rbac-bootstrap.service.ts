/**
 * src/common/bootstrap/rbac-bootstrap.service.ts
 * Bootstrap RBAC (capability, role, mapping), taksonomi dasar, dan super admin saat
 * aplikasi start — idempotent (semua upsert). Menggantikan peran prisma/seed.ts di
 * PRODUKSI, di mana ts-node tidak tersedia (di-prune) & prisma/ tak ikut dikompilasi.
 *
 * Di produksi: kredensial admin WAJIB dari env (SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD)
 * dan TIDAK boleh memakai default → bila kosong/default, boot GAGAL dengan pesan jelas.
 */
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import {
  BASE_TAXONOMIES,
  CAPABILITIES,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  ROLES,
} from './rbac.constants';

@Injectable()
export class RbacBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedCapabilities();
    await this.seedRoles();
    await this.seedTaxonomies();
    await this.seedSuperAdmin();
  }

  private async seedCapabilities(): Promise<void> {
    for (const key of CAPABILITIES) {
      await this.prisma.capability.upsert({ where: { key }, update: {}, create: { key } });
    }
  }

  private async seedRoles(): Promise<void> {
    for (const [name, { label, caps }] of Object.entries(ROLES)) {
      const role = await this.prisma.role.upsert({
        where: { name },
        update: { label },
        create: { name, label },
      });
      for (const key of caps) {
        const cap = await this.prisma.capability.findUniqueOrThrow({ where: { key } });
        await this.prisma.roleCapability.upsert({
          where: { roleId_capabilityId: { roleId: role.id, capabilityId: cap.id } },
          update: {},
          create: { roleId: role.id, capabilityId: cap.id },
        });
      }
    }
  }

  private async seedTaxonomies(): Promise<void> {
    for (const tax of BASE_TAXONOMIES) {
      await this.prisma.taxonomy.upsert({
        where: { slug: tax.slug },
        update: {},
        create: { slug: tax.slug, label: tax.label, hierarchical: tax.hierarchical },
      });
    }
  }

  private async seedSuperAdmin(): Promise<void> {
    const isProd = this.config.get<string>('app.nodeEnv', 'development') === 'production';
    const { email, password } = this.resolveAdminCredentials(isProd);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await this.prisma.user.create({
        data: { email, passwordHash: await argon2.hash(password) },
      }));

    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: 'super_admin' } });
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });

    if (existing) {
      this.logger.log(`Super admin sudah ada: ${email}`);
    } else {
      this.logger.log(`Super admin dibuat: ${email}`);
    }
  }

  /**
   * Ambil kredensial admin dari env. Di produksi WAJIB di-set & bukan default;
   * bila melanggar, lempar error agar boot berhenti (fail-fast) dengan pesan jelas.
   */
  private resolveAdminCredentials(isProd: boolean): { email: string; password: string } {
    const email = process.env.SEED_ADMIN_EMAIL?.trim();
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (isProd) {
      const problems: string[] = [];
      if (!email || email === DEFAULT_ADMIN_EMAIL) {
        problems.push('SEED_ADMIN_EMAIL wajib di-set (bukan default)');
      }
      if (!password || password === DEFAULT_ADMIN_PASSWORD) {
        problems.push('SEED_ADMIN_PASSWORD wajib di-set (bukan default)');
      }
      if (problems.length) {
        throw new Error(
          `[RbacBootstrap] Kredensial super admin produksi tidak valid: ${problems.join('; ')}. ` +
            `Isi di .env.prod (lihat .env.prod.example) lalu jalankan ulang.`,
        );
      }
      return { email: email as string, password: password as string };
    }

    // Non-produksi: izinkan default, tapi peringatkan bila dipakai.
    const resolvedEmail = email || DEFAULT_ADMIN_EMAIL;
    const resolvedPassword = password || DEFAULT_ADMIN_PASSWORD;
    if (resolvedEmail === DEFAULT_ADMIN_EMAIL || resolvedPassword === DEFAULT_ADMIN_PASSWORD) {
      this.logger.warn(
        `Memakai kredensial admin default (${resolvedEmail}). JANGAN gunakan di produksi.`,
      );
    }
    return { email: resolvedEmail, password: resolvedPassword };
  }
}
