/**
 * src/modules/popups/popups.controller.ts
 * Admin CRUD Popup (manage_settings) + endpoint publik popup aktif.
 */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PopupsService } from './popups.service';
import { CreatePopupDto, UpdatePopupDto } from './dto/popup.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Popups')
@Controller('popups')
export class PopupsController {
  constructor(private readonly service: PopupsService) {}

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Popup aktif', description: 'Aktif & dalam rentang tanggal (publik).' })
  async active() {
    return ok(await this.service.listActive());
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Get()
  @ApiOperation({ summary: 'Daftar popup' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Get(':id')
  @ApiOperation({ summary: 'Detail popup' })
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Post()
  @ApiOperation({ summary: 'Buat popup' })
  async create(@Body() dto: CreatePopupDto) {
    return ok(await this.service.create(dto));
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Put(':id')
  @ApiOperation({ summary: 'Ubah popup' })
  async update(@Param('id') id: string, @Body() dto: UpdatePopupDto) {
    return ok(await this.service.update(id, dto));
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus popup' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return ok({ success: true });
  }
}
