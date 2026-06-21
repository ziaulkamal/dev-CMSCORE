/**
 * src/modules/auth/auth.service.ts
 * Login, refresh-token rotation + reuse detection, dan API key (PRD §8).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UnauthorizedError } from '../../common/errors/domain.error';
import type { JwtConfig } from '../../common/config/configuration';

export interface TokenBundle {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: 'Bearer';
}

/** SHA-256 untuk menyimpan token secara ter-hash (refresh & api key). */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get jwtCfg(): JwtConfig {
    return this.config.getOrThrow<JwtConfig>('jwt');
  }

  /** Verifikasi kredensial lalu terbitkan access + refresh token. */
  async login(dto: LoginDto): Promise<TokenBundle> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    // Pesan generik agar tidak membocorkan ada/tidaknya email (anti user-enumeration).
    if (!user || user.status !== 'active') throw new UnauthorizedError('Kredensial tidak valid');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedError('Kredensial tidak valid');

    return this.issueTokens(user.id);
  }

  /** Rotasi refresh token; deteksi reuse → cabut seluruh rantai (PRD §8). */
  async refresh(rawRefresh: string): Promise<TokenBundle> {
    const record = await this.authRepo.findRefreshByHash(hashToken(rawRefresh));
    if (!record) throw new UnauthorizedError('Refresh token tidak valid');

    if (record.revokedAt) {
      // Token sudah dicabut tapi dipakai lagi → indikasi pencurian token.
      this.logger.warn(`Refresh reuse terdeteksi untuk user ${record.userId}`);
      await this.authRepo.revokeAllRefreshTokens(record.userId);
      throw new UnauthorizedError('Refresh token sudah dipakai ulang');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token kedaluwarsa');
    }

    await this.authRepo.revokeRefreshToken(record.id);
    return this.issueTokens(record.userId, record.id);
  }

  /** Logout: cabut refresh token yang diberikan (idempotent). */
  async logout(rawRefresh: string): Promise<void> {
    const record = await this.authRepo.findRefreshByHash(hashToken(rawRefresh));
    if (record && !record.revokedAt) await this.authRepo.revokeRefreshToken(record.id);
  }

  /** Buat API key; raw hanya dikembalikan sekali (disimpan ter-hash). */
  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    const raw = `ak_${randomBytes(24).toString('base64url')}`;
    const apiKey = await this.authRepo.createApiKey({
      userId,
      keyHash: hashToken(raw),
      label: dto.label,
      scopes: dto.scopes ?? [],
    });
    return { id: apiKey.id, label: apiKey.label, scopes: apiKey.scopes, api_key: raw };
  }

  async revokeApiKey(userId: string, id: string): Promise<void> {
    await this.authRepo.revokeApiKey(id, userId);
  }

  /** Terbitkan access (JWT) + refresh (random, ter-hash) terkait rotasi. */
  private async issueTokens(userId: string, rotatedFrom?: string): Promise<TokenBundle> {
    const cfg = this.jwtCfg;
    const accessToken = await this.jwt.signAsync(
      { sub: userId, jti: randomUUID() },
      { secret: cfg.accessSecret, expiresIn: cfg.accessTtl },
    );

    const rawRefresh = `rt_${randomBytes(32).toString('base64url')}`;
    await this.authRepo.createRefreshToken({
      userId,
      tokenHash: hashToken(rawRefresh),
      expiresAt: new Date(Date.now() + cfg.refreshTtl * 1000),
      rotatedFrom,
    });

    return {
      access_token: accessToken,
      expires_in: cfg.accessTtl,
      refresh_token: rawRefresh,
      token_type: 'Bearer',
    };
  }
}
