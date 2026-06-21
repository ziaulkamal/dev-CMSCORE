// src/modules/users/users.controller.ts — endpoint users (stub listing).
import { Controller, Get } from '@nestjs/common';
import { UserService } from './users.service';
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
}
