// src/modules/auth/strategies/jwt.strategy.ts — validasi access token & bangun principal.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';
import { AuthenticatedUser } from '../../../common/auth/authenticated-user';
import { UnauthorizedError } from '../../../common/errors/domain.error';
import type { JwtConfig } from '../../../common/config/configuration';

interface JwtPayload {
  sub: string;
  jti: string;
}

/** Verifikasi signature/expiry lalu muat capabilities terkini dari DB. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authRepo: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<JwtConfig>('jwt').accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const access = await this.authRepo.findUserWithAccess(payload.sub);
    if (!access || access.status !== 'active') {
      throw new UnauthorizedError('Sesi tidak valid');
    }
    return {
      id: access.id,
      email: access.email,
      roles: access.roles,
      capabilities: access.capabilities,
    };
  }
}
