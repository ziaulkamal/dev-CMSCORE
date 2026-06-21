// src/modules/auth/dto/login.dto.ts — payload login (PRD §10.2).
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@cmscore.local', description: 'Email akun terdaftar' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!', minLength: 8, description: 'Password (min 8 karakter)' })
  @IsString()
  @MinLength(8)
  password!: string;
}
