// src/modules/webhooks/webhooks.module.ts — wiring modul webhooks (stub).
import { Module } from '@nestjs/common';
import { WebhookController } from './webhooks.controller';
import { WebhookService } from './webhooks.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
