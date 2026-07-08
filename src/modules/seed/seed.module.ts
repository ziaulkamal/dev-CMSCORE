// src/modules/seed/seed.module.ts — wiring modul generator data dummy.
import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
