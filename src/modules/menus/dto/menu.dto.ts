// src/modules/menus/dto/menu.dto.ts — payload menu tree (req #1).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const SOURCES = ['custom', 'page', 'category'] as const;

/** Satu node menu (tree maks 2 tingkat: parent + children). */
export class MenuItemInput {
  @ApiProperty({ example: 'Beranda' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ example: '/' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @ApiPropertyOptional({ enum: SOURCES, default: 'custom' })
  @IsOptional()
  @IsIn(SOURCES)
  source?: (typeof SOURCES)[number];

  @ApiPropertyOptional({ description: 'ID entitas sumber (content/term) bila bukan custom' })
  @IsOptional()
  @IsString()
  ref_id?: string | null;

  @ApiPropertyOptional({ type: () => [MenuItemInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemInput)
  children?: MenuItemInput[];
}

export class ReplaceMenuItemsDto {
  @ApiProperty({ type: () => [MenuItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemInput)
  items!: MenuItemInput[];
}
