// src/modules/ads/dto/ad-slot.dto.ts — payload AdSlot (req #8).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const AD_KINDS = ['image', 'javascript', 'adsense'] as const;
export const AD_POSITIONS = [
  'in_post_below_title',
  'in_post_after_paragraph',
  'post_sidebar_left',
  'floating_top_nav',
  'floating_bottom_timer',
  'flying_carpet',
] as const;

export class CreateAdSlotDto {
  @ApiProperty({ example: 'Banner Header' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: AD_KINDS })
  @IsIn(AD_KINDS)
  kind!: (typeof AD_KINDS)[number];

  @ApiProperty({ enum: AD_POSITIONS })
  @IsIn(AD_POSITIONS)
  position!: (typeof AD_POSITIONS)[number];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description:
      'Payload per-kind. image: {image_media_id,target_url,alt}; javascript: {script}; adsense: {client_id,slot_id}',
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Opsi tata letak (paragraph_index, delay_seconds, dismissible, …)',
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class UpdateAdSlotDto {
  @ApiPropertyOptional({ example: 'Banner Header' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: AD_KINDS })
  @IsOptional()
  @IsIn(AD_KINDS)
  kind?: (typeof AD_KINDS)[number];

  @ApiPropertyOptional({ enum: AD_POSITIONS })
  @IsOptional()
  @IsIn(AD_POSITIONS)
  position?: (typeof AD_POSITIONS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sort_order?: number;
}
