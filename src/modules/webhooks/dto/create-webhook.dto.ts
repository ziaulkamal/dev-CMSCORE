// src/modules/webhooks/dto/create-webhook.dto.ts — registrasi webhook (PRD §11).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { APP_EVENTS } from '../../../common/events/app-events';

const EVENTS = Object.values(APP_EVENTS);

export class CreateWebhookDto {
  @ApiProperty({
    enum: EVENTS,
    example: 'content.published',
    description: 'Event yang didengarkan',
  })
  @IsIn(EVENTS)
  event!: string;

  @ApiProperty({ example: 'https://example.com/hook', description: 'URL target delivery' })
  @IsUrl({ require_tld: false })
  target_url!: string;

  @ApiPropertyOptional({ description: 'Secret HMAC; di-generate bila kosong' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ example: true, description: 'Aktif/nonaktif (default true)' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
