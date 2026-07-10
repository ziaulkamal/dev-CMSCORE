// src/modules/auth/auth.module.ts — wiring AuthN: JWT, passport, strategy, repo, service.
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { ApiKeyService } from './api-key.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, ApiKeyService, JwtStrategy],
  exports: [AuthRepository, ApiKeyService],
})
export class AuthModule {}
