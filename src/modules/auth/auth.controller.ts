/**
 * src/modules/auth/auth.controller.ts
 * Endpoint AuthN (PRD §8) — thin controller, logika di AuthService.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
    description: 'Identitas + display_name, avatar_url, last_login_at + roles + capabilities.',
  })
  @ApiResponse({ status: 401, description: 'Belum terautentikasi.' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.auth.getMe(user.id));
  }

  @Patch('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Update profil saya',
    description: 'Ubah display_name, email, dan/atau avatar (avatar_media_id).',
  })
  async updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return ok(await this.auth.updateProfile(user.id, dto));
  }

  @Put('me/password')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Ganti password saya',
    description: 'Verifikasi current_password lalu set new_password. Cabut sesi lain.',
  })
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.id, dto.current_password, dto.new_password);
    return ok({ success: true });
  }

  @Post('me/deactivate')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Nonaktifkan akun saya',
    description: 'Set status inactive (sukarela) & cabut seluruh sesi. Bisa diaktifkan admin.',
  })
  async deactivateMe(@CurrentUser() user: AuthenticatedUser) {
    await this.auth.deactivateSelf(user.id);
    return ok({ success: true });
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
