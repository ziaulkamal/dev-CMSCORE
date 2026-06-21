// src/modules/redirects/redirects.controller.ts — endpoint redirects (stub listing).
import { Controller, Get } from '@nestjs/common';
import { RedirectService } from './redirects.service';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@Controller('redirects')
export class RedirectController {
  constructor(private readonly service: RedirectService) {}

  @Public()
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
