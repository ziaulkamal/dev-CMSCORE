/**
 * src/modules/seed/seed.controller.ts
 * Endpoint admin generator data dummy (manage_settings): status, generate, cleanup.
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { GenerateSeedDto } from './dto/generate-seed.dto';
import { RequireCapabilities } from '../../common/decorators/require-capabilities.decorator';
import { ok } from '../../common/http/api-response';

@ApiTags('Seed')
@ApiBearerAuth('bearer')
@RequireCapabilities('manage_settings')
@Controller('seed/dummy')
export class SeedController {
  constructor(private readonly service: SeedService) {}

  @Get('status')
  @ApiOperation({ summary: 'Status data dummy', description: 'Ada/tidak + jumlah per entitas.' })
  async status() {
    return ok(await this.service.status());
  }

  @Post('generate')
  @ApiOperation({ summary: 'Buat data dummy', description: 'Tolak bila data dummy sudah ada.' })
  async generate(@Body() dto: GenerateSeedDto) {
    return ok(await this.service.generate(dto));
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Hapus semua data dummy', description: 'Hanya record bertanda; data asli aman.' })
  async cleanup() {
    return ok(await this.service.cleanup());
  }
}
