/**
 * src/modules/auth/auth.controller.ts
 * Endpoint AuthN (PRD §8) — thin controller, logika di AuthService.
 */
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { ok } from '../../common/http/api-response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: 'Tukar email+password jadi access + refresh token.',
  })
  @ApiResponse({ status: 201, description: 'Token diterbitkan.' })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid.' })
  async login(@Body() dto: LoginDto) {
    return ok(await this.auth.login(dto));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Rotasi: terbitkan token baru, cabut yang lama.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid/kedaluwarsa/reuse.' })
  async refresh(@Body() dto: RefreshDto) {
    return ok(await this.auth.refresh(dto.refresh_token));
  }

  @Public()
  @Post('logout')
  @ApiOperation({
    summary: 'Logout',
    description: 'Cabut refresh token yang diberikan (idempotent).',
  })
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refresh_token);
    return ok({ success: true });
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Profil saya',
    description: 'Identitas + roles + capabilities saat ini.',
  })
  @ApiResponse({ status: 401, description: 'Belum terautentikasi.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return ok(user);
  }

  @Post('api-keys')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Buat API key',
    description: 'Raw key dikembalikan sekali; simpan baik-baik.',
  })
  async createApiKey(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateApiKeyDto) {
    return ok(await this.auth.createApiKey(user.id, dto));
  }

  @Delete('api-keys/:id')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cabut API key' })
  async revokeApiKey(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.auth.revokeApiKey(user.id, id);
    return ok({ success: true });
  }
}
