/**
 * src/modules/authors/authors.service.ts
 * Author byline publik (PRD §10.1): listing, create, update. Terpisah dari akun login.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictError, NotFoundError } from '../../common/errors/domain.error';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';

@Injectable()
export class AuthorService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.author.findMany({ take: 50, orderBy: { displayName: 'asc' } });
  }

  /**
   * Pastikan ada Author byline yang ter-link ke user login; buat otomatis bila
   * belum ada (pakai display_name/email user). Dipakai saat penulis konten
   * default-nya adalah penulis yang sedang login. Mengembalikan id Author.
   */
  async ensureAuthorForUser(userId: string): Promise<string> {
    const existing = await this.prisma.author.findUnique({ where: { linkedUserId: userId } });
    if (existing) return existing.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, email: true, avatarMediaId: true },
    });
    const created = await this.prisma.author.create({
      data: {
        displayName: user?.displayName?.trim() || user?.email || 'Penulis',
        avatarMediaId: user?.avatarMediaId ?? null,
        linkedUserId: userId,
      },
    });
    return created.id;
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

  /** Hapus author; tolak bila masih dipakai byline (primary atau co-author). */
  async remove(id: string) {
    await this.getOrThrow(id);

    const [primaryCount, bylineCount] = await Promise.all([
      this.prisma.content.count({ where: { primaryAuthorId: id } }),
      this.prisma.contentAuthor.count({ where: { authorId: id } }),
    ]);
    const usage = primaryCount + bylineCount;
    if (usage > 0) {
      throw new ConflictError(
        'AUTHOR_IN_USE',
        'Author masih dipakai pada konten; lepaskan byline sebelum menghapus.',
        { primary: primaryCount, byline: bylineCount },
      );
    }

    await this.prisma.author.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async getOrThrow(id: string) {
    const author = await this.prisma.author.findUnique({ where: { id } });
    if (!author) throw new NotFoundError('Author tidak ditemukan');
    return author;
  }
}
