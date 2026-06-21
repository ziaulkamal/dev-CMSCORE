/**
 * src/modules/content/content.controller.ts
 * Endpoint Content (PRD §10.1) — thin controller; capability ditegakkan via guard/decorator.
 */
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Content')
@ApiBearerAuth('bearer')
@Controller('contents')
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly lock: ContentLockService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listing feed',
    description: 'Cursor-based. Anonim hanya melihat published.',
  })
  async list(@Query() query: ListContentQuery, @CurrentUser() user?: AuthenticatedUser) {
    const result = await this.content.list(query, user);
    return ok(result.data, result.meta);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detail konten' })
  @ApiResponse({ status: 404, description: 'Tidak ditemukan / tidak boleh diakses.' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return ok(await this.content.findOne(id, user));
  }

  @RequireCapabilities('edit_post')
  @Post()
  @ApiOperation({
    summary: 'Buat konten',
    description: 'Status awal draft; slug unik per type otomatis.',
  })
  async create(@Body() dto: CreateContentDto, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.content.create(dto, user));
  }

  @RequireCapabilities('edit_post')
  @Put(':id')
  @ApiOperation({ summary: 'Update konten', description: 'Non-owner butuh edit_others_post.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.content.update(id, dto, user));
  }

  @RequireCapabilities('delete_post')
  @Delete(':id')
  @ApiOperation({ summary: 'Trash konten', description: 'Soft-delete (bukan hard delete).' })
  async trash(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.content.trash(id, user));
  }

  @Post(':id/transition')
  @ApiOperation({
    summary: 'Transisi status',
    description: 'State machine editorial; capability per transisi.',
  })
  @ApiResponse({ status: 409, description: 'INVALID_STATUS_TRANSITION.' })
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
  @ApiOperation({ summary: 'Ambil meta', description: 'Semua meta EAV (CPT + SEO) sebagai map.' })
  async getMeta(@Param('id') id: string) {
    return ok(await this.content.getMeta(id));
  }

  @RequireCapabilities('edit_post')
  @Put(':id/meta')
  @ApiOperation({ summary: 'Upsert meta', description: 'Key di-whitelist sesuai tipe konten.' })
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
  @ApiOperation({
    summary: 'Acquire lock',
    description: 'Kunci edit; 423 bila dipegang user lain.',
  })
  @ApiResponse({ status: 423, description: 'CONTENT_LOCKED.' })
  async acquireLock(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.lock.acquire(id, user));
  }

  @RequireCapabilities('edit_post')
  @Post(':id/lock/heartbeat')
  @ApiOperation({ summary: 'Heartbeat lock', description: 'Perpanjang TTL lock selama mengedit.' })
  async heartbeat(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.lock.heartbeat(id, user));
  }

  @RequireCapabilities('edit_post')
  @Delete(':id/lock')
  @ApiOperation({
    summary: 'Lepas lock',
    description: 'force=true untuk override (butuh override_lock).',
  })
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
