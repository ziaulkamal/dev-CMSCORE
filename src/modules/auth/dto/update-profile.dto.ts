// src/modules/auth/dto/update-profile.dto.ts — payload self-service profil (req #2).
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Budi Santoso', maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  display_name?: string | null;

  @ApiPropertyOptional({ example: 'budi@cmscore.local' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'ID media untuk avatar; null untuk hapus', nullable: true })
  @IsOptional()
  @IsString()
  avatar_media_id?: string | null;
}
