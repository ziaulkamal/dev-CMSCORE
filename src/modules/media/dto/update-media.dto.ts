// src/modules/media/dto/update-media.dto.ts — metadata media saat upload/update.
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
