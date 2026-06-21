/**
 * src/modules/taxonomies/taxonomies.controller.ts
 * Endpoint taxonomy & term (PRD §10.1). Baca publik; tulis butuh manage_settings.
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaxonomyService } from './taxonomies.service';
import { CreateTaxonomyDto, CreateTermDto } from './dto/taxonomy.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Taxonomy')
@Controller('taxonomies')
export class TaxonomyController {
  constructor(private readonly service: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Daftar taxonomy' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Post()
  @ApiOperation({ summary: 'Buat taxonomy' })
  async create(@Body() dto: CreateTaxonomyDto) {
    return ok(await this.service.create(dto));
  }

  @Public()
  @Get(':slug/terms')
  @ApiOperation({
    summary: 'Daftar term',
    description: 'Term di bawah taxonomy (identifikasi via slug).',
  })
  async listTerms(@Param('slug') slug: string) {
    return ok(await this.service.listTerms(slug));
  }

  @RequireCapabilities('manage_settings')
  @ApiBearerAuth('bearer')
  @Post(':slug/terms')
  @ApiOperation({ summary: 'Buat term' })
  async createTerm(@Param('slug') slug: string, @Body() dto: CreateTermDto) {
    return ok(await this.service.createTerm(slug, dto));
  }
}
