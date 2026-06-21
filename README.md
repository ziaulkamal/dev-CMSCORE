# CMS Core — Headless Media Publishing API

REST API berversi (`/v1/`) untuk publikasi media — **headless**, tanpa frontend/admin bawaan.
Dibangun dengan **NestJS + Prisma + PostgreSQL + Redis + MinIO**, autentikasi **JWT + refresh rotation + API key**, otorisasi **RBAC** (role ↔ capability).

> Status: Backend tahap-1. Fungsional penuh: **Auth**, **Content** (CRUD + status + locking + EAV meta), **Media** (upload MinIO), **Scheduled-publish** (worker BullMQ), **Webhook delivery** (HMAC + retry), **Taxonomy/Term**, **Author**, **Comment+moderasi**, **User**, **Settings**, **Redirect**. Listing dasar: Role, Menu, Widget, Audit.

---

## Daftar Isi
- [Menjalankan (Podman / Windows)](#menjalankan-podman--windows)
- [Menjalankan di host (tanpa container)](#menjalankan-di-host-tanpa-container)
- [Konvensi API](#konvensi-api)
- [Autentikasi & Otorisasi](#autentikasi--otorisasi)
- [Daftar Route API](#daftar-route-api)
- [Contoh Penggunaan (alur lengkap)](#contoh-penggunaan-alur-lengkap)
- [RBAC: Role & Capability](#rbac-role--capability)

---

## Menjalankan (Podman / Windows)

Prasyarat: **Podman** (mesin sudah `podman machine start`).

```powershell
# 1. Siapkan environment
cp .env.example .env        # lalu ubah JWT_ACCESS_SECRET & JWT_REFRESH_SECRET

# 2. Build & jalankan seluruh stack (app + Postgres + Redis + MinIO)
podman compose up --build
```

Saat start, container app otomatis: menunggu DB → `prisma db push` → seed RBAC & super admin → `start:dev` (hot-reload).

| Service        | URL / Port                          |
|----------------|-------------------------------------|
| API            | http://localhost:3000/v1            |
| Swagger (docs) | http://localhost:3000/docs          |
| MinIO Console  | http://localhost:9001               |
| PostgreSQL     | localhost:5432 (`cms` / `cms_secret`) |
| Redis          | localhost:6379                      |

Akun super admin default hasil seed: **`admin@cmscore.local`** / **`ChangeMe123!`** (ganti via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

Hentikan: `podman compose down` — tambahkan `-v` untuk menghapus volume data.

---

## Menjalankan di host (tanpa container)

Jika hanya ingin service dependensi di container dan app di Windows:

```powershell
pnpm install
podman compose up postgres redis minio minio-init   # hanya deps
# pada .env, arahkan host ke localhost:
#   DATABASE_URL=postgresql://cms:cms_secret@localhost:5432/cmscore?schema=public
#   REDIS_HOST=localhost   MINIO_ENDPOINT=localhost
pnpm prisma db push
pnpm run db:seed
pnpm run start:dev
```

---

## Konvensi API

- **Base path berversi:** semua endpoint di bawah `/v1`.
- **Envelope sukses:** `{ "data": ..., "meta"?: ... }`.
- **Envelope error:** `{ "error": { "code", "message", "details"? } }`.
- **Pagination cursor-based** (listing feed): `?limit=20&cursor=<opaque>` → respons memuat `meta.next_cursor` (`null` jika habis).
- **Filter & sort** via query param: `?type=post&status=published&sort=-published_at`.
- **Auth header:** `Authorization: Bearer <jwt>` atau `X-API-Key: <key>`.

Kode error umum: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),
`INVALID_STATUS_TRANSITION` (409), `VALIDATION_ERROR` (422), `CONTENT_LOCKED` (423), `RATE_LIMITED` (429).

---

## Autentikasi & Otorisasi

- **Access token (JWT):** lifetime pendek (default 15 menit), dikirim sebagai `Bearer`.
- **Refresh token:** lifetime panjang, **rotation aktif** — setiap refresh menerbitkan token baru & mencabut yang lama. Token lama yang dipakai ulang → **seluruh rantai dicabut** (deteksi pencurian).
- **API key:** untuk integrasi/otomasi, dikirim via header `X-API-Key`, disimpan ter-hash, mendukung scope & pencabutan.
- **RBAC:** setiap endpoint tertulis menegakkan **capability** lewat guard (default-deny); kepemilikan konten (own vs others) dicek di service.

---

## Daftar Route API

Legenda akses: **Public** = tanpa token · **Auth** = butuh JWT/API key · **Cap:`x`** = butuh capability `x`.
Status: ✅ fungsional penuh · 🟡 listing dasar (stub, akan diperluas).

### Auth — `/v1/auth` ✅
| Method | Endpoint                  | Akses  | Keterangan |
|--------|---------------------------|--------|------------|
| POST   | `/v1/auth/login`          | Public | Login email+password → access + refresh token. (rate-limited) |
| POST   | `/v1/auth/refresh`        | Public | Tukar refresh token → token baru (rotasi). |
| POST   | `/v1/auth/logout`         | Public | Cabut refresh token yang diberikan. |
| GET    | `/v1/auth/me`             | Auth   | Profil principal saat ini (roles + capabilities). |
| POST   | `/v1/auth/api-keys`       | Auth   | Buat API key baru (raw key dikembalikan **sekali**). |
| DELETE | `/v1/auth/api-keys/:id`   | Auth   | Cabut API key milik sendiri. |

### Content — `/v1/contents` ✅
| Method | Endpoint                              | Akses          | Keterangan |
|--------|---------------------------------------|----------------|------------|
| GET    | `/v1/contents`                        | Public         | Listing feed (cursor). Anonim hanya melihat `published`. Filter `?type=&status=&sort=`. |
| GET    | `/v1/contents/:id`                    | Public         | Detail satu konten (non-`published` butuh auth). |
| POST   | `/v1/contents`                        | Cap:`edit_post`| Buat konten (post/page/video/gallery/live_report). |
| PUT    | `/v1/contents/:id`                    | Cap:`edit_post`| Update konten (cek kepemilikan; non-owner butuh `edit_others_post`). |
| DELETE | `/v1/contents/:id`                    | Cap:`delete_post` | Soft-delete (trash), bukan hard delete. |
| POST   | `/v1/contents/:id/transition`         | Auth           | Ubah status editorial; capability ditegakkan per transisi. |
| GET    | `/v1/contents/:id/meta`               | Public         | Ambil semua meta EAV (CPT + SEO). |
| PUT    | `/v1/contents/:id/meta`               | Cap:`edit_post`| Upsert key-value meta (whitelist per tipe). |
| POST   | `/v1/contents/:id/lock`               | Cap:`edit_post`| Acquire article lock (TTL 30 menit, Redis). |
| POST   | `/v1/contents/:id/lock/heartbeat`     | Cap:`edit_post`| Perpanjang lock selama mengedit. |
| DELETE | `/v1/contents/:id/lock`               | Cap:`edit_post`| Lepas lock. `?force=true` (override) butuh `override_lock`. |

**Tipe konten (CPT)** & meta_key khusus — divalidasi via registry, disimpan EAV di `content_meta`:

| `type`        | meta_key khusus |
|---------------|-----------------|
| `post`        | — |
| `page`        | `template` |
| `video`       | `video_url`, `video_provider`, `video_duration`, `video_thumbnail` |
| `gallery`     | `gallery_items`, `gallery_cover`, `gallery_layout` |
| `live_report` | `event_start_time`, `event_end_time`, `live_status`, `timeline_entries` |
| *(semua)*     | SEO: `seo_title`, `seo_description`, `og_image` |

**Status editorial** (`POST .../transition`, body `{ "to": "..." }`):

```
draft → pending_review → scheduled → published → archived
                       ↘ published          ↘ trashed (dari status mana pun) → draft (restore)
```
Menuju `scheduled` wajib menyertakan `published_at` di masa depan. Saat `scheduled`, **worker BullMQ** menjadwalkan promosi otomatis ke `published` tepat pada `published_at` (di-cancel/reschedule bila status atau waktu berubah).

### Media — `/v1/media` ✅
| Method | Endpoint           | Akses              | Keterangan |
|--------|--------------------|--------------------|------------|
| GET    | `/v1/media`        | Cap:`manage_media` | Listing media. |
| POST   | `/v1/media`        | Cap:`manage_media` | Upload **multipart** (field `file` + `alt_text`, `caption`) → MinIO; metadata di Postgres. Maks 50MB, tipe image/video/pdf. |
| DELETE | `/v1/media/:id`    | Cap:`manage_media` | Hapus file (storage) + record. |

### Taxonomy & Term — `/v1/taxonomies` ✅
| Method | Endpoint                          | Akses                 | Keterangan |
|--------|-----------------------------------|-----------------------|------------|
| GET    | `/v1/taxonomies`                  | Public                | Daftar taxonomy. |
| POST   | `/v1/taxonomies`                  | Cap:`manage_settings` | Buat taxonomy (`slug`, `label`, `hierarchical`). |
| GET    | `/v1/taxonomies/:slug/terms`      | Public                | Term di bawah taxonomy. |
| POST   | `/v1/taxonomies/:slug/terms`      | Cap:`manage_settings` | Buat term (`name`, `slug?`, `parent_id?`). |

### Author — `/v1/authors` ✅
| Method | Endpoint           | Akses              | Keterangan |
|--------|--------------------|--------------------|------------|
| GET    | `/v1/authors`      | Public             | Daftar author byline. |
| POST   | `/v1/authors`      | Cap:`manage_users` | Buat author. |
| PUT    | `/v1/authors/:id`  | Cap:`manage_users` | Update author. |

### Comment — moderasi & nested ✅
| Method | Endpoint                              | Akses                  | Keterangan |
|--------|---------------------------------------|------------------------|------------|
| GET    | `/v1/comments`                        | Cap:`manage_comments`  | Semua komentar (moderasi). |
| PUT    | `/v1/comments/:id/status`             | Cap:`manage_comments`  | Moderasi: `approved`/`spam`/`trash`/`pending`. |
| GET    | `/v1/contents/:id/comments`           | Public                 | Komentar `approved` untuk satu konten. |
| POST   | `/v1/contents/:id/comments`           | Public (rate-limited)  | Kirim komentar (default `pending`, body disanitasi). |

### User — `/v1/users` ✅
| Method | Endpoint        | Akses              | Keterangan |
|--------|-----------------|--------------------|------------|
| GET    | `/v1/users`     | Cap:`manage_users` | Daftar user (tanpa password_hash). |
| POST   | `/v1/users`     | Cap:`manage_users` | Buat user + assign role (password di-hash argon2). |

### Settings & Redirect ✅
| Method | Endpoint          | Akses                 | Keterangan |
|--------|-------------------|-----------------------|------------|
| GET    | `/v1/settings`    | Cap:`manage_settings` | Map key-value global. |
| PUT    | `/v1/settings`    | Cap:`manage_settings` | Upsert batch (`{ "settings": { ... } }`). |
| GET    | `/v1/redirects`   | Public                | Daftar redirect (lookup proxy/edge). |
| POST   | `/v1/redirects`   | Cap:`manage_settings` | Buat redirect (`from_path`, `to_path`, `status_code` 301/302). |

### Webhook — `/v1/webhooks` ✅
| Method | Endpoint          | Akses                 | Keterangan |
|--------|-------------------|-----------------------|------------|
| GET    | `/v1/webhooks`    | Cap:`manage_settings` | Daftar webhook terdaftar. |
| POST   | `/v1/webhooks`    | Cap:`manage_settings` | Daftarkan (`event`, `target_url`, `secret?`). Secret di-generate bila kosong. |
| DELETE | `/v1/webhooks/:id`| Cap:`manage_settings` | Hapus webhook. |

Event yang dipancarkan: `content.published`, `content.trashed`, `comment.created`, `comment.status_changed`, `media.uploaded`. **Delivery** async via BullMQ — payload ditandatangani HMAC-SHA256 (header `X-Signature`), retry exponential backoff (5x), tiap percobaan dicatat di `webhook_delivery`.

### Modul lain (listing dasar — 🟡)
| Method | Endpoint        | Akses  | Modul |
|--------|-----------------|--------|-------|
| GET    | `/v1/roles`     | Public | Role |
| GET    | `/v1/menus`     | Public | Menu |
| GET    | `/v1/widgets`   | Public | Widget |
| GET    | `/v1/audit`     | Cap:`manage_users` | Audit log |
| GET    | `/v1/audit`         | Cap:`manage_users`| Audit log |

---

## Contoh Penggunaan (alur lengkap)

> Ganti `$TOKEN` dengan `access_token` hasil login.

### 1. Login
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@cmscore.local", "password": "ChangeMe123!" }'
```
Respons:
```json
{ "data": { "access_token": "eyJ...", "expires_in": 900, "refresh_token": "rt_...", "token_type": "Bearer" } }
```

### 2. Cek identitas & capability
```bash
curl http://localhost:3000/v1/auth/me -H "Authorization: Bearer $TOKEN"
```

### 3. Buat konten (CPT video)
```bash
curl -X POST http://localhost:3000/v1/contents \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
        "type": "video",
        "title": "Liputan Banjir Jakarta",
        "body": "<p>Isi liputan...</p>",
        "meta": { "video_url": "https://cdn/v.mp4", "video_provider": "youtube", "video_duration": "320", "seo_title": "Banjir Jakarta" }
      }'
```
Konten dibuat dengan `status: draft`, `slug` unik per tipe dihasilkan otomatis.

### 4. Kelola lock saat mengedit
```bash
curl -X POST http://localhost:3000/v1/contents/$ID/lock -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/v1/contents/$ID/lock/heartbeat -H "Authorization: Bearer $TOKEN"
curl -X DELETE http://localhost:3000/v1/contents/$ID/lock -H "Authorization: Bearer $TOKEN"
# Override (Editor/Admin): DELETE .../lock?force=true
```

### 5. Alur editorial → publish
```bash
# Author mengajukan review
curl -X POST http://localhost:3000/v1/contents/$ID/transition \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "to": "pending_review" }'

# Editor menerbitkan (butuh publish_post)
curl -X POST http://localhost:3000/v1/contents/$ID/transition \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "to": "published" }'

# Atau menjadwalkan (wajib published_at di masa depan)
curl -X POST http://localhost:3000/v1/contents/$ID/transition \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "to": "scheduled", "published_at": "2026-12-31T08:00:00Z" }'
```
Transisi ilegal → `409 INVALID_STATUS_TRANSITION`.

### 6. Listing feed publik (cursor pagination)
```bash
curl "http://localhost:3000/v1/contents?type=post&status=published&limit=20&sort=-published_at"
# Halaman berikutnya:
curl "http://localhost:3000/v1/contents?limit=20&cursor=<meta.next_cursor>"
```

### 7. Refresh token (rotasi)
```bash
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refresh_token": "rt_..." }'
```

### 8. API key untuk integrasi
```bash
# Buat (raw key hanya muncul sekali — simpan!)
curl -X POST http://localhost:3000/v1/auth/api-keys \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "label": "integrasi-feed", "scopes": ["read"] }'

# Pakai pada request lain
curl http://localhost:3000/v1/contents -H "X-API-Key: ak_..."
```

### 9. Upload media (multipart → MinIO)
```bash
curl -X POST http://localhost:3000/v1/media \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./foto.jpg" \
  -F "alt_text=Foto banjir" \
  -F "caption=Genangan di Kampung Melayu"
```
Respons memuat `file_url` (URL publik MinIO/CDN). Memicu event `media.uploaded`.

### 10. Daftarkan webhook & terima event
```bash
curl -X POST http://localhost:3000/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "event": "content.published", "target_url": "https://example.com/hook" }'
```
Saat konten dipublikasikan, target menerima `POST` ber-body
`{ "event", "payload", "delivered_at" }` dengan header `X-Signature` (HMAC-SHA256 dari secret).
Verifikasi di sisi penerima:
```js
const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
// bandingkan dengan header 'x-signature'
```

---

## RBAC: Role & Capability

Roles bawaan hasil seed: `super_admin`, `admin`, `editor`, `author`, `contributor`, `viewer`.

| Capability         | super_admin | admin | editor | author | contributor | viewer |
|--------------------|:--:|:--:|:--:|:--:|:--:|:--:|
| `edit_post`        | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| `edit_others_post` | ✔ | ✔ | ✔ | — | — | — |
| `publish_post`     | ✔ | ✔ | ✔ | — | — | — |
| `delete_post`      | ✔ | ✔ | ✔ | — | — | — |
| `override_lock`    | ✔ | ✔ | ✔ | — | — | — |
| `manage_comments`  | ✔ | ✔ | ✔ | — | — | — |
| `manage_media`     | ✔ | ✔ | ✔ | ✔ | — | — |
| `manage_users`     | ✔ | ✔ | — | — | — | — |
| `manage_roles`     | ✔ | ✔ | — | — | — | — |
| `manage_settings`  | ✔ | ✔ | — | — | — | — |
| `read`             | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

---

## Skrip pengembangan

| Perintah                  | Fungsi |
|---------------------------|--------|
| `pnpm run start:dev`      | Jalankan dengan hot-reload |
| `pnpm run build`          | Build produksi (`dist/`) |
| `pnpm run lint`           | ESLint + autofix |
| `pnpm prisma db push`     | Sinkronkan schema ke DB (tanpa migrasi) |
| `pnpm prisma migrate dev` | Buat migrasi versioned |
| `pnpm run db:seed`        | Seed RBAC, taxonomy dasar, super admin |
| `pnpm prisma studio`      | GUI eksplor data |
