/**
 * src/common/storage/storage.service.ts
 * Abstraksi object storage (MinIO/S3): upload, hapus, dan bangun URL publik.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { MinioConfig } from '../config/configuration';

export interface StoredObject {
  storageKey: string;
  fileUrl: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: MinioClient;
  private readonly cfg: MinioConfig;

  constructor(config: ConfigService) {
    this.cfg = config.getOrThrow<MinioConfig>('minio');
    this.client = new MinioClient({
      endPoint: this.cfg.endpoint,
      port: this.cfg.port,
      useSSL: this.cfg.useSsl,
      accessKey: this.cfg.accessKey,
      secretKey: this.cfg.secretKey,
    });
  }

  /** Pastikan bucket ada saat startup (idempotent). */
  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.cfg.bucket);
      if (!exists) await this.client.makeBucket(this.cfg.bucket);
    } catch (err) {
      // Jangan gagalkan boot bila MinIO belum siap; log saja.
      this.logger.warn(`Bucket check gagal: ${(err as Error).message}`);
    }
  }

  /** Simpan buffer; key acak menjaga keunikan & cegah path traversal. */
  async upload(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<StoredObject> {
    const ext = extname(file.originalname).toLowerCase().slice(0, 10);
    const storageKey = `${new Date().getFullYear()}/${randomUUID()}${ext}`;
    await this.client.putObject(this.cfg.bucket, storageKey, file.buffer, file.buffer.length, {
      'Content-Type': file.mimetype,
    });
    return { storageKey, fileUrl: this.publicUrl(storageKey) };
  }

  async remove(storageKey: string): Promise<void> {
    await this.client.removeObject(this.cfg.bucket, storageKey);
  }

  /** URL publik via CDN/MinIO public base. */
  private publicUrl(storageKey: string): string {
    const base = this.cfg.publicUrl.replace(/\/$/, '');
    return `${base}/${storageKey}`;
  }
}
