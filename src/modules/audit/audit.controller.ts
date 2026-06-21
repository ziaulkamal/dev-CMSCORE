// src/modules/audit/audit.controller.ts — endpoint audit (stub listing).
import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Misc')
@ApiBearerAuth('bearer')
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @RequireCapabilities('manage_users')
  @ApiOperation({ summary: 'Daftar audit log' })
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
