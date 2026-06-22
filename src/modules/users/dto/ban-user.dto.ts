// src/modules/users/dto/ban-user.dto.ts — alasan ban (req #3).
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BanUserDto {
  @ApiPropertyOptional({ example: 'Pelanggaran berulang kebijakan konten', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
