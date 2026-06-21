// src/modules/menus/menus.module.ts — wiring modul menus (stub).
import { Module } from '@nestjs/common';
import { MenuController } from './menus.controller';
import { MenuService } from './menus.service';

@Module({
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
