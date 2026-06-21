// src/modules/webhooks/webhooks.module.ts — wiring webhook: queue, processor, listener event.
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookController } from './webhooks.controller';
import { WebhookService } from './webhooks.service';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';
import { WebhookEventsListener } from './webhook-events.listener';
import { QUEUE_WEBHOOK_DELIVERY } from '../../common/queue/queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_WEBHOOK_DELIVERY })],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookDeliveryProcessor, WebhookEventsListener],
  exports: [WebhookService],
})
export class WebhookModule {}
