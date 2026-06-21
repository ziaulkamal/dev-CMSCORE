// src/modules/content/dto/upsert-meta.dto.ts — upsert key-value EAV meta (PRD §10.1).
import { IsObject } from 'class-validator';

export class UpsertMetaDto {
  @IsObject()
  meta!: Record<string, string>;
}
