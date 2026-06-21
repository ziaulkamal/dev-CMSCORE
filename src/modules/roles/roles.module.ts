// src/modules/roles/roles.module.ts — wiring modul roles (stub).
import { Module } from '@nestjs/common';
import { RoleController } from './roles.controller';
import { RoleService } from './roles.service';

@Module({
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
