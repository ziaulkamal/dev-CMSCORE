// src/modules/widgets/widgets.service.ts — Widget area & widget.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Stub service widgets — listing dasar; perluas sesuai PRD. */
@Injectable()
export class WidgetService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listing dasar (batasi 50; ganti ke cursor pagination saat diperluas). */
  list() {
    return this.prisma.widgetArea.findMany({ take: 50 });
  }
}
