// src/common/utils/slug.ts — slugify judul jadi slug URL-safe.

/** Ubah teks ke slug lowercase, dash-separated, tanpa karakter non-alfanumerik. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}
