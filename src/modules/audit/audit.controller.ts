// src/modules/audit/audit.controller.ts — endpoint audit (stub listing).
import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @RequireCapabilities('manage_users')
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
