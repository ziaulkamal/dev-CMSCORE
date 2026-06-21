// src/modules/authors/authors.module.ts — wiring modul authors (stub).
import { Module } from '@nestjs/common';
import { AuthorController } from './authors.controller';
import { AuthorService } from './authors.service';

@Module({
  controllers: [AuthorController],
  providers: [AuthorService],
  exports: [AuthorService],
})
export class AuthorModule {}
