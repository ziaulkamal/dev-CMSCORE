/**
 * src/modules/media/media.service.ts
 * Media: upload ke MinIO + simpan metadata Postgres, listing, hapus (file + record).
 */
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { NotFoundError, ValidationError } from '../../common/errors/domain.error';
import { APP_EVENTS } from '../../common/events/app-events';
import { UpdateMediaDto } from './dto/update-media.dto';

const ALLOWED_MIME = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm)|application\/pdf)$/;
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly events: EventEmitter2,
  ) {}

  list() {
    return this.prisma.media.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
  }

  /** Validasi tipe/ukuran di boundary, unggah ke storage, persist metadata. */
  async upload(
    file: Express.Multer.File | undefined,
    dto: UpdateMediaDto,
    user: AuthenticatedUser,
  ) {
    if (!file) throw new ValidationError('File wajib diunggah (field: file)');
    if (file.size > MAX_BYTES) throw new ValidationError('Ukuran file melebihi 50MB');
    if (!ALLOWED_MIME.test(file.mimetype)) {
      throw new ValidationError('Tipe file tidak didukung', { mimetype: file.mimetype });
    }

    const stored = await this.storage.upload(file);
    const media = await this.prisma.media.create({
      data: {
        fileUrl: stored.fileUrl,
        storageKey: stored.storageKey,
        mimeType: file.mimetype,
        fileSize: file.size,
        altText: dto.alt_text ?? null,
        caption: dto.caption ?? null,
        uploaderId: user.id,
        storageProvider: 'minio',
      },
    });

    this.events.emit(APP_EVENTS.mediaUploaded, {
      media_id: media.id,
      file_url: media.fileUrl,
      mime_type: media.mimeType,
    });
    return media;
  }

  /** Hapus file di storage lalu record; gagal hapus file tidak menghentikan proses. */
  async remove(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundError('Media tidak ditemukan');

    await this.storage.remove(media.storageKey).catch(() => undefined);
    await this.prisma.media.delete({ where: { id } });
    return { deleted: true };
  }
}
