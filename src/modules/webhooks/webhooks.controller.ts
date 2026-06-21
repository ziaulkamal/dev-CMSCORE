// src/modules/webhooks/webhooks.controller.ts — endpoint webhooks (stub listing).
import { Controller, Get } from '@nestjs/common';
import { WebhookService } from './webhooks.service';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  @RequireCapabilities('manage_settings')
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
