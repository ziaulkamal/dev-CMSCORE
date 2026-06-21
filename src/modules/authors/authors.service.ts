/**
 * src/modules/authors/authors.service.ts
 * Author byline publik (PRD §10.1): listing, create, update. Terpisah dari akun login.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/domain.error';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';

@Injectable()
export class AuthorService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.author.findMany({ take: 50, orderBy: { displayName: 'asc' } });
  }

  create(dto: CreateAuthorDto) {
    return this.prisma.author.create({
      data: {
        displayName: dto.display_name,
        bio: dto.bio ?? null,
        avatarMediaId: dto.avatar_media_id ?? null,
        socialLinks: (dto.social_links ?? undefined) as Prisma.InputJsonValue,
        linkedUserId: dto.linked_user_id ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateAuthorDto) {
    await this.getOrThrow(id);
    return this.prisma.author.update({
      where: { id },
      data: {
        displayName: dto.display_name ?? undefined,
        bio: dto.bio ?? undefined,
        avatarMediaId: dto.avatar_media_id ?? undefined,
        socialLinks: (dto.social_links ?? undefined) as Prisma.InputJsonValue,
        linkedUserId: dto.linked_user_id ?? undefined,
      },
    });
  }

  private async getOrThrow(id: string) {
    const author = await this.prisma.author.findUnique({ where: { id } });
    if (!author) throw new NotFoundError('Author tidak ditemukan');
    return author;
  }
}
