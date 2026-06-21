/**
 * src/modules/auth/auth.controller.ts
 * Endpoint AuthN (PRD §8) — thin controller, logika di AuthService.
 */
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { ok } from '../../common/http/api-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return ok(await this.auth.login(dto));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return ok(await this.auth.refresh(dto.refresh_token));
  }

  @Public()
  @Post('logout')
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refresh_token);
    return ok({ success: true });
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return ok(user);
  }

  @Post('api-keys')
  async createApiKey(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateApiKeyDto) {
    return ok(await this.auth.createApiKey(user.id, dto));
  }

  @Delete('api-keys/:id')
  async revokeApiKey(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.auth.revokeApiKey(user.id, id);
    return ok({ success: true });
  }
}
