// src/modules/authors/authors.controller.ts — endpoint authors (stub listing).
import { Controller, Get } from '@nestjs/common';
import { AuthorService } from './authors.service';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/http/api-response';

@Controller('authors')
export class AuthorController {
  constructor(private readonly service: AuthorService) {}

  @Public()
  @Get()
  async list() {
    return ok(await this.service.list());
  }
}
