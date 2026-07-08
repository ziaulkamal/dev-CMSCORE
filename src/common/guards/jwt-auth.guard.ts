// src/common/guards/jwt-auth.guard.ts — guard auth global yang menghormati @Public().
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Wajibkan JWT kecuali handler/controller ditandai @Public().
 *
 * Untuk route @Public(): tetap JALANKAN strategi JWT (agar request.user terisi
 * bila token valid dikirim), tetapi JANGAN menolak request tanpa/dengan token
 * tak valid. Ini membuat endpoint publik bisa "auth opsional" — mis. GET konten
 * draft terlihat oleh pemiliknya yang login, tetap 404 untuk anonim.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
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

  /**
   * Untuk route publik, jangan lempar saat user tak ada / token invalid:
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
