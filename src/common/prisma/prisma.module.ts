// src/common/prisma/prisma.module.ts — modul global agar PrismaService dapat di-inject di mana saja.
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
