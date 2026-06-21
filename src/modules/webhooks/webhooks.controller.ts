/**
 * src/modules/webhooks/webhooks.controller.ts
 * Endpoint webhook (PRD §10/§11): list, register, hapus. Capability manage_settings.
 */
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Webhook')
@ApiBearerAuth('bearer')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  @RequireCapabilities('manage_settings')
  @Get()
  @ApiOperation({ summary: 'Daftar webhook' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_settings')
  @Post()
  @ApiOperation({ summary: 'Daftarkan webhook', description: 'Secret di-generate bila kosong.' })
  async create(@Body() dto: CreateWebhookDto) {
    return ok(await this.service.create(dto));
  }

  @RequireCapabilities('manage_settings')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus webhook' })
  async remove(@Param('id') id: string) {
    return ok(await this.service.remove(id));
  }
}
