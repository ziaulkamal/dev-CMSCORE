// src/modules/auth/dto/create-api-key.dto.ts — pembuatan API key (PRD §8).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'integrasi-feed', maxLength: 120, description: 'Label pengenal key' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['read'],
    description: 'Daftar scope yang diizinkan',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  scopes?: string[];
}
