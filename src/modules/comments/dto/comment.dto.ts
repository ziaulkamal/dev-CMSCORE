// src/modules/comments/dto/comment.dto.ts — payload komentar & moderasi (PRD §10.2).
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CommentStatus } from '@prisma/client';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

  // Identitas tamu (bila bukan user terdaftar).
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guest_name?: string;

  @IsOptional()
  @IsEmail()
  guest_email?: string;
}

export class ModerateCommentDto {
  @IsEnum(CommentStatus)
  status!: CommentStatus;
}
