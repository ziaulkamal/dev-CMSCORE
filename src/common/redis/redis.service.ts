// src/common/redis/redis.service.ts — klien Redis untuk cache, lock, rate-limit, queue.
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/** Operasi Redis tingkat aplikasi yang dipakai lintas modul (cache & lock). */
@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) public readonly client: Redis) {}

  /** Set nilai dengan TTL detik (cache). */
  async setEx(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Acquire lock atomik (NX) dengan TTL; true jika berhasil dikunci. */
  async acquireLock(key: string, holder: string, ttlSeconds: number): Promise<boolean> {
    const res = await this.client.set(key, holder, 'EX', ttlSeconds, 'NX');
    return res === 'OK';
  }

  /** Perpanjang lock hanya bila pemegangnya sama (heartbeat). */
  async refreshLock(key: string, holder: string, ttlSeconds: number): Promise<boolean> {
    const current = await this.client.get(key);
    if (current !== holder) return false;
    await this.client.expire(key, ttlSeconds);
    return true;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
