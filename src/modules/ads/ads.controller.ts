/**
 * src/modules/ads/ads.controller.ts
 * Admin CRUD AdSlot (manage_settings) + endpoint publik slot aktif per posisi.
 */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateAdSlotDto, UpdateAdSlotDto } from './dto/ad-slot.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly service: AdsService) {}

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Slot iklan aktif', description: 'Dikelompokkan per posisi (publik).' })
  async active() {
    return ok(await this.service.listActiveByPosition());
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Get()
  @ApiOperation({ summary: 'Daftar ad slot' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Get(':id')
  @ApiOperation({ summary: 'Detail ad slot' })
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Post()
  @ApiOperation({ summary: 'Buat ad slot' })
  async create(@Body() dto: CreateAdSlotDto) {
    return ok(await this.service.create(dto));
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Put(':id')
  @ApiOperation({ summary: 'Ubah ad slot' })
  async update(@Param('id') id: string, @Body() dto: UpdateAdSlotDto) {
    return ok(await this.service.update(id, dto));
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus ad slot' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return ok({ success: true });
  }
}
