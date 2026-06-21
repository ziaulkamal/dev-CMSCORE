// src/modules/auth/dto/refresh.dto.ts — payload refresh token rotation (PRD §8).
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'rt_xxxxxxxx',
    description: 'Refresh token hasil login/refresh sebelumnya',
  })
  @IsString()
  @MinLength(16)
  refresh_token!: string;
}
