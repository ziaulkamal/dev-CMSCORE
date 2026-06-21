// src/modules/redirects/redirects.module.ts — wiring modul redirects (stub).
import { Module } from '@nestjs/common';
import { RedirectController } from './redirects.controller';
import { RedirectService } from './redirects.service';

@Module({
  controllers: [RedirectController],
  providers: [RedirectService],
  exports: [RedirectService],
})
export class RedirectModule {}
