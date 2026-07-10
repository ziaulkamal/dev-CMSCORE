#!/bin/sh
# docker/entrypoint.prod.sh — tunggu DB, jalankan migrasi, lalu start app produksi.
set -e

echo "[entrypoint] menunggu PostgreSQL di ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}..."
until nc -z "${POSTGRES_HOST:-postgres}" "${POSTGRES_PORT:-5432}" 2>/dev/null; do
  sleep 1
done

echo "[entrypoint] terapkan migrasi database (prisma migrate deploy)..."
npx prisma migrate deploy

# Catatan: RBAC (role/capability), taksonomi dasar, dan super admin TIDAK di-seed
# di sini. Semua dibuat otomatis & idempotent oleh RbacBootstrapService saat app
# start (OnApplicationBootstrap) — jalan tanpa ts-node, cocok untuk image prod.
# Kredensial admin wajib dari SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD (lihat .env.prod.example).
echo "[entrypoint] start: $*"
exec "$@"
