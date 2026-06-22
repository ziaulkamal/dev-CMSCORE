/**
 * src/modules/feed/feed.service.ts
 * Feed publik: RSS, Atom, Sitemap. Dikontrol oleh setting feed.* dan site.*.
 * Memuat 10 artikel published teratas (sitemap memuat seluruh URL published).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/domain.error';

type FeedKind = 'rss' | 'atom' | 'sitemap';

const SETTING_FLAG: Record<FeedKind, string> = {
  rss: 'feed.rss_enabled',
  atom: 'feed.atom_enabled',
  sitemap: 'feed.sitemap_enabled',
};

/** Escape karakter XML wajib. */
function xml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  private async settings() {
    const rows = await this.prisma.setting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const str = (k: string, fallback = '') => {
      const v = map.get(k);
      return typeof v === 'string' ? v : fallback;
    };
    const bool = (k: string, fallback = false) => {
      const v = map.get(k);
      return typeof v === 'boolean' ? v : fallback;
    };
    return {
      title: str('site.title', 'CMS'),
      tagline: str('site.tagline', ''),
      url: str('site.url', '').replace(/\/+$/, ''),
      searchEngineVisible: bool('site.search_engine_visible', true),
      enabled: (kind: FeedKind) => bool(SETTING_FLAG[kind], false),
    };
  }

  /** Daftar artikel published terbaru (judul, slug, excerpt, tanggal). */
  private publishedPosts(take: number) {
    return this.prisma.content.findMany({
      where: { status: 'published', type: { in: ['post', 'video', 'gallery', 'live_report'] } },
      orderBy: { publishedAt: 'desc' },
      take,
      select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true },
    });
  }

  private link(base: string, slug: string, id: string): string {
    // Permalink dasar; fase render publik dapat menyempurnakan sesuai permalink_style.
    return base ? `${base}/artikel/${id}/${slug}` : `/artikel/${id}/${slug}`;
  }

  /** Hasilkan XML feed; lempar 404 bila setting terkait nonaktif. */
  async render(kind: FeedKind): Promise<{ body: string; contentType: string; noindex: boolean }> {
    const s = await this.settings();
    if (!s.enabled(kind)) throw new NotFoundError('Feed tidak aktif');

    const noindex = !s.searchEngineVisible;
    if (kind === 'sitemap') {
      const posts = await this.publishedPosts(500);
      const urls = posts
        .map(
          (p) =>
            `  <url><loc>${xml(this.link(s.url, p.slug, p.id))}</loc>` +
            (p.publishedAt ? `<lastmod>${p.publishedAt.toISOString()}</lastmod>` : '') +
            `</url>`,
        )
        .join('\n');
      const body =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
      return { body, contentType: 'application/xml; charset=utf-8', noindex };
    }

    const posts = await this.publishedPosts(10);

    if (kind === 'atom') {
      const updated = posts[0]?.publishedAt?.toISOString() ?? new Date().toISOString();
      const entries = posts
        .map((p) => {
          const url = this.link(s.url, p.slug, p.id);
          const date = (p.publishedAt ?? new Date()).toISOString();
          return (
            `  <entry>\n` +
            `    <title>${xml(p.title)}</title>\n` +
            `    <link href="${xml(url)}"/>\n` +
            `    <id>${xml(url)}</id>\n` +
            `    <updated>${date}</updated>\n` +
            (p.excerpt ? `    <summary>${xml(p.excerpt)}</summary>\n` : '') +
            `  </entry>`
          );
        })
        .join('\n');
      const body =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<feed xmlns="http://www.w3.org/2005/Atom">\n` +
        `  <title>${xml(s.title)}</title>\n` +
        `  <link href="${xml(s.url)}"/>\n` +
        `  <id>${xml(s.url || s.title)}</id>\n` +
        `  <updated>${updated}</updated>\n${entries}\n</feed>\n`;
      return { body, contentType: 'application/atom+xml; charset=utf-8', noindex };
    }

    // RSS 2.0
    const items = posts
      .map((p) => {
        const url = this.link(s.url, p.slug, p.id);
        return (
          `    <item>\n` +
          `      <title>${xml(p.title)}</title>\n` +
          `      <link>${xml(url)}</link>\n` +
          `      <guid isPermaLink="false">${xml(p.id)}</guid>\n` +
          (p.publishedAt ? `      <pubDate>${p.publishedAt.toUTCString()}</pubDate>\n` : '') +
          (p.excerpt ? `      <description>${xml(p.excerpt)}</description>\n` : '') +
          `    </item>`
        );
      })
      .join('\n');
    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0">\n  <channel>\n` +
      `    <title>${xml(s.title)}</title>\n` +
      `    <link>${xml(s.url)}</link>\n` +
      `    <description>${xml(s.tagline)}</description>\n${items}\n  </channel>\n</rss>\n`;
    return { body, contentType: 'application/rss+xml; charset=utf-8', noindex };
  }
}
