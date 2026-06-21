/**
 * src/modules/users/users.controller.ts
 * Endpoint user (PRD §10.1): list & create. Butuh manage_users.
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @RequireCapabilities('manage_users')
  @Get()
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_users')
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return ok(await this.service.create(dto));
  }
}
