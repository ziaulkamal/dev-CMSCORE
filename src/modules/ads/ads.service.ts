/**
 * src/modules/ads/ads.service.ts
 * AdSlot CRUD + listing aktif per posisi (untuk render publik). Req #8.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/domain.error';
import { CreateAdSlotDto, UpdateAdSlotDto } from './dto/ad-slot.dto';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.adSlot.findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] });
  }

  async get(id: string) {
    const slot = await this.prisma.adSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundError('Ad slot tidak ditemukan');
    return slot;
  }

  create(dto: CreateAdSlotDto) {
    return this.prisma.adSlot.create({
      data: {
        name: dto.name,
        kind: dto.kind,
        position: dto.position,
        active: dto.active ?? true,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
        options: (dto.options ?? {}) as Prisma.InputJsonValue,
        sortOrder: dto.sort_order ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateAdSlotDto) {
    await this.get(id);
    return this.prisma.adSlot.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.config !== undefined ? { config: dto.config as Prisma.InputJsonValue } : {}),
        ...(dto.options !== undefined ? { options: dto.options as Prisma.InputJsonValue } : {}),
        ...(dto.sort_order !== undefined ? { sortOrder: dto.sort_order } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.adSlot.delete({ where: { id } });
  }

  /** Slot aktif dikelompokkan per posisi (kontrak konsumsi situs publik). */
  async listActiveByPosition() {
    const slots = await this.prisma.adSlot.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    const grouped: Record<string, typeof slots> = {};
    for (const slot of slots) {
      (grouped[slot.position] ??= []).push(slot);
    }
    return grouped;
  }
}
