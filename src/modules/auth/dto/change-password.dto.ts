// src/modules/auth/dto/change-password.dto.ts — ganti password self-service (req #2).
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Password saat ini (verifikasi)' })
  @IsString()
  current_password!: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  new_password!: string;
}
