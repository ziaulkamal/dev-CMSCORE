// src/modules/content/dto/update-content.dto.ts — partial update (type tidak boleh diubah).
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateContentDto } from './create-content.dto';

/** Semua field opsional kecuali `type` yang dikunci setelah dibuat. */
export class UpdateContentDto extends PartialType(OmitType(CreateContentDto, ['type'] as const)) {}
