/**
 * src/modules/users/users.controller.ts
 * Endpoint user (PRD §10.1): list, detail, create, ban/unban.
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { ok } from '../../common/http/api-response';

@ApiTags('User')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly audit: AuditService,
  ) {}

  @RequireCapabilities('manage_users')
  @Get()
  @ApiOperation({ summary: 'Daftar user', description: 'Tanpa password_hash.' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_users')
  @Get(':id')
  @ApiOperation({ summary: 'Detail user', description: 'Profil + status + role.' })
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @RequireCapabilities('manage_users')
  @Post()
  @ApiOperation({ summary: 'Buat user', description: 'Assign role; password di-hash argon2.' })
  async create(@Body() dto: CreateUserDto) {
    return ok(await this.service.create(dto));
  }

  @RequireCapabilities('ban_users')
  @Post(':id/ban')
  @ApiOperation({
    summary: 'Ban user',
    description: 'Set status banned + cabut sesi. Hanya Super Admin/Admin.',
  })
  async ban(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BanUserDto,
  ) {
    const result = await this.service.ban(id, dto.reason);
    await this.audit.log({
      actorId: actor.id,
      action: 'user.ban',
      targetType: 'user',
      targetId: id,
      metadata: { reason: dto.reason },
    });
    return ok(result);
  }

  @RequireCapabilities('ban_users')
  @Post(':id/unban')
  @ApiOperation({ summary: 'Unban user', description: 'Kembalikan status active.' })
  async unban(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    const result = await this.service.unban(id);
    await this.audit.log({
      actorId: actor.id,
      action: 'user.unban',
      targetType: 'user',
      targetId: id,
    });
    return ok(result);
  }
}
