// src/common/decorators/require-capabilities.decorator.ts — deklarasi capability wajib pada handler.
import { SetMetadata } from '@nestjs/common';

export const CAPABILITIES_KEY = 'requiredCapabilities';

/** Tegakkan kepemilikan capability (RBAC PRD §9) via CapabilitiesGuard. */
export const RequireCapabilities = (...capabilities: string[]) =>
  SetMetadata(CAPABILITIES_KEY, capabilities);
