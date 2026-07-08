/**
 * src/modules/seed/seed.constants.ts
 * Konstanta penanda data dummy + key Setting + default jumlah. Sumber tunggal agar
 * generate & cleanup selalu konsisten (penanda sama → cleanup aman, tak menyentuh data asli).
 */

/** Nilai penanda generik untuk seluruh entitas dummy. */
export const SEED_FLAG = 'dummy';

/** Prefix slug untuk Term dummy (kategori/tag) → mudah difilter saat cleanup. */
export const SEED_TERM_SLUG_PREFIX = 'dummy-';

/** Prefix storageKey Media dummy; storageProvider='external' menandai tanpa objek MinIO. */
export const SEED_MEDIA_KEY_PREFIX = '__seed/';
export const SEED_MEDIA_PROVIDER = 'external';

/** Prefix nama untuk AdSlot & Popup dummy (selain flag di JSON). */
export const SEED_NAME_PREFIX = '[DUMMY] ';

/** Pola guestEmail komentar dummy (penanda by convention). */
export const SEED_COMMENT_EMAIL_DOMAIN = 'seed.local';

/** meta_key pada ContentMeta untuk menandai konten dummy. */
export const SEED_META_KEY = '__seed';

/** Key Setting manifest: catat ringkasan + key Setting yang ditulis dummy. */
export const SEED_MANIFEST_KEY = 'seed.dummy.manifest';

/** Key Setting yang diisi dummy (menu/widget/identitas/footer beranda publik). */
export const SEED_SETTING_KEYS = [
  'home.menu',
  'home.widgets',
  'home.footer',
  'site.title',
  'site.tagline',
  'site.footer_desc',
  'social.links',
] as const;

/** Default jumlah generate (bisa di-override via DTO). */
export const SEED_DEFAULTS = {
  authors: 12,
  categories: 6,
  tags: 8,
  contents: 40,
  commentsPerContent: 2, // sebagian konten dapat komentar
  ads: 4,
  popups: 2,
} as const;

/** Manifest yang disimpan di Setting SEED_MANIFEST_KEY. */
export interface SeedManifest {
  generatedAt: string;
  counts: SeedCounts;
  settingKeys: string[];
}

/** Ringkasan jumlah record dummy (untuk status, hasil generate & cleanup). */
export interface SeedCounts {
  authors: number;
  terms: number;
  contents: number;
  media: number;
  comments: number;
  ads: number;
  popups: number;
  settings: number;
}
