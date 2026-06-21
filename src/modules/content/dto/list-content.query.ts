// src/modules/content/dto/list-content.query.ts — query param listing feed (PRD §10).
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class ListContentQuery {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  /** Contoh: `-published_at` (desc) atau `published_at` (asc). */
  @IsOptional()
  @IsString()
  sort?: string;
}
