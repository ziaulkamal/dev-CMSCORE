// src/common/decorators/current-user.decorator.ts — ambil principal dari request.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user';

/** Inject AuthenticatedUser dari request yang sudah lewat guard auth. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
