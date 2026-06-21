// src/common/decorators/public.decorator.ts — tandai route yang melewati auth guard.
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Lewati JwtAuthGuard untuk endpoint publik (mis. login, feed publik). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
