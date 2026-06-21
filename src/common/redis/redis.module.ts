// src/common/redis/redis.module.ts — modul global menyediakan klien ioredis tunggal.
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT, RedisService } from './redis.service';
import type { RedisConfig } from '../config/configuration';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cfg = config.getOrThrow<RedisConfig>('redis');
        return new Redis({ host: cfg.host, port: cfg.port, password: cfg.password });
      },
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
