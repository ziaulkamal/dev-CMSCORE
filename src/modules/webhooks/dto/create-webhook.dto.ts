// src/modules/webhooks/dto/create-webhook.dto.ts — registrasi webhook (PRD §11).
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { APP_EVENTS } from '../../../common/events/app-events';

const EVENTS = Object.values(APP_EVENTS);

export class CreateWebhookDto {
  @IsIn(EVENTS)
  event!: string;

  @IsUrl({ require_tld: false })
  target_url!: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
