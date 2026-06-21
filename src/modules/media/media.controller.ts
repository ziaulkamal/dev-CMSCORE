// src/modules/media/media.controller.ts — endpoint media (stub listing).
import { Controller, Get } from '@nestjs/common';
import { MediaService } from './media.service';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @RequireCapabilities('manage_media')
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
