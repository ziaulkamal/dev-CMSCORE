/**
 * src/common/config/env.validation.ts
 * Validasi environment saat boot (fail-fast). Tanpa dependency baru (bukan Joi).
 * Dipasang di ConfigModule.forRoot({ validate: validateEnv }).
 *
 * Tujuan utama: cegah deploy PRODUKSI dengan secret placeholder/kosong yang
 * membuat aplikasi jalan diam-diam dengan JWT lemah, Redis/MinIO tanpa proteksi,
 * atau CORS yang belum diisi.
 */

/** Penanda nilai yang jelas-jelas placeholder (belum diganti operator). */
const PLACEHOLDER_MARKERS = ['change-me', '<ganti', '<GANTI', '<ip-server', '<IP-SERVER'];

function looksPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  const lower = v.toLowerCase();
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

/**
 * Validasi & kembalikan config apa adanya bila lolos; lempar Error (boot berhenti)
 * dengan daftar seluruh masalah bila tidak.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];
  const get = (k: string): string | undefined => {
    const v = config[k];
    return v === undefined || v === null ? undefined : String(v);
  };

  // ── Wajib di semua environment ──────────────────────────────
  const dbUrl = get('DATABASE_URL');
  if (!dbUrl || !/^postgres(ql)?:\/\//.test(dbUrl)) {
    errors.push('DATABASE_URL wajib diisi & berformat postgresql://...');
  }

  const isProd = (get('NODE_ENV') ?? 'development') === 'production';

  // ── Ketat hanya di produksi ─────────────────────────────────
  if (isProd) {
    const requireSecret = (key: string, minLen = 16) => {
      const val = get(key);
      if (looksPlaceholder(val)) {
        errors.push(`${key} wajib di-set (bukan placeholder) di produksi`);
      } else if (val!.length < minLen) {
        errors.push(`${key} terlalu pendek (min ${minLen} karakter) di produksi`);
      }
    };

    requireSecret('JWT_ACCESS_SECRET');
    requireSecret('JWT_REFRESH_SECRET');
    requireSecret('REDIS_PASSWORD', 8);
    requireSecret('MINIO_SECRET_KEY', 8);

    const cors = get('CORS_ORIGINS');
    if (looksPlaceholder(cors)) {
      errors.push('CORS_ORIGINS wajib diisi origin nyata (masih placeholder <IP-SERVER>)');
    }
  }

  if (errors.length) {
    throw new Error(
      `[env] Validasi environment gagal:\n  - ${errors.join('\n  - ')}\n` +
        `Perbaiki .env (produksi: lihat .env.prod.example) lalu jalankan ulang.`,
    );
  }

  return config;
}
