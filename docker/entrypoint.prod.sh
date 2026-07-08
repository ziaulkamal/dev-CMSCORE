#!/bin/sh
# docker/entrypoint.prod.sh — tunggu DB, jalankan migrasi, lalu start app produksi.
set -e

echo "[entrypoint] menunggu PostgreSQL di ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}..."
until nc -z "${POSTGRES_HOST:-postgres}" "${POSTGRES_PORT:-5432}" 2>/dev/null; do
  sleep 1
done

echo "[entrypoint] terapkan migrasi database (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] start: $*"
exec "$@"
