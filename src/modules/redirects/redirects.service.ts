/**
 * src/modules/redirects/redirects.service.ts
 * Redirect from_path → to_path (PRD §10.1): listing & create dengan kode 301/302.
 */
import { Injectable } from '@nestjs/common';
import { RedirectCode } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictError } from '../../common/errors/domain.error';
import { CreateRedirectDto } from './dto/create-redirect.dto';

@Injectable()
export class RedirectService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.redirect.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateRedirectDto) {
    const exists = await this.prisma.redirect.findUnique({ where: { fromPath: dto.from_path } });
    if (exists)
      throw new ConflictError('REDIRECT_EXISTS', `from_path '${dto.from_path}' sudah ada`);

    return this.prisma.redirect.create({
      data: {
        fromPath: dto.from_path,
        toPath: dto.to_path,
        statusCode: dto.status_code === 302 ? RedirectCode.r302 : RedirectCode.r301,
      },
    });
  }
}
