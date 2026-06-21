// src/modules/redirects/dto/create-redirect.dto.ts — payload redirect (PRD §10.1).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRedirectDto {
  @ApiProperty({ example: '/berita-lama', description: 'Path sumber (diawali /)' })
  @IsString()
  @Matches(/^\//, { message: 'from_path harus diawali /' })
  from_path!: string;

  @ApiProperty({ example: '/berita/baru', description: 'Path/URL tujuan' })
  @IsString()
  to_path!: string;

  @ApiPropertyOptional({ enum: [301, 302], example: 301, description: 'Kode status (default 301)' })
  @IsOptional()
  @IsIn([301, 302])
  status_code?: 301 | 302;
}
