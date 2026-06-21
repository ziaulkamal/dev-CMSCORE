// src/modules/settings/dto/update-settings.dto.ts — upsert batch settings (PRD §10.1).
import { IsObject } from 'class-validator';

export class UpdateSettingsDto {
  /** Peta key → value (value bebas JSON). */
  @IsObject()
  settings!: Record<string, unknown>;
}
