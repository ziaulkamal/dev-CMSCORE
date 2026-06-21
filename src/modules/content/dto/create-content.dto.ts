// src/modules/content/dto/create-content.dto.ts — payload create content (PRD §10.2).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { CONTENT_TYPES } from '../content-type.registry';

const TYPES = Object.keys(CONTENT_TYPES);

export class CreateContentDto {
  @ApiProperty({ enum: TYPES, example: 'post', description: 'Tipe konten (CPT)' })
  @IsIn(TYPES)
  type!: string;

  @ApiProperty({ example: 'Liputan Banjir Jakarta', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: '<p>Isi artikel…</p>', description: 'Body HTML (disanitasi)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: 'Ringkasan singkat', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({ description: 'ID konten induk (hierarki page)' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiPropertyOptional({ description: 'ID media untuk featured image' })
  @IsOptional()
  @IsString()
  featured_media_id?: string;

  @ApiPropertyOptional({ description: 'ID author utama (byline)' })
  @IsOptional()
  @IsString()
  primary_author_id?: string;

  @ApiPropertyOptional({ type: [String], description: 'ID co-author' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  co_author_ids?: string[];

  @ApiPropertyOptional({ type: [String], description: 'ID term yang dilekatkan' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  terms?: string[];

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { video_url: 'https://…/v.mp4', seo_title: 'Banjir Jakarta' },
    description: 'Meta EAV (field CPT + SEO); key di-whitelist per tipe',
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, string>;
}
