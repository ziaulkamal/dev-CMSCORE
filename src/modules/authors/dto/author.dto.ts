// src/modules/authors/dto/author.dto.ts — payload author byline (PRD §10.1).
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuthorDto {
  @ApiProperty({ example: 'Andi Wijaya', maxLength: 160 })
  @IsString()
  @MaxLength(160)
  display_name!: string;

  @ApiPropertyOptional({ description: 'Bio singkat' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'ID media avatar' })
  @IsOptional()
  @IsString()
  avatar_media_id?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { twitter: 'https://x.com/andi' },
  })
  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Tautkan ke akun user (opsional)' })
  @IsOptional()
  @IsString()
  linked_user_id?: string;
}

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {}
