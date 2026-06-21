#!/bin/sh
# docker/entrypoint.dev.sh — tunggu DB, jalankan migrasi & seed, lalu start app.
set -e

echo "[entrypoint] menunggu PostgreSQL di ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}..."
until nc -z "${POSTGRES_HOST:-postgres}" "${POSTGRES_PORT:-5432}" 2>/dev/null; do
  sleep 1
done

echo "[entrypoint] generate Prisma client..."
pnpm prisma generate >/dev/null 2>&1 || true

echo "[entrypoint] terapkan migrasi (atau db push bila belum ada migrasi)..."
if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  pnpm prisma migrate deploy
else
  pnpm prisma db push --skip-generate
fi

echo "[entrypoint] seed RBAC & data dasar..."
pnpm run db:seed || echo "[entrypoint] seed dilewati/gagal (lanjut)."

echo "[entrypoint] start: $*"
exec "$@"
