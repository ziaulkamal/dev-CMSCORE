// src/modules/comments/dto/comment.dto.ts — payload komentar & moderasi (PRD §10.2).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CommentStatus } from '@prisma/client';

export class CreateCommentDto {
  @ApiProperty({ example: 'Artikel yang bagus!', minLength: 1, maxLength: 5000 })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @ApiPropertyOptional({ description: 'ID komentar induk (thread/balasan)' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiPropertyOptional({
    example: 'Budi',
    maxLength: 120,
    description: 'Nama tamu (bila bukan user)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guest_name?: string;

  @ApiPropertyOptional({ example: 'budi@mail.com', description: 'Email tamu' })
  @IsOptional()
  @IsEmail()
  guest_email?: string;
}

export class ModerateCommentDto {
  @ApiProperty({ enum: CommentStatus, example: 'approved', description: 'Status moderasi' })
  @IsEnum(CommentStatus)
  status!: CommentStatus;
}
