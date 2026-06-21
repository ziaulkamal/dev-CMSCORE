// src/modules/content/dto/transition.dto.ts — transisi status (PRD §10.1).
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class TransitionDto {
  @IsEnum(ContentStatus)
  to!: ContentStatus;

  /** Wajib bila menuju `scheduled`: waktu tayang di masa depan. */
  @IsOptional()
  @IsDateString()
  published_at?: string;
}
