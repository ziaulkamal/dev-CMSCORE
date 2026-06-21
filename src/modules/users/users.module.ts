// src/modules/users/users.module.ts — wiring modul users (stub).
import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
