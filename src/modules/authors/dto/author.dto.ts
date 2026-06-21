// src/modules/authors/dto/author.dto.ts — payload author byline (PRD §10.1).
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateAuthorDto {
  @IsString()
  @MaxLength(160)
  display_name!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatar_media_id?: string;

  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;

  @IsOptional()
  @IsString()
  linked_user_id?: string;
}

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {}
