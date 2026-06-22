// src/modules/dashboard/dashboard.controller.ts — ringkasan dashboard per role.
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { ok } from '../../common/http/api-response';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Ringkasan dashboard',
    description: 'Metrik difilter capability pemanggil.',
  })
  async summary(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.summary(user));
  }
}
