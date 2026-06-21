// src/modules/taxonomies/dto/taxonomy.dto.ts — payload taxonomy & term (PRD §10.1).
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaxonomyDto {
  @IsString()
  @MaxLength(60)
  slug!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsBoolean()
  hierarchical?: boolean;
}

export class CreateTermDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
