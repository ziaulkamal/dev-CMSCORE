/**
 * src/modules/content/content-type.registry.ts
 * Registry CPT (PRD §5): tipe konten + meta_key yang dikenali. Tambah tipe di sini
 * tanpa migrasi schema (field disimpan EAV di content_meta).
 */

export interface ContentTypeDef {
  type: string;
  label: string;
  /** meta_key khusus tipe ini (selain SEO meta bersama). */
  metaKeys: string[];
  hierarchical: boolean;
}

/** SEO meta berlaku untuk semua tipe (PRD §5). */
export const SEO_META_KEYS = ['seo_title', 'seo_description', 'og_image'] as const;

export const CONTENT_TYPES: Record<string, ContentTypeDef> = {
  post: { type: 'post', label: 'Post', metaKeys: [], hierarchical: false },
  page: { type: 'page', label: 'Page', metaKeys: ['template'], hierarchical: true },
  video: {
    type: 'video',
    label: 'Video',
    metaKeys: ['video_url', 'video_provider', 'video_duration', 'video_thumbnail'],
    hierarchical: false,
  },
  gallery: {
    type: 'gallery',
    label: 'Gallery',
    metaKeys: ['gallery_items', 'gallery_cover', 'gallery_layout'],
    hierarchical: false,
  },
  live_report: {
    type: 'live_report',
    label: 'Live Report',
    metaKeys: ['event_start_time', 'event_end_time', 'live_status', 'timeline_entries'],
    hierarchical: false,
  },
};

export function isKnownType(type: string): boolean {
  return type in CONTENT_TYPES;
}

/** Daftar meta_key yang diizinkan untuk tipe (khusus + SEO). */
export function allowedMetaKeys(type: string): string[] {
  const def = CONTENT_TYPES[type];
  return def ? [...def.metaKeys, ...SEO_META_KEYS] : [...SEO_META_KEYS];
}
