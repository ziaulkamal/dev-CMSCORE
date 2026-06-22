// src/modules/menus/menus.controller.ts — endpoint menu navigasi (tree).
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menus.service';
import { ReplaceMenuItemsDto } from './dto/menu.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Menu')
@Controller('menus')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Ambil menu navigasi', description: 'Tree 2 tingkat menu utama.' })
  async getTree() {
    return ok(await this.service.getTree());
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Put()
  @ApiOperation({
    summary: 'Simpan menu navigasi',
    description: 'Ganti seluruh item menu utama dari tree (hapus-lalu-buat).',
  })
  async replace(@Body() dto: ReplaceMenuItemsDto) {
    return ok(await this.service.replaceItems(dto.items));
  }
}
