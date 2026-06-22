// src/modules/feed/feed.controller.ts — endpoint feed publik (RSS/Atom/Sitemap).
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly service: FeedService) {}

  @Public()
  @Get('rss.xml')
  @ApiOperation({ summary: 'RSS 2.0', description: '10 artikel terbaru. 404 bila dinonaktifkan.' })
  async rss(@Res() res: Response) {
    return this.write(res, 'rss');
  }

  @Public()
  @Get('atom.xml')
  @ApiOperation({ summary: 'Atom 1.0', description: '10 artikel terbaru. 404 bila dinonaktifkan.' })
  async atom(@Res() res: Response) {
    return this.write(res, 'atom');
  }

  @Public()
  @Get('sitemap.xml')
  @ApiOperation({ summary: 'Sitemap', description: 'URL konten published. 404 bila dinonaktifkan.' })
  async sitemap(@Res() res: Response) {
    return this.write(res, 'sitemap');
  }

  private async write(res: Response, kind: 'rss' | 'atom' | 'sitemap') {
    const { body, contentType, noindex } = await this.service.render(kind);
    res.setHeader('Content-Type', contentType);
    if (noindex) res.setHeader('X-Robots-Tag', 'noindex');
    res.send(body);
  }
}
