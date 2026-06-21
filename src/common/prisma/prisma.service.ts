// src/common/prisma/prisma.service.ts — koneksi Prisma terkelola lifecycle Nest.
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Bungkus PrismaClient sebagai provider singleton dengan connect/disconnect. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
