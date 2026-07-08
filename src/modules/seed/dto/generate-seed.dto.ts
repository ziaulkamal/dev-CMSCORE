/**
 * src/modules/seed/dto/generate-seed.dto.ts
 * Opsi generate data dummy: jumlah per entitas (opsional → default) + toggle cakupan.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateSeedDto {
  @ApiPropertyOptional({ description: 'Jumlah konten dummy', default: 40, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  contents?: number;

  @ApiPropertyOptional({ description: 'Jumlah penulis dummy', default: 12, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  authors?: number;

  @ApiPropertyOptional({ description: 'Jumlah kategori dummy', default: 6, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  categories?: number;

  @ApiPropertyOptional({ description: 'Jumlah tag dummy', default: 8, minimum: 0, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  tags?: number;

  @ApiPropertyOptional({ description: 'Sertakan komentar dummy', default: true })
  @IsOptional()
  @IsBoolean()
  includeComments?: boolean;

  @ApiPropertyOptional({ description: 'Sertakan menu, widget & footer (Setting)', default: true })
  @IsOptional()
  @IsBoolean()
  includeMenuWidget?: boolean;

  @ApiPropertyOptional({ description: 'Sertakan iklan & popup', default: true })
  @IsOptional()
  @IsBoolean()
  includeAdsPopup?: boolean;
}
