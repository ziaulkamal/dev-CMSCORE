// src/modules/settings/settings.module.ts — wiring modul settings (stub).
import { Module } from '@nestjs/common';
import { SettingController } from './settings.controller';
import { SettingService } from './settings.service';

@Module({
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
