// src/modules/widgets/widgets.controller.ts — endpoint widgets (stub listing).
import { Controller, Get } from '@nestjs/common';
import { WidgetService } from './widgets.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Misc')
@Controller('widgets')
export class WidgetController {
  constructor(private readonly service: WidgetService) {}

  @Public()
  @ApiOperation({ summary: 'Daftar widget' })
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
