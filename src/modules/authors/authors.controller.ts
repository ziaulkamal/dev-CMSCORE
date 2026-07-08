/**
 * src/modules/authors/authors.controller.ts
 * Endpoint author (PRD §10.1). Baca publik; tulis butuh manage_users.
 */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthorService } from './authors.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Author')
@Controller('authors')
export class AuthorController {
  constructor(private readonly service: AuthorService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Daftar author' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_users')
  @ApiBearerAuth('bearer')
  @Post()
  @ApiOperation({ summary: 'Buat author' })
  async create(@Body() dto: CreateAuthorDto) {
    return ok(await this.service.create(dto));
  }

  @RequireCapabilities('manage_users')
  @ApiBearerAuth('bearer')
  @Put(':id')
  @ApiOperation({ summary: 'Update author' })
  async update(@Param('id') id: string, @Body() dto: UpdateAuthorDto) {
    return ok(await this.service.update(id, dto));
  }

  @RequireCapabilities('manage_users')
  @ApiBearerAuth('bearer')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus author' })
  @ApiResponse({ status: 409, description: 'AUTHOR_IN_USE — masih dipakai byline konten.' })
  async remove(@Param('id') id: string) {
    return ok(await this.service.remove(id));
  }
}
