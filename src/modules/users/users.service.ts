/**
 * src/modules/users/users.service.ts
 * User & akun login (PRD §9/§10): listing aman (tanpa hash), create + assign role.
 */
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain.error';
import { CreateUserDto } from './dto/create-user.dto';

/** Proyeksi aman: jangan pernah kembalikan password_hash ke klien. */
const SAFE_SELECT = {
  id: true,
  email: true,
  status: true,
  displayName: true,
  avatarMediaId: true,
  lastLoginAt: true,
  bannedAt: true,
  bannedReason: true,
  createdAt: true,
  avatarMedia: { select: { fileUrl: true } },
  roles: { select: { role: { select: { name: true } } } },
} as const;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.user.findMany({
      take: 50,
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((u) => this.shape(u));
  }

  /** Detail satu user (tanpa password_hash). */
  async get(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw new NotFoundError('User tidak ditemukan');
    return this.shape(user);
  }

  /**
   * Ban user: set status 'banned' + timestamp/alasan, cabut seluruh refresh token.
   * Token akses yang masih hidup otomatis ditolak JwtStrategy (status !== 'active').
   */
  async ban(id: string, reason?: string) {
    await this.get(id); // 404 bila tak ada
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status: 'banned', bannedAt: new Date(), bannedReason: reason ?? null },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return this.get(id);
  }

  /** Unban user: kembalikan status ke 'active', bersihkan jejak ban. */
  async unban(id: string) {
    await this.get(id);
    await this.prisma.user.update({
      where: { id },
      data: { status: 'active', bannedAt: null, bannedReason: null },
    });
    return this.get(id);
  }

  /** Bentuk respons konsisten: flatten roles + resolve avatar_url. */
  private shape(u: {
    id: string;
    email: string;
    status: string;
    displayName: string | null;
    avatarMediaId: string | null;
    lastLoginAt: Date | null;
    bannedAt: Date | null;
    bannedReason: string | null;
    createdAt: Date;
    avatarMedia: { fileUrl: string } | null;
    roles: { role: { name: string } }[];
  }) {
    return {
      id: u.id,
      email: u.email,
      status: u.status,
      display_name: u.displayName,
      avatar_media_id: u.avatarMediaId,
      avatar_url: u.avatarMedia?.fileUrl ?? null,
      last_login_at: u.lastLoginAt,
      banned_at: u.bannedAt,
      banned_reason: u.bannedReason,
      created_at: u.createdAt,
      roles: u.roles.map((r) => r.role.name),
    };
  }

  /** Buat user: hash password (argon2), validasi & assign role dalam satu transaksi. */
  async create(dto: CreateUserDto) {
    const dup = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (dup) throw new ConflictError('EMAIL_EXISTS', 'Email sudah terdaftar');

    const roles = await this.prisma.role.findMany({ where: { name: { in: dto.roles } } });
    if (roles.length !== dto.roles.length) {
      throw new ValidationError('Sebagian role tidak dikenal', { roles: dto.roles });
    }

    const passwordHash = await argon2.hash(dto.password);
    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        roles: { create: roles.map((r) => ({ roleId: r.id })) },
      },
      select: SAFE_SELECT,
    });
    return this.shape(created);
  }
}
