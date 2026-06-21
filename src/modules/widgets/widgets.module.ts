// src/modules/widgets/widgets.module.ts — wiring modul widgets (stub).
import { Module } from '@nestjs/common';
import { WidgetController } from './widgets.controller';
import { WidgetService } from './widgets.service';

@Module({
  controllers: [WidgetController],
  providers: [WidgetService],
  exports: [WidgetService],
})
export class WidgetModule {}
