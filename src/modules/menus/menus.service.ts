// src/modules/menus/menus.service.ts — Menu & menu item.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service menus — listing dasar; perluas sesuai PRD. */
@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.menu.findMany({ take: 50 });
  }
}
