// src/modules/settings/dto/update-settings.dto.ts — upsert batch settings (PRD §10.1).
import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { site_title: 'CMS Core', posts_per_page: 10 },
    description: 'Peta key → value (value bebas JSON)',
  })
  @IsObject()
  settings!: Record<string, unknown>;
}
