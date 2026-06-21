/**
 * src/modules/content/content.controller.ts
 * Endpoint Content (PRD §10.1) — thin controller; capability ditegakkan via guard/decorator.
 */
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentLockService } from './content-lock.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { TransitionDto } from './dto/transition.dto';
import { ListContentQuery } from './dto/list-content.query';
import { UpsertMetaDto } from './dto/upsert-meta.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { ForbiddenError } from '../../common/errors/domain.error';
import { ok } from '../../common/http/api-response';

@Controller('contents')
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly lock: ContentLockService,
  ) {}

  @Public()
  @Get()
  async list(@Query() query: ListContentQuery, @CurrentUser() user?: AuthenticatedUser) {
    const result = await this.content.list(query, user);
    return ok(result.data, result.meta);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return ok(await this.content.findOne(id, user));
  }

  @RequireCapabilities('edit_post')
  @Post()
  async create(@Body() dto: CreateContentDto, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.content.create(dto, user));
  }

  @RequireCapabilities('edit_post')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.content.update(id, dto, user));
  }

  @RequireCapabilities('delete_post')
  @Delete(':id')
  async trash(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.content.trash(id, user));
  }

  @Post(':id/transition')
  async transition(
    @Param('id') id: string,
    @Body() dto: TransitionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.content.transition(id, dto, user));
  }

  // ── Meta (EAV) ───────────────────────────────────────────

  @Public()
  @Get(':id/meta')
  async getMeta(@Param('id') id: string) {
    return ok(await this.content.getMeta(id));
  }

  @RequireCapabilities('edit_post')
  @Put(':id/meta')
  async upsertMeta(
    @Param('id') id: string,
    @Body() dto: UpsertMetaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.content.upsertMeta(id, dto.meta, user));
  }

  // ── Article locking (PRD §7) ─────────────────────────────

  @RequireCapabilities('edit_post')
  @Post(':id/lock')
  async acquireLock(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.lock.acquire(id, user));
  }

  @RequireCapabilities('edit_post')
  @Post(':id/lock/heartbeat')
  async heartbeat(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.lock.heartbeat(id, user));
  }

  @RequireCapabilities('edit_post')
  @Delete(':id/lock')
  async releaseLock(
    @Param('id') id: string,
    @Query('force') force: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const forced = force === 'true';
    // Override paksa hanya untuk pemegang override_lock (Editor/Admin).
    if (forced && !user.capabilities.includes('override_lock')) {
      throw new ForbiddenError('Butuh capability override_lock');
    }
    return ok(await this.lock.release(id, user, forced));
  }
}
