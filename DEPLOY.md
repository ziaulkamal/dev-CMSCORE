# DEPLOY.md — Menjalankan CMS Core + CMS Panel via Podman

Panduan menjalankan dua project yang saling terhubung dalam mode **development** (hot-reload) di Windows menggunakan **Podman**:

- **dev-CMSCORE** — backend headless API (NestJS + Prisma) + Postgres + Redis + MinIO.
- **dev-CMSPANEL** — frontend SPA (Vite + Vue 3 + Tailwind v4) yang memanggil API CMSCORE dari browser.

> Dokumen ini menggambarkan setup akhir. Bila baru pertama kali, ikuti berurutan dari [§1](#1-prasyarat) sampai [§6](#6-verifikasi). Untuk operasi harian, lompat ke [§7 Operasi Harian](#7-operasi-harian).

---

## Ringkasan Port

Semua port **host** ditata rapi di range **40200–40205**. Yang dipindah hanyalah port yang di-*publish* ke host; port **internal container** tetap default (koneksi antar-service via nama service tidak berubah).

**Semua port di-bind ke `127.0.0.1`** (loopback) — hanya terjangkau dari mesin ini, **tidak** dari jaringan luar/LAN. Lihat [§10 Keamanan Port](#10-keamanan-port).

| Layanan             | Akses dari host (Windows)        | Bind         | Port container | Kredensial                       |
| ------------------- | -------------------------------- | ------------ | -------------- | -------------------------------- |
| CMSCORE API (NestJS)| http://localhost:40200/v1        | 127.0.0.1    | 3000           | —                                |
| Swagger Docs        | http://localhost:40200/docs      | 127.0.0.1    | 3000           | —                                |
| CMSPANEL (Vite)     | http://localhost:40201           | 127.0.0.1    | 40201          | —                                |
| Postgres            | `localhost:40202`                | 127.0.0.1 ⚠️ | 5432           | `cms` / `cms_secret` / db `cmscore` |
| Redis               | `localhost:40203`                | 127.0.0.1 ⚠️ | 6379           | (tanpa password)                 |
| MinIO API (S3)      | http://localhost:40204           | 127.0.0.1    | 9000           | `cms_minio` / `cms_minio_secret` |
| MinIO Console       | http://localhost:40205           | 127.0.0.1    | 9001           | `cms_minio` / `cms_minio_secret` |

⚠️ Postgres & Redis: expose **hanya** untuk tool desktop (DBeaver/RedisInsight) dari mesin ini. Aplikasi tidak memakainya (lewat jaringan internal container).

**Super admin (hasil seed):** `admin@cmscore.local` / `ChangeMe123!`

---

## 1. Prasyarat

- **Podman** (diuji pada v5.8.2) dengan mesin WSL berjalan.
- **podman-compose** (provider Python, diuji pada v1.6.0) — di Windows ini yang dipakai `podman compose`.

Verifikasi:

```bash
podman --version
podman machine list         # pastikan "Currently running"
podman compose version
```

Jika mesin belum jalan: `podman machine start`.

---

## 2. Peta Direktori

```
d:/Projects/
├── dev-CMSCORE/     # backend — stack utama (app + postgres + redis + minio)
│   ├── compose.yaml
│   ├── Dockerfile.dev
│   ├── docker/entrypoint.dev.sh
│   └── .env
└── dev-CMSPANEL/    # frontend — stack Vite tunggal
    ├── compose.yaml
    ├── Dockerfile
    └── .env
```

CMSPANEL memanggil CMSCORE **dari browser** (bukan antar-container), sehingga `VITE_API_BASE_URL` menunjuk port host `40200` yang ter-publish.

---

## 3. Dua Kuirk Podman yang WAJIB Dipahami

Setup ini punya dua jebakan yang **sudah diselesaikan** di config, tapi harus dipahami agar tidak "memperbaiki" ke arah yang salah.

### 3.1 `podman-compose` mengabaikan key `dockerfile:`

`podman-compose` 1.6.0 **mengabaikan** `build.dockerfile` di compose. Untuk CMSCORE, service `app` memakai `Dockerfile.dev` — jika langsung `podman compose up --build`, ia mencari `Dockerfile` default dan **gagal**:

```
Error: no Containerfile or Dockerfile specified or found in context directory
```

**Solusi (dipakai di §5):** build image secara **manual** dengan `podman build -f <Dockerfile>` lebih dulu, lalu `podman compose up -d` (tanpa `--build`) yang memakai image pre-built.

### 3.2 `podman restart` TIDAK memuat ulang `.env`

Podman meng-inject `env_file` hanya saat container **dibuat** (`up` / `--force-recreate`), **bukan** saat `restart`. Jadi setelah mengubah `.env`:

```bash
# ❌ SALAH — env lama tetap dipakai
podman restart dev-cmscore_app_1

# ✅ BENAR — env_file dibaca ulang
podman compose up -d --force-recreate app
```

---

## 4. Konfigurasi Environment

### 4.1 `dev-CMSCORE/.env`

Poin penting — bedakan **port internal** vs **port host**:

| Variabel            | Nilai                                    | Catatan                                                    |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `PORT`              | `3000`                                   | Port **internal** NestJS. JANGAN ubah — mapping `40200:3000` mengarah ke sini. |
| `DATABASE_URL`      | `...@postgres:5432/cmscore`              | Koneksi **internal** (nama service + port container).       |
| `REDIS_HOST/PORT`   | `redis` / `6379`                         | Koneksi **internal**.                                       |
| `MINIO_ENDPOINT/PORT`| `minio` / `9000`                        | Koneksi **internal**.                                       |
| `MINIO_PUBLIC_URL`  | `http://localhost:40204/cms-media`       | Diakses **browser** → pakai port host `40204`.              |
| `CORS_ORIGINS`      | lihat di bawah                           | Origin **browser** → pakai port host, sertakan `127.0.0.1`. |

```
CORS_ORIGINS=http://localhost:40200,http://localhost:40201,http://127.0.0.1:40200,http://127.0.0.1:40201,http://localhost:8080,http://localhost:40204
```

> **Kenapa `127.0.0.1` disertakan:** CORS mencocokkan origin sebagai **string persis** — `127.0.0.1` ≠ `localhost`. Jika browser membuka panel via `http://127.0.0.1:40201`, origin itu harus ada di daftar, atau request API ditolak CORS.

### 4.2 `dev-CMSPANEL/.env`

```
VITE_API_BASE_URL=http://localhost:40200/v1
VITE_USE_MOCK=false
```

> **Kenapa `.env` di-mount ke container panel** (lihat `compose.yaml` panel): `.env` di-*exclude* oleh `.dockerignore` **dan** `env_file` compose hanya menaruh variabel ke env OS container. Vite membaca `VITE_*` untuk client bundle dari **file `.env` di disk**, bukan dari env OS. Tanpa mount `./.env:/app/.env`, `import.meta.env.VITE_API_BASE_URL` menjadi `undefined` → Axios memanggil URL relatif → error **"Tidak dapat terhubung ke server"** di browser.

---

## 5. Setup Awal (dari nol)

### Langkah 0 — Bebaskan port yang bentrok (bila ada)

Range 40200-an dipilih agar jarang bentrok, tapi periksa dulu:

```bash
# Lihat container lain yang sedang berjalan & port host yang dipakai
podman ps --format "{{.Names}}\t{{.Ports}}"
```

Jika ada stack lain memakai 40200–40205, hentikan dulu (`podman stop <nama>`) atau remap. Hentikan/hapus container lama kedua project jika ada sisa:

```bash
podman rm -f dev-cmscore_app_1 dev-cmscore_postgres_1 dev-cmscore_redis_1 \
             dev-cmscore_minio_1 dev-cmscore_minio-init_1 dev-cmspanel_web_1 2>/dev/null
```

### Langkah 1 — Build image secara manual (karena kuirk §3.1)

```bash
# CMSCORE — pakai Dockerfile.dev
cd d:/Projects/dev-CMSCORE
podman build -f Dockerfile.dev -t cms-core-dev .

# CMSPANEL — pakai Dockerfile (dev)
cd d:/Projects/dev-CMSPANEL
podman build -f Dockerfile -t cms-panel-dev .
```

> Build pertama menjalankan `pnpm install` (beberapa menit). Build berikutnya memakai cache selama lockfile tak berubah.

### Langkah 2 — Jalankan stack (pakai image pre-built, TANPA `--build`)

Jalankan **CMSCORE dulu** (panel bergantung pada API-nya):

```bash
cd d:/Projects/dev-CMSCORE
podman compose up -d
```

Urutan boot CMSCORE: postgres/redis/minio (healthcheck) → `minio-init` membuat bucket `cms-media` lalu exit → `app`. Container `app` menjalankan entrypoint: tunggu DB → `prisma generate` → migrasi/`db push` → **seed** (bikin super admin) → **build awal** (`nest build`) → `start:dev`. Boot pertama makan **~1–2 menit** (kompilasi TS di WSL).

Lalu panel:

```bash
cd d:/Projects/dev-CMSPANEL
podman compose up -d
```

---

## 6. Verifikasi

```bash
# Status semua container
podman ps --filter "name=dev-cms" --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"

# API siap? (200 = OK)
curl -s -o /dev/null -w "docs: %{http_code}\n" http://localhost:40200/docs

# Route ber-auth harus 401 (artinya server hidup & me-route, bukan mati)
curl -s -o /dev/null -w "dashboard: %{http_code}\n" http://localhost:40200/v1/dashboard/summary

# Panel siap?
curl -s -o /dev/null -w "panel: %{http_code}\n" http://localhost:40201

# Uji login (simulasi browser dari origin panel) → harus 201 + access_token
curl -s -X POST http://localhost:40200/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:40201" \
  -d '{"email":"admin@cmscore.local","password":"ChangeMe123!"}' \
  -w "\nHTTP %{http_code}\n"

# CORS preflight harus mengembalikan Access-Control-Allow-Origin yang cocok
curl -s -i -X OPTIONS http://localhost:40200/v1/auth/login \
  -H "Origin: http://localhost:40201" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control-allow-origin"
```

Setelah semua hijau: buka **http://localhost:40201** di browser (hard-refresh `Ctrl+Shift+R`), login dengan super admin.

---

## 7. Operasi Harian

```bash
# START (image sudah ada — tak perlu build)
cd d:/Projects/dev-CMSCORE  && podman compose up -d
cd d:/Projects/dev-CMSPANEL && podman compose up -d

# STOP (container berhenti, volume data tetap aman)
cd d:/Projects/dev-CMSCORE  && podman compose down
cd d:/Projects/dev-CMSPANEL && podman compose down

# Log realtime
podman logs -f dev-cmscore_app_1
podman logs -f dev-cmspanel_web_1
```

**Hot-reload aktif**: edit di `src/` kedua project langsung ter-refresh tanpa rebuild image.

### Kapan harus rebuild image?

Hanya bila **dependency berubah** (`package.json` / `pnpm-lock.yaml`) atau **Dockerfile** diubah:

```bash
cd d:/Projects/dev-CMSCORE && podman build -f Dockerfile.dev -t cms-core-dev . && podman compose up -d --force-recreate app
```

### Setelah mengubah `.env`

Ingat kuirk §3.2 — `restart` tidak cukup:

```bash
# CMSCORE (.env dibaca app saat container dibuat)
cd d:/Projects/dev-CMSCORE && podman compose up -d --force-recreate app

# CMSPANEL (.env di-mount; Vite baca ulang saat proses restart)
cd d:/Projects/dev-CMSPANEL && podman compose restart web
```

---

## 8. Troubleshooting

| Gejala                                             | Sebab                                                                 | Solusi                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `no Containerfile or Dockerfile ... found`         | `podman compose up --build` + kuirk §3.1 (key `dockerfile` diabaikan) | Build manual: `podman build -f Dockerfile.dev -t cms-core-dev .` lalu `up -d` tanpa `--build`. |
| Browser: **"Tidak dapat terhubung ke server"**     | `VITE_API_BASE_URL` = `undefined` (`.env` tak ter-mount ke panel)    | Pastikan `./.env:/app/.env` ada di volumes panel; recreate: `podman compose up -d web`.    |
| Browser: **CORS error** saat login                 | Origin tidak ada di `CORS_ORIGINS` (mis. akses via `127.0.0.1`)      | Tambahkan origin ke `CORS_ORIGINS` di `.env` CMSCORE, lalu `up -d --force-recreate app`.   |
| Ubah `.env` tapi tidak berefek                     | Kuirk §3.2 — `restart` tak baca ulang `env_file`                     | `podman compose up -d --force-recreate app`.                                               |
| API `curl` = `000` (connection refused) sesaat     | NestJS masih `nest build` awal (~1–2 menit di WSL)                   | Tunggu; pantau `podman logs -f dev-cmscore_app_1` sampai "Nest application successfully started". |
| Port host bentrok dengan stack lain                | Layanan lain memakai 40200–40205                                     | Hentikan stack lain (`podman stop`) atau remap sisi kiri `HOST:CONTAINER` di compose.      |
| MinIO console 9001 dipakai app host (mis. Herd)    | (Historis) console dulu di 9001                                      | Sudah dipindah ke **40205**; port 9000/9001 kini bebas untuk app host.                     |

---

## 9. Data & Reset

Volume data persisten: `pgdata`, `redisdata`, `miniodata` (didefinisikan di `compose.yaml` CMSCORE).

```bash
# Reset TOTAL data CMSCORE (hapus volume — DB, Redis, objek MinIO hilang)
cd d:/Projects/dev-CMSCORE
podman compose down -v      # ⚠️ menghapus semua data; seed & migrasi jalan lagi saat up berikutnya
```

`down` biasa (tanpa `-v`) **tidak** menghapus data — hanya menghentikan container.

---

## 10. Keamanan Port

Prinsip: **jangan ekspos apa yang tidak perlu, dan yang perlu pun batasi ke loopback.**

### Siapa mengakses apa

| Layanan          | Diakses oleh                                   | Perlu publish ke host?              |
| ---------------- | ---------------------------------------------- | ----------------------------------- |
| CMSCORE API      | Browser (panel memanggil dari sisi klien)      | ✅ ya                               |
| CMSPANEL         | Browser (Anda membuka tab)                     | ✅ ya                               |
| MinIO API        | Browser (`MINIO_PUBLIC_URL` → load media)      | ✅ ya                               |
| Postgres         | Hanya `app`, via `postgres:5432` **internal**  | ❌ tidak (kecuali tool desktop)     |
| Redis            | Hanya `app`, via `redis:6379` **internal**     | ❌ tidak (kecuali tool desktop)     |
| MinIO Console    | Anda (dashboard admin manual)                  | ⚠️ opsional                         |

Aplikasi berbicara ke Postgres/Redis/MinIO lewat **jaringan internal container** (nama service), sehingga expose ke host **tidak** dibutuhkan untuk fungsi aplikasi.

### Keputusan: bind semua ke `127.0.0.1`

Setiap mapping port memakai bentuk `127.0.0.1:HOST:CONTAINER`, bukan `HOST:CONTAINER`.

- `HOST:CONTAINER` → Podman bind ke `0.0.0.0` (**semua** interface) → port terjangkau dari perangkat lain di jaringan/LAN.
- `127.0.0.1:HOST:CONTAINER` → bind ke **loopback** → hanya proses di mesin ini (browser, DBeaver) yang bisa akses.

Ini penting terutama untuk **Postgres** (kredensial dev lemah `cms_secret`) dan **Redis** (tanpa password) — keduanya tak boleh terjangkau jaringan luar.

### Bila perlu akses dari LAN (mis. tes panel di HP)

Longgarkan **hanya** layanan yang benar-benar perlu (biasanya panel `40201` dan API `40200`), dengan menghapus prefix `127.0.0.1:`:

```yaml
# dev-CMSPANEL/compose.yaml
- "40201:40201"          # dari "127.0.0.1:40201:40201"
# dev-CMSCORE/compose.yaml
- "40200:3000"           # dari "127.0.0.1:40200:3000"
```

Lalu recreate service terkait (`podman compose up -d --force-recreate`). **Jangan** melonggarkan Postgres/Redis. Ingat juga menambah IP LAN mesin ke `CORS_ORIGINS` bila mengakses API dari device lain.

### Verifikasi binding

```bash
# Kolom PORTS harus menampilkan 127.0.0.1:4020x, BUKAN 0.0.0.0:4020x
podman ps --filter "name=dev-cms" --format "{{.Names}}\t{{.Ports}}"
```

---

## Catatan Arsitektur Singkat

- **Port internal vs host**: hanya sisi kiri mapping `HOST:CONTAINER` dan URL yang diakses browser (`VITE_API_BASE_URL`, `MINIO_PUBLIC_URL`, `CORS_ORIGINS`) yang memakai range 40200. Semua koneksi antar-container tetap via nama service + port default.
- **Mode ini development** (hot-reload, `Dockerfile.dev` / `Dockerfile`). Untuk produksi CMSPANEL tersedia `Dockerfile.prod` + `compose.prod.yaml` (di luar lingkup dokumen ini).
