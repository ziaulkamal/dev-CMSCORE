/**
 * src/modules/redirects/redirects.controller.ts
 * Endpoint redirect (PRD §10.1): list (publik, untuk lookup proxy) & create (manage_settings).
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedirectService } from './redirects.service';
import { CreateRedirectDto } from './dto/create-redirect.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Redirect')
@Controller('redirects')
export class RedirectController {
  constructor(private readonly service: RedirectService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Daftar redirect' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Post()
  @ApiOperation({ summary: 'Buat redirect' })
  async create(@Body() dto: CreateRedirectDto) {
    return ok(await this.service.create(dto));
  }
}
