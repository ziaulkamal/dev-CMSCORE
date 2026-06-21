/**
 * src/modules/authors/authors.controller.ts
 * Endpoint author (PRD §10.1). Baca publik; tulis butuh manage_users.
 */
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { AuthorService } from './authors.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@Controller('authors')
export class AuthorController {
  constructor(private readonly service: AuthorService) {}

  @Public()
  @Get()
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_users')
  @Post()
  async create(@Body() dto: CreateAuthorDto) {
    return ok(await this.service.create(dto));
  }

  @RequireCapabilities('manage_users')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAuthorDto) {
    return ok(await this.service.update(id, dto));
  }
}
