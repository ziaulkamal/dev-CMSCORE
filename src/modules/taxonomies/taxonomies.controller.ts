// src/modules/taxonomies/taxonomies.controller.ts — endpoint taxonomies (stub listing).
import { Controller, Get } from '@nestjs/common';
import { TaxonomyService } from './taxonomies.service';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@Controller('taxonomies')
export class TaxonomyController {
  constructor(private readonly service: TaxonomyService) {}

  @Public()
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
