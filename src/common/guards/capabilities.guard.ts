// src/common/guards/capabilities.guard.ts — default-deny enforcement capability (RBAC).
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CAPABILITIES_KEY } from '../decorators/require-capabilities.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { ForbiddenError } from '../errors/domain.error';

/** Izinkan hanya bila user memiliki SEMUA capability yang diminta handler. */
@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(CAPABILITIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenError();

    const missing = required.filter((cap) => !user.capabilities.includes(cap));
    if (missing.length > 0) {
      throw new ForbiddenError('Capability tidak mencukupi', { missing });
    }
    return true;
  }
}
