/**
 * src/modules/auth/api-key.service.ts
 * Autentikasi via header X-API-Key. Key disimpan ter-hash (SHA-256); di sini kita
 * hash header lalu cari padanannya, validasi belum dicabut, muat principal user
 * (capabilities), dan catat last_used_at. Dipakai oleh JwtAuthGuard sebagai
 * jalur alternatif selain Bearer JWT.
 */
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';

/** Sama dengan hashToken() di AuthService — SHA-256 hex. */
function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class ApiKeyService {
  constructor(private readonly authRepo: AuthRepository) {}

  /**
   * Validasi raw API key. Kembalikan principal bila valid & aktif, atau null.
   * Null menandakan header tak dikenal/dicabut → caller memperlakukan sebagai anonim
   * (untuk route publik) atau menolak (untuk route terproteksi).
   */
  async validate(rawKey: string): Promise<AuthenticatedUser | null> {
    if (!rawKey) return null;

    const record = await this.authRepo.findApiKeyByHash(hashKey(rawKey));
    if (!record || record.revokedAt) return null;

    const access = await this.authRepo.findUserWithAccess(record.userId);
    if (!access || access.status !== 'active') return null;

    // Catat pemakaian (best-effort; jangan gagalkan request bila update gagal).
    await this.authRepo.touchApiKey(record.id).catch(() => undefined);

    return {
      id: access.id,
      email: access.email,
      roles: access.roles,
      capabilities: access.capabilities,
      viaApiKey: true,
    };
  }
}
