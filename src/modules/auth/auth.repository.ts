// src/modules/auth/auth.repository.ts — akses data untuk auth (user, role, token, api key).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Semua query auth terpusat di sini (repository pattern, DRY). */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Ambil user + roles + capabilities (untuk principal & klaim JWT). */
  async findUserWithAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: { include: { capabilities: { include: { capability: true } } } } },
        },
      },
    });
    if (!user) return null;

    const roles = user.roles.map((ur) => ur.role.name);
    const capabilities = [
      ...new Set(user.roles.flatMap((ur) => ur.role.capabilities.map((rc) => rc.capability.key))),
    ];
    return { id: user.id, email: user.email, status: user.status, roles, capabilities };
  }

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    rotatedFrom?: string;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  /** Cabut seluruh refresh token user (dipakai saat deteksi reuse / logout-all). */
  revokeAllRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  createApiKey(data: { userId: string; keyHash: string; label: string; scopes: string[] }) {
    return this.prisma.apiKey.create({ data });
  }

  findApiKeyByHash(keyHash: string) {
    return this.prisma.apiKey.findUnique({ where: { keyHash } });
  }

  revokeApiKey(id: string, userId: string) {
    return this.prisma.apiKey.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  touchApiKey(id: string) {
    return this.prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  }
}
