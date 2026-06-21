// src/modules/content/dto/transition.dto.ts — transisi status (PRD §10.1).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class TransitionDto {
  @ApiProperty({ enum: ContentStatus, example: 'published', description: 'Status tujuan' })
  @IsEnum(ContentStatus)
  to!: ContentStatus;

  @ApiPropertyOptional({
    example: '2026-12-31T08:00:00Z',
    description: 'Wajib bila to=scheduled: waktu tayang di masa depan (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  published_at?: string;
}
