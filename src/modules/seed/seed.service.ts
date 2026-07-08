/**
 * src/modules/seed/seed.service.ts
 * Generator data dummy & cleanup. Tiap record dummy ditandai (lihat seed.constants)
 * agar cleanup hanya menghapus yang bertanda → data asli aman. Tanpa upload MinIO
 * (media pakai URL placeholder eksternal). Tanpa dependency faker (teks statis).
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictError, ForbiddenError } from '../../common/errors/domain.error';
import { slugify } from '../../common/utils/slug';
import { GenerateSeedDto } from './dto/generate-seed.dto';
import {
  SEED_COMMENT_EMAIL_DOMAIN,
  SEED_DEFAULTS,
  SEED_FLAG,
  SEED_MANIFEST_KEY,
  SEED_MEDIA_KEY_PREFIX,
  SEED_MEDIA_PROVIDER,
  SEED_META_KEY,
  SEED_NAME_PREFIX,
  SEED_SETTING_KEYS,
  SEED_TERM_SLUG_PREFIX,
  type SeedCounts,
  type SeedManifest,
} from './seed.constants';

// ── Sumber teks statis (cukup untuk prototype) ────────────────
const CATEGORY_NAMES = [
  'Nasional', 'Ekonomi', 'Olahraga', 'Teknologi', 'Hiburan', 'Politik',
  'Internasional', 'Kesehatan', 'Pendidikan', 'Lingkungan',
];
const CATEGORY_COLORS = ['#C8102E', '#1D4ED8', '#059669', '#D97706', '#7C3AED', '#DB2777'];
const TAG_NAMES = [
  'Terkini', 'Eksklusif', 'Analisis', 'Wawancara', 'Opini',
  'Liputan Khusus', 'Investigasi', 'Tren', 'Viral', 'Mendalam',
];
const FIRST_NAMES = [
  'Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi',
  'Indah', 'Joko', 'Kirana', 'Lukman',
];
const LAST_NAMES = [
  'Pratama', 'Santoso', 'Wijaya', 'Lestari', 'Nugroho', 'Halim',
  'Kusuma', 'Saputra', 'Maharani', 'Permana', 'Rahmawati', 'Sutanto',
];
const TITLE_SUBJECTS = [
  'Pemerintah', 'Tim Nasional', 'Startup Lokal', 'Pelaku UMKM', 'Akademisi',
  'Komunitas Warga', 'Investor Asing', 'Kementerian', 'Pemuda Daerah', 'Para Ahli',
];
const TITLE_ACTIONS = [
  'Luncurkan Inisiatif Baru', 'Raih Penghargaan Bergengsi', 'Dorong Inovasi Digital',
  'Soroti Isu Lingkungan', 'Gelar Forum Diskusi', 'Catat Rekor Pertumbuhan',
  'Hadapi Tantangan Global', 'Perkuat Kolaborasi Strategis', 'Umumkan Terobosan',
  'Siapkan Langkah Konkret',
];
const PARAGRAPHS = [
  'Perkembangan ini menjadi sorotan publik dan diperkirakan berdampak luas pada masyarakat di berbagai daerah.',
  'Sejumlah pihak menyambut baik langkah tersebut, sembari berharap pelaksanaannya berjalan transparan dan akuntabel.',
  'Pengamat menilai momentum saat ini dapat menjadi pijakan penting bila dikelola dengan tata kelola yang baik.',
  'Data di lapangan menunjukkan tren positif dalam beberapa pekan terakhir, meski masih perlu pemantauan lanjutan.',
  'Para pemangku kepentingan menargetkan langkah konkret dapat terlihat dalam waktu dekat agar manfaatnya segera dirasakan.',
];
const COMMENT_NAMES = ['Rani', 'Budi', 'Sari', 'Tono', 'Maya', 'Dimas', 'Lina', 'Agus'];
const COMMENT_BODIES = [
  'Liputan yang sangat berimbang, terima kasih redaksi.',
  'Apakah ada update terbaru soal ini?',
  'Informasi yang bermanfaat, ditunggu kelanjutannya.',
  'Semoga benar-benar terealisasi di lapangan.',
  'Artikel yang mencerahkan, lanjutkan!',
];

@Injectable()
export class SeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Status data dummy: ada/tidak, jumlah per entitas, kapan dibuat. */
  async status(): Promise<{ exists: boolean; counts: SeedCounts; generatedAt: string | null }> {
    const manifest = await this.readManifest();
    const counts = await this.countSeeded();
    const exists =
      manifest !== null ||
      counts.contents > 0 ||
      counts.authors > 0 ||
      counts.terms > 0;
    return { exists, counts, generatedAt: manifest?.generatedAt ?? null };
  }

  /** Generate seluruh data dummy. Tolak bila data dummy sudah ada (idempotensi prototype). */
  async generate(dto: GenerateSeedDto): Promise<{ counts: SeedCounts }> {
    this.assertGenerateAllowed();

    const { exists } = await this.status();
    if (exists) {
      throw new ConflictError(
        'SEED_ALREADY_EXISTS',
        'Data dummy sudah ada. Bersihkan dulu sebelum membuat ulang.',
      );
    }

    const nCategories = dto.categories ?? SEED_DEFAULTS.categories;
    const nTags = dto.tags ?? SEED_DEFAULTS.tags;
    const nAuthors = dto.authors ?? SEED_DEFAULTS.authors;
    const nContents = dto.contents ?? SEED_DEFAULTS.contents;
    const includeComments = dto.includeComments ?? true;
    const includeMenuWidget = dto.includeMenuWidget ?? true;
    const includeAdsPopup = dto.includeAdsPopup ?? true;

    const counts: SeedCounts = {
      authors: 0, terms: 0, contents: 0, media: 0, comments: 0, ads: 0, popups: 0, settings: 0,
    };

    // 1. Pastikan taksonomi dasar ada (reuse pola prisma/seed.ts).
    const categoryTax = await this.prisma.taxonomy.upsert({
      where: { slug: 'category' },
      update: {},
      create: { slug: 'category', label: 'Category', hierarchical: true },
    });
    const tagTax = await this.prisma.taxonomy.upsert({
      where: { slug: 'tag' },
      update: {},
      create: { slug: 'tag', label: 'Tag', hierarchical: false },
    });

    // 2. Term dummy (slug ber-prefix dummy-).
    const categoryTerms: { id: string; name: string; slug: string; color: string }[] = [];
    for (let i = 0; i < nCategories; i++) {
      const name = CATEGORY_NAMES[i % CATEGORY_NAMES.length] + (i >= CATEGORY_NAMES.length ? ` ${i}` : '');
      const slug = SEED_TERM_SLUG_PREFIX + slugify(name);
      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      const term = await this.prisma.term.create({
        data: { taxonomyId: categoryTax.id, name, slug, color, description: 'Kategori dummy' },
      });
      categoryTerms.push({ id: term.id, name, slug, color });
      counts.terms++;
    }
    const tagTerms: { id: string; slug: string }[] = [];
    for (let i = 0; i < nTags; i++) {
      const name = TAG_NAMES[i % TAG_NAMES.length] + (i >= TAG_NAMES.length ? ` ${i}` : '');
      const slug = SEED_TERM_SLUG_PREFIX + slugify(name);
      const term = await this.prisma.term.create({
        data: { taxonomyId: tagTax.id, name, slug, description: 'Tag dummy' },
      });
      tagTerms.push({ id: term.id, slug });
      counts.terms++;
    }

    // 3. Author dummy (socialLinks.__seed = 'dummy').
    const authors: { id: string; name: string }[] = [];
    for (let i = 0; i < nAuthors; i++) {
      const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
      const author = await this.prisma.author.create({
        data: {
          displayName: name,
          bio: `Jurnalis dummy untuk pengujian (#${i + 1}).`,
          socialLinks: { __seed: SEED_FLAG, twitter: `https://twitter.com/dummy${i}` } as Prisma.InputJsonValue,
        },
      });
      authors.push({ id: author.id, name });
      counts.authors++;
    }

    // 4 & 5. Media placeholder + Content dummy + relasi + ContentMeta penanda.
    const now = Date.now();
    const createdContentIds: string[] = [];
    for (let i = 0; i < nContents; i++) {
      const subject = TITLE_SUBJECTS[i % TITLE_SUBJECTS.length];
      const action = TITLE_ACTIONS[i % TITLE_ACTIONS.length];
      const title = `${subject} ${action} #${i + 1}`;
      const slug = `${SEED_TERM_SLUG_PREFIX}${slugify(title)}-${i + 1}`;
      const cat = categoryTerms[i % Math.max(categoryTerms.length, 1)];
      const author = authors[i % Math.max(authors.length, 1)];
      const tag = tagTerms.length ? tagTerms[i % tagTerms.length] : null;
      const publishedAt = new Date(now - i * 6 * 3_600_000); // mundur ~6 jam tiap konten

      // Media placeholder (tanpa upload MinIO).
      const media = await this.prisma.media.create({
        data: {
          fileUrl: `https://picsum.photos/seed/${SEED_FLAG}${i}/1200/630`,
          storageKey: `${SEED_MEDIA_KEY_PREFIX}${i}`,
          mimeType: 'image/jpeg',
          fileSize: 0,
          width: 1200,
          height: 630,
          altText: title,
          storageProvider: SEED_MEDIA_PROVIDER,
        },
      });
      counts.media++;

      const body = [
        `<p>${title}. ${PARAGRAPHS[i % PARAGRAPHS.length]}</p>`,
        ...PARAGRAPHS.map((p) => `<p>${p}</p>`),
      ].join('\n');

      const content = await this.prisma.content.create({
        data: {
          type: 'post',
          title,
          slug,
          body,
          excerpt: PARAGRAPHS[i % PARAGRAPHS.length],
          status: 'published',
          publishedAt,
          featuredMediaId: media.id,
          primaryAuthorId: author?.id ?? null,
          metas: { create: [{ metaKey: SEED_META_KEY, metaValue: SEED_FLAG }] },
          authors: author ? { create: [{ authorId: author.id, role: 'primary', sortOrder: 0 }] } : undefined,
          terms: {
            create: [
              ...(cat ? [{ termId: cat.id }] : []),
              ...(tag ? [{ termId: tag.id }] : []),
            ],
          },
        },
      });
      createdContentIds.push(content.id);
      counts.contents++;

      // 6. Komentar dummy untuk sebagian konten (genap), sebagian berbalas.
      if (includeComments && i % 2 === 0) {
        const root = await this.prisma.comment.create({
          data: {
            contentId: content.id,
            guestName: COMMENT_NAMES[i % COMMENT_NAMES.length],
            guestEmail: `dummy+${i}@${SEED_COMMENT_EMAIL_DOMAIN}`,
            body: COMMENT_BODIES[i % COMMENT_BODIES.length],
            status: 'approved',
          },
        });
        counts.comments++;
        await this.prisma.comment.create({
          data: {
            contentId: content.id,
            parentId: root.id,
            guestName: 'Redaksi',
            guestEmail: `dummy+reply${i}@${SEED_COMMENT_EMAIL_DOMAIN}`,
            body: 'Terima kasih atas tanggapannya. Kami akan terus memantau perkembangan.',
            status: 'approved',
          },
        });
        counts.comments++;
      }
    }

    // 7. Iklan & Popup dummy.
    if (includeAdsPopup) {
      const adPositions = ['in_post_below_title', 'post_sidebar_left', 'floating_top_nav', 'floating_bottom_timer'];
      for (let i = 0; i < SEED_DEFAULTS.ads; i++) {
        await this.prisma.adSlot.create({
          data: {
            name: `${SEED_NAME_PREFIX}Slot ${i + 1}`,
            kind: 'image',
            position: adPositions[i % adPositions.length],
            active: true,
            config: { image_media_id: '', target_url: 'https://example.com', alt: 'Iklan dummy' } as Prisma.InputJsonValue,
            options: { __seed: SEED_FLAG } as Prisma.InputJsonValue,
            sortOrder: i,
          },
        });
        counts.ads++;
      }
      for (let i = 0; i < SEED_DEFAULTS.popups; i++) {
        await this.prisma.popup.create({
          data: {
            name: `${SEED_NAME_PREFIX}Popup ${i + 1}`,
            kind: 'html',
            active: true,
            content: { html: `<div style="padding:1rem">Popup dummy #${i + 1}</div>` } as Prisma.InputJsonValue,
            display: { __seed: SEED_FLAG, scope: 'all_public', delay_seconds: 3, frequency: 'session' } as Prisma.InputJsonValue,
            sortOrder: i,
          },
        });
        counts.popups++;
      }
    }

    // 8. Setting menu/widget/footer/identitas (shape disamakan dgn frontend public).
    const writtenSettingKeys: string[] = [];
    if (includeMenuWidget) {
      const settings = this.buildSettings(categoryTerms);
      await this.prisma.$transaction(
        Object.entries(settings).map(([key, value]) =>
          this.prisma.setting.upsert({
            where: { key },
            update: { value: value as Prisma.InputJsonValue },
            create: { key, value: value as Prisma.InputJsonValue },
          }),
        ),
      );
      writtenSettingKeys.push(...Object.keys(settings));
      counts.settings = writtenSettingKeys.length;
    }

    // 9. Tulis manifest (selalu, agar status & cleanup tahu batch ini).
    const manifest: SeedManifest = {
      generatedAt: new Date().toISOString(),
      counts,
      settingKeys: writtenSettingKeys,
    };
    await this.prisma.setting.upsert({
      where: { key: SEED_MANIFEST_KEY },
      update: { value: manifest as unknown as Prisma.InputJsonValue, autoload: false },
      create: { key: SEED_MANIFEST_KEY, value: manifest as unknown as Prisma.InputJsonValue, autoload: false },
    });

    return { counts };
  }

  /** Hapus seluruh data bertanda. Data asli & taksonomi dasar dipertahankan. */
  async cleanup(): Promise<{ counts: SeedCounts }> {
    const manifest = await this.readManifest();
    const counts: SeedCounts = {
      authors: 0, terms: 0, contents: 0, media: 0, comments: 0, ads: 0, popups: 0, settings: 0,
    };

    // Konten dummy (punya ContentMeta __seed=dummy). Cascade → ContentMeta/Author/Term/Comment.
    const dummyContents = await this.prisma.content.findMany({
      where: { metas: { some: { metaKey: SEED_META_KEY, metaValue: SEED_FLAG } } },
      select: { id: true },
    });
    if (dummyContents.length) {
      const res = await this.prisma.content.deleteMany({
        where: { id: { in: dummyContents.map((c) => c.id) } },
      });
      counts.contents = res.count;
    }

    // Komentar dummy sisa (mis. menempel pada konten non-dummy) by guestEmail.
    const resComments = await this.prisma.comment.deleteMany({
      where: { guestEmail: { endsWith: `@${SEED_COMMENT_EMAIL_DOMAIN}` } },
    });
    counts.comments = resComments.count;

    // Author dummy (socialLinks.__seed = 'dummy').
    const resAuthors = await this.prisma.author.deleteMany({
      where: { socialLinks: { path: ['__seed'], equals: SEED_FLAG } },
    });
    counts.authors = resAuthors.count;

    // Term dummy (slug ber-prefix dummy-); taksonomi dasar dipertahankan.
    const resTerms = await this.prisma.term.deleteMany({
      where: { slug: { startsWith: SEED_TERM_SLUG_PREFIX } },
    });
    counts.terms = resTerms.count;

    // Media dummy (provider external + storageKey prefix; tak ada objek MinIO).
    const resMedia = await this.prisma.media.deleteMany({
      where: { storageProvider: SEED_MEDIA_PROVIDER, storageKey: { startsWith: SEED_MEDIA_KEY_PREFIX } },
    });
    counts.media = resMedia.count;

    // Iklan & Popup dummy (nama ber-prefix [DUMMY]).
    const resAds = await this.prisma.adSlot.deleteMany({
      where: { name: { startsWith: SEED_NAME_PREFIX } },
    });
    counts.ads = resAds.count;
    const resPopups = await this.prisma.popup.deleteMany({
      where: { name: { startsWith: SEED_NAME_PREFIX } },
    });
    counts.popups = resPopups.count;

    // Setting dummy: hapus key yang tercatat di manifest (atau fallback daftar default).
    const settingKeys = manifest?.settingKeys ?? [...SEED_SETTING_KEYS];
    if (settingKeys.length) {
      const resSettings = await this.prisma.setting.deleteMany({ where: { key: { in: settingKeys } } });
      counts.settings = resSettings.count;
    }
    // Hapus manifest terakhir.
    await this.prisma.setting.deleteMany({ where: { key: SEED_MANIFEST_KEY } });

    return { counts };
  }

  // ── Helpers privat ─────────────────────────────────────────

  /** Blokir generate di production kecuali ALLOW_DUMMY_SEED=true. Cleanup selalu boleh. */
  private assertGenerateAllowed() {
    const nodeEnv = this.config.get<string>('app.nodeEnv', 'development');
    const allow = process.env.ALLOW_DUMMY_SEED === 'true';
    if (nodeEnv === 'production' && !allow) {
      throw new ForbiddenError(
        'Generate data dummy dinonaktifkan di production. Set ALLOW_DUMMY_SEED=true untuk mengizinkan.',
      );
    }
  }

  private async readManifest(): Promise<SeedManifest | null> {
    const row = await this.prisma.setting.findUnique({ where: { key: SEED_MANIFEST_KEY } });
    return (row?.value as unknown as SeedManifest) ?? null;
  }

  /** Hitung record bertanda untuk status (independen dari manifest). */
  private async countSeeded(): Promise<SeedCounts> {
    const [contents, authors, terms, media, comments, ads, popups] = await Promise.all([
      this.prisma.content.count({
        where: { metas: { some: { metaKey: SEED_META_KEY, metaValue: SEED_FLAG } } },
      }),
      this.prisma.author.count({ where: { socialLinks: { path: ['__seed'], equals: SEED_FLAG } } }),
      this.prisma.term.count({ where: { slug: { startsWith: SEED_TERM_SLUG_PREFIX } } }),
      this.prisma.media.count({
        where: { storageProvider: SEED_MEDIA_PROVIDER, storageKey: { startsWith: SEED_MEDIA_KEY_PREFIX } },
      }),
      this.prisma.comment.count({ where: { guestEmail: { endsWith: `@${SEED_COMMENT_EMAIL_DOMAIN}` } } }),
      this.prisma.adSlot.count({ where: { name: { startsWith: SEED_NAME_PREFIX } } }),
      this.prisma.popup.count({ where: { name: { startsWith: SEED_NAME_PREFIX } } }),
    ]);
    return { contents, authors, terms, media, comments, ads, popups, settings: 0 };
  }

  /**
   * Bangun map Setting untuk beranda publik. Shape disamakan dengan konsumsi FE:
   * - home.menu  : { top, secondary, footer } tiap item { id,label,url,source,ref_id,children }
   * - home.widgets: Widget[] (placement/source_mode/auto/manual/taxonomy/active/sort_order)
   * - site.*     : identitas; home.footer + social.links : footer.
   */
  private buildSettings(categoryTerms: { id: string; name: string; slug: string }[]): Record<string, unknown> {
    const menuItem = (label: string, url: string, source = 'custom', ref_id: string | null = null) => ({
      id: `m-${slugify(label)}`,
      label,
      url,
      source,
      ref_id,
      children: [],
    });

    const topMenu = [
      menuItem('Beranda', '/'),
      ...categoryTerms.slice(0, 5).map((t) =>
        menuItem(t.name, `/kategori/${t.slug}`, 'category', t.id),
      ),
    ];
    const secondaryMenu = categoryTerms.slice(0, 8).map((t) =>
      menuItem(t.name, `/kategori/${t.slug}`, 'category', t.id),
    );

    const widget = (
      title: string,
      placement: string,
      sort_order: number,
      autoLimit = 5,
    ) => ({
      id: `wg-${placement}`,
      title,
      placement,
      source_mode: 'auto',
      auto: { content_type: 'post', sort: '-published_at', limit: autoLimit },
      manual: [],
      taxonomy: { taxonomy_slug: 'category', term_id: '', term_slug: '', content_type: 'post', limit: 5 },
      active: true,
      sort_order,
    });

    return {
      'site.title': 'WARTAKAN MEDIA',
      'site.tagline': 'Portal berita dummy untuk pengujian panel admin.',
      'site.footer_desc': 'Data ini dibuat oleh Generator Data Dummy dan dapat dihapus kapan saja.',
      'home.menu': { top: topMenu, secondary: secondaryMenu, footer: [] },
      'home.widgets': [
        widget('Populer', 'popular', 0),
        widget('Pilihan Editor', 'editorsPick', 1),
        widget('Video', 'video', 2),
        widget('Opini', 'opinion', 3),
      ],
      'home.footer': {
        columns: [
          { title: 'Kanal', links: categoryTerms.slice(0, 4).map((t) => ({ label: t.name, url: `/kategori/${t.slug}` })) },
          { title: 'Tentang', links: [{ label: 'Redaksi', url: '/redaksi' }, { label: 'Kontak', url: '/kontak' }] },
        ],
        social: [
          { platform: 'twitter', url: 'https://twitter.com/dummy' },
          { platform: 'instagram', url: 'https://instagram.com/dummy' },
        ],
        copyright: `© ${new Date().getFullYear()} WARTAKAN MEDIA (Data Dummy)`,
      },
      'social.links': [
        { platform: 'twitter', url: 'https://twitter.com/dummy' },
        { platform: 'instagram', url: 'https://instagram.com/dummy' },
      ],
    };
  }
}
