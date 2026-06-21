// src/modules/auth/dto/refresh.dto.ts — payload refresh token rotation (PRD §8).
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @IsString()
  @MinLength(16)
  refresh_token!: string;
}
