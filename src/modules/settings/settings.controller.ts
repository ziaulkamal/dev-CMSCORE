/**
 * src/modules/settings/settings.controller.ts
 * Endpoint settings (PRD §10.1): baca & upsert. Butuh manage_settings.
 */
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Settings')
@ApiBearerAuth('bearer')
@Controller('settings')
export class SettingController {
  constructor(private readonly service: SettingService) {}

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Baca settings publik',
    description:
      'Subset aman untuk situs publik (namespace site.*, home.*, social.*). ' +
      'Tanpa auth. Key sensitif tidak diekspos.',
  })
  async listPublic() {
    return ok(await this.service.listPublic());
  }

  @RequireCapabilities('manage_settings')
  @Get()
  @ApiOperation({ summary: 'Baca settings', description: 'Map key-value global (butuh auth).' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_settings')
  @Put()
  @ApiOperation({ summary: 'Upsert settings (batch)' })
  async update(@Body() dto: UpdateSettingsDto) {
    return ok(await this.service.update(dto.settings));
  }
}
