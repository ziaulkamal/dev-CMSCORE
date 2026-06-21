/**
 * src/modules/settings/settings.controller.ts
 * Endpoint settings (PRD §10.1): baca & upsert. Butuh manage_settings.
 */
import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@Controller('settings')
export class SettingController {
  constructor(private readonly service: SettingService) {}

  @RequireCapabilities('manage_settings')
  @Get()
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_settings')
  @Put()
  async update(@Body() dto: UpdateSettingsDto) {
    return ok(await this.service.update(dto.settings));
  }
}
