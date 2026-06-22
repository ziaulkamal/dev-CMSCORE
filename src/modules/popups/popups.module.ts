// src/modules/popups/popups.module.ts — wiring modul popups (Popup).
import { Module } from '@nestjs/common';
import { PopupsController } from './popups.controller';
import { PopupsService } from './popups.service';

@Module({
  controllers: [PopupsController],
  providers: [PopupsService],
  exports: [PopupsService],
})
export class PopupsModule {}
