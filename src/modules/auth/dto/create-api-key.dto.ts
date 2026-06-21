// src/modules/auth/dto/create-api-key.dto.ts — pembuatan API key (PRD §8).
import { ArrayUnique, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  scopes?: string[];
}
