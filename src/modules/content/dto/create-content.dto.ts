// src/modules/content/dto/create-content.dto.ts — payload create content (PRD §10.2).
import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { CONTENT_TYPES } from '../content-type.registry';

const TYPES = Object.keys(CONTENT_TYPES);

export class CreateContentDto {
  @IsIn(TYPES)
  type!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

  @IsOptional()
  @IsString()
  featured_media_id?: string;

  @IsOptional()
  @IsString()
  primary_author_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  co_author_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  terms?: string[];

  @IsOptional()
  @IsObject()
  meta?: Record<string, string>;
}
