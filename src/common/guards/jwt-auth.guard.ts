// src/common/guards/jwt-auth.guard.ts — guard auth global: Bearer JWT ATAU X-API-Key, hormati @Public().
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiKeyService } from '../../modules/auth/api-key.service';
import { AuthenticatedUser } from '../auth/authenticated-user';

/**
 * Wajibkan autentikasi kecuali handler/controller ditandai @Public().
 * Dua jalur diterima:
 *   - `Authorization: Bearer <jwt>`  → strategi passport-jwt.
 *   - `X-API-Key: <key>`             → ApiKeyService (fallback bila JWT tak ada/invalid).
 *
 * Untuk route @Public(): tetap coba isi request.user bila kredensial valid dikirim,
 * tetapi JANGAN menolak request anonim (mis. GET konten draft terlihat pemiliknya,
 * tetap 404 untuk anonim).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyService: ApiKeyService,
  ) {
    super();
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  private extractApiKey(req: Request): string | undefined {
    const header = req.headers['x-api-key'];
    return Array.isArray(header) ? header[0] : header;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const isPublic = this.isPublic(context);

    // 1) Jalur X-API-Key: bila header dikirim, validasi lebih dulu. Key valid →
    //    isi request.user & lanjut. Key ada tapi tak valid → tolak (route
    //    terproteksi) atau anonim (route publik).
    const rawKey = this.extractApiKey(req);
    if (rawKey) {
      const principal = await this.apiKeyService.validate(rawKey);
      if (principal) {
        req.user = principal;
        return true;
      }
      if (!isPublic) {
        throw new UnauthorizedException('API key tidak valid');
      }
      return true; // publik: perlakukan sebagai anonim
    }

    // 2) Jalur Bearer JWT (perilaku lama). Untuk publik, jangan lempar saat anonim.
    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch (err) {
      if (isPublic) return true;
      throw err;
    }
  }

  /**
   * Untuk route publik jalur JWT: jangan lempar saat user tak ada / token invalid;
   * kembalikan undefined (anonim). Route terproteksi tetap menolak via super.
   */
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    if (this.isPublic(context)) {
      return (user ?? undefined) as TUser;
    }
    return super.handleRequest(err, user, info, context, status) as TUser;
  }
}
