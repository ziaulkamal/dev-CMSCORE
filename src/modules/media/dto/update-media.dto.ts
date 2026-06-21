// src/modules/media/dto/update-media.dto.ts — metadata media saat upload/update.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({ example: 'Foto banjir', maxLength: 255, description: 'Teks alternatif' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt_text?: string;

  @ApiPropertyOptional({ example: 'Genangan di Kampung Melayu', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
