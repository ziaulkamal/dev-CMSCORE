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
}
