// src/modules/settings/settings.controller.ts — endpoint settings (stub listing).
import { Controller, Get } from '@nestjs/common';
import { SettingService } from './settings.service';
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
}
