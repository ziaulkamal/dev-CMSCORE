// src/modules/users/dto/create-user.dto.ts — pembuatan user + assignment role (PRD §10.1).
import { ArrayNotEmpty, IsArray, IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  /** Nama role yang diberikan (mis. ["editor"]). */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles!: string[];
}
