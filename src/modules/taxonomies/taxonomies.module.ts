// src/modules/taxonomies/taxonomies.module.ts — wiring modul taxonomies (stub).
import { Module } from '@nestjs/common';
import { TaxonomyController } from './taxonomies.controller';
import { TaxonomyService } from './taxonomies.service';

@Module({
  controllers: [TaxonomyController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
