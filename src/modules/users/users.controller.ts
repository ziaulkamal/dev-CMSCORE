/**
 * src/modules/users/users.controller.ts
 * Endpoint user (PRD §10.1): list & create. Butuh manage_users.
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('User')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @RequireCapabilities('manage_users')
  @Get()
  @ApiOperation({ summary: 'Daftar user', description: 'Tanpa password_hash.' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_users')
  @Post()
  @ApiOperation({ summary: 'Buat user', description: 'Assign role; password di-hash argon2.' })
  async create(@Body() dto: CreateUserDto) {
    return ok(await this.service.create(dto));
  }
}
