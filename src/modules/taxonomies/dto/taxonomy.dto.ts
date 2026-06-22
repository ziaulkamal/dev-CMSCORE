// src/modules/taxonomies/dto/taxonomy.dto.ts — payload taxonomy & term (PRD §10.1).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaxonomyDto {
  @ApiProperty({ example: 'category', maxLength: 60 })
  @IsString()
  @MaxLength(60)
  slug!: string;

  @ApiProperty({ example: 'Category', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ example: true, description: 'Mendukung hierarki parent-child' })
  @IsOptional()
  @IsBoolean()
  hierarchical?: boolean;
}

export class UpdateTaxonomyDto {
  @ApiPropertyOptional({ example: 'Category', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hierarchical?: boolean;
}

export class CreateTermDto {
  @ApiProperty({ example: 'Politik', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'politik',
    maxLength: 120,
    description: 'Slug; default dari name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ description: 'Deskripsi term' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID term induk (hierarki)' })
  @IsOptional()
  @IsString()
  parent_id?: string;
}

export class UpdateTermDto {
  @ApiPropertyOptional({ example: 'Politik', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'politik', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ description: 'Deskripsi term' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID term induk; null untuk jadikan root' })
  @IsOptional()
  @IsString()
  parent_id?: string | null;
}
