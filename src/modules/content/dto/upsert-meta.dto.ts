// src/modules/content/dto/upsert-meta.dto.ts — upsert key-value EAV meta (PRD §10.1).
import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpsertMetaDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { seo_title: 'Judul SEO', video_duration: '320' },
    description: 'Pasangan meta_key → value (whitelist per tipe)',
  })
  @IsObject()
  meta!: Record<string, string>;
}
