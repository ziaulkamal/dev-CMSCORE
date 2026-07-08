// src/modules/content/dto/list-content.query.ts — query param listing feed (PRD §10).
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class ListContentQuery {
  @ApiPropertyOptional({ example: 'post', description: 'Filter tipe konten' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ContentStatus, description: 'Filter status' })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Cursor opaque dari meta.next_cursor' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ example: '20', description: 'Jumlah item per halaman (maks 100)' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: '-published_at', description: 'Urut; awalan - untuk desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Filter term (id atau slug). Mengembalikan konten yang punya term ini.',
    example: 'politik',
  })
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional({
    description: 'Slug taxonomy untuk membatasi pencocokan `term` (mis. category).',
    example: 'category',
  })
  @IsOptional()
  @IsString()
  taxonomy?: string;

  @ApiPropertyOptional({ description: 'Filter author (id) byline.', example: 'uuid-author' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Kata kunci pencarian (judul/excerpt).', example: 'pemilu' })
  @IsOptional()
  @IsString()
  q?: string;
}
