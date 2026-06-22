/**
 * src/modules/popups/popups.service.ts
 * Popup CRUD + listing aktif dalam rentang tanggal (untuk render publik).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/domain.error';
import { CreatePopupDto, UpdatePopupDto } from './dto/popup.dto';

@Injectable()
export class PopupsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.popup.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async get(id: string) {
    const popup = await this.prisma.popup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundError('Popup tidak ditemukan');
    return popup;
  }

  create(dto: CreatePopupDto) {
    return this.prisma.popup.create({
      data: {
        name: dto.name,
        kind: dto.kind,
        active: dto.active ?? true,
        content: (dto.content ?? {}) as Prisma.InputJsonValue,
        display: (dto.display ?? {}) as Prisma.InputJsonValue,
        startAt: dto.start_at ? new Date(dto.start_at) : null,
        endAt: dto.end_at ? new Date(dto.end_at) : null,
        sortOrder: dto.sort_order ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdatePopupDto) {
    await this.get(id);
    return this.prisma.popup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.content !== undefined ? { content: dto.content as Prisma.InputJsonValue } : {}),
        ...(dto.display !== undefined ? { display: dto.display as Prisma.InputJsonValue } : {}),
        ...(dto.start_at !== undefined
          ? { startAt: dto.start_at ? new Date(dto.start_at) : null }
          : {}),
        ...(dto.end_at !== undefined ? { endAt: dto.end_at ? new Date(dto.end_at) : null } : {}),
        ...(dto.sort_order !== undefined ? { sortOrder: dto.sort_order } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.popup.delete({ where: { id } });
  }

  /** Popup aktif & dalam rentang tanggal sekarang (kontrak konsumsi situs publik). */
  listActive() {
    const now = new Date();
    return this.prisma.popup.findMany({
      where: {
        active: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
