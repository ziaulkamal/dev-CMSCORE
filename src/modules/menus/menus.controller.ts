// src/modules/menus/menus.controller.ts — endpoint menus (stub listing).
import { Controller, Get } from '@nestjs/common';
import { MenuService } from './menus.service';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@Controller('menus')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Public()
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
