// src/modules/widgets/widgets.controller.ts — endpoint widgets (stub listing).
import { Controller, Get } from '@nestjs/common';
import { WidgetService } from './widgets.service';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@Controller('widgets')
export class WidgetController {
  constructor(private readonly service: WidgetService) {}

  @Public()
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
