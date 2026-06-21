/**
 * src/modules/media/media.controller.ts
 * Endpoint media (PRD §10): listing, upload multipart, hapus. Capability manage_media.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UpdateMediaDto } from './dto/update-media.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { ok } from '../../common/http/api-response';

@ApiTags('Media')
@ApiBearerAuth('bearer')
@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @RequireCapabilities('manage_media')
  @Get()
  @ApiOperation({ summary: 'Listing media' })
  async list() {
    return ok(await this.service.list());
  }

  @RequireCapabilities('manage_media')
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload media',
    description: 'Multipart ke MinIO; maks 50MB (image/video/pdf).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        alt_text: { type: 'string', example: 'Foto banjir' },
        caption: { type: 'string', example: 'Genangan di Kampung Melayu' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.upload(file, dto, user));
  }

  @RequireCapabilities('manage_media')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus media', description: 'Hapus file di storage + record.' })
  async remove(@Param('id') id: string) {
    return ok(await this.service.remove(id));
  }
}
