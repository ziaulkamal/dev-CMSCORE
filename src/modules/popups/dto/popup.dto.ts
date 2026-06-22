// src/modules/popups/dto/popup.dto.ts — payload Popup (konten popup bersegmen).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export const POPUP_KINDS = ['html', 'image'] as const;

export class CreatePopupDto {
  @ApiProperty({ example: 'Promo Lebaran' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: POPUP_KINDS })
  @IsIn(POPUP_KINDS)
  kind!: (typeof POPUP_KINDS)[number];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Konten per-kind. html: {html}; image: {image_media_id,target_url,alt}',
  })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Aturan tampil: {scope:"root"|"all_public", delay_seconds, auto_close_seconds, frequency:"always"|"session"|"days", frequency_days}',
  })
  @IsOptional()
  @IsObject()
  display?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Mulai tayang (ISO-8601); null = tak terbatas.' })
  @IsOptional()
  @IsISO8601()
  start_at?: string;

  @ApiPropertyOptional({ description: 'Akhir tayang (ISO-8601); null = tak terbatas.' })
  @IsOptional()
  @IsISO8601()
  end_at?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class UpdatePopupDto {
  @ApiPropertyOptional({ example: 'Promo Lebaran' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: POPUP_KINDS })
  @IsOptional()
  @IsIn(POPUP_KINDS)
  kind?: (typeof POPUP_KINDS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  display?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Kirim null untuk mengosongkan.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601()
  start_at?: string | null;

  @ApiPropertyOptional({ description: 'Kirim null untuk mengosongkan.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601()
  end_at?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sort_order?: number;
}
