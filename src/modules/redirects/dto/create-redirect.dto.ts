// src/modules/redirects/dto/create-redirect.dto.ts — payload redirect (PRD §10.1).
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRedirectDto {
  @IsString()
  @Matches(/^\//, { message: 'from_path harus diawali /' })
  from_path!: string;

  @IsString()
  to_path!: string;

  @IsOptional()
  @IsIn([301, 302])
  status_code?: 301 | 302;
}
