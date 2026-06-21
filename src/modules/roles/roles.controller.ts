// src/modules/roles/roles.controller.ts — endpoint roles (stub listing).
import { Controller, Get } from '@nestjs/common';
import { RoleService } from './roles.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Misc')
@Controller('roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Public()
  @ApiOperation({ summary: 'Daftar role' })
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
