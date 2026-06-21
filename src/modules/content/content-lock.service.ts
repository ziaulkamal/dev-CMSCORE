/**
 * src/modules/content/content-lock.service.ts
 * Article locking (PRD §7): acquire/heartbeat/release + override, Redis TTL + kolom DB.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentRepository } from './content.repository';
import { RedisService } from '../../common/redis/redis.service';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { LockedError, NotFoundError } from '../../common/errors/domain.error';

const LOCK_PREFIX = 'content:lock:';

@Injectable()
export class ContentLockService {
  private readonly ttl: number;

  constructor(
    private readonly repo: ContentRepository,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.ttl = config.getOrThrow<{ ttlSeconds: number }>('lock').ttlSeconds;
  }

  private key(contentId: string): string {
    return `${LOCK_PREFIX}${contentId}`;
  }

  /** Kunci konten untuk user; tolak 423 bila dipegang user lain yang masih aktif. */
  async acquire(contentId: string, user: AuthenticatedUser) {
    const content = await this.repo.findById(contentId);
    if (!content) throw new NotFoundError('Content tidak ditemukan');

    const acquired = await this.redis.acquireLock(this.key(contentId), user.id, this.ttl);
    if (!acquired) {
      const holderId = await this.redis.get(this.key(contentId));
      if (holderId && holderId !== user.id) {
        throw new LockedError('Konten sedang diedit pengguna lain', {
          locked_by: { id: holderId },
        });
      }
      // Pemegang sama → refresh saja (idempotent).
      await this.redis.refreshLock(this.key(contentId), user.id, this.ttl);
    }

    const expiresAt = new Date(Date.now() + this.ttl * 1000);
    await this.repo.updateLock(contentId, {
      lockedBy: user.id,
      lockedAt: new Date(),
      lockExpiresAt: expiresAt,
    });
    return { locked_by: { id: user.id }, lock_expires_at: expiresAt.toISOString() };
  }

  /** Heartbeat: perpanjang lock hanya bila pemegangnya user ini. */
  async heartbeat(contentId: string, user: AuthenticatedUser) {
    const ok = await this.redis.refreshLock(this.key(contentId), user.id, this.ttl);
    if (!ok) throw new LockedError('Lock tidak dipegang oleh Anda');

    const expiresAt = new Date(Date.now() + this.ttl * 1000);
    await this.repo.updateLock(contentId, { lockExpiresAt: expiresAt });
    return { lock_expires_at: expiresAt.toISOString() };
  }

  /** Lepas lock; force=true butuh capability override_lock (dicek di controller/guard). */
  async release(contentId: string, user: AuthenticatedUser, force: boolean) {
    if (!force) {
      const holderId = await this.redis.get(this.key(contentId));
      if (holderId && holderId !== user.id) {
        throw new LockedError('Hanya pemegang lock atau Editor/Admin yang dapat melepas');
      }
    }
    await this.redis.del(this.key(contentId));
    await this.repo.updateLock(contentId, {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    });
    return { released: true };
  }
}
