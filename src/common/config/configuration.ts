// src/common/config/configuration.ts — pemetaan env → objek config typed.

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
}

export interface JwtConfig {
  accessSecret: string;
  accessTtl: number;
  refreshSecret: string;
  refreshTtl: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface MinioConfig {
  endpoint: string;
  port: number;
  useSsl: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrl: string;
}

export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'v1',
    corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  } satisfies AppConfig,
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '1209600', 10),
  } satisfies JwtConfig,
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  } satisfies RedisConfig,
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    useSsl: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? '',
    secretKey: process.env.MINIO_SECRET_KEY ?? '',
    bucket: process.env.MINIO_BUCKET ?? 'cms-media',
    publicUrl: process.env.MINIO_PUBLIC_URL ?? '',
  } satisfies MinioConfig,
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10),
  },
  lock: {
    ttlSeconds: parseInt(process.env.LOCK_TTL_SECONDS ?? '1800', 10),
  },
  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES ?? '5', 10),
  },
});
