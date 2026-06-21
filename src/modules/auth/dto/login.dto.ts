// src/modules/auth/dto/login.dto.ts — payload login (PRD §10.2).
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
