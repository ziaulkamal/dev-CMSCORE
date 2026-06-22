# CMS Core — Panduan Integrasi API untuk Front End

Dokumen acuan tim front end. Backend adalah **headless REST API** (`/v1`). Front end dibangun
sebagai **dua aplikasi terpisah**:

- **PUBLIC** — web pembaca (homepage, listing kategori, detail artikel, kirim komentar). Mayoritas
  request tanpa login; hanya membaca konten `published`.
- **ADMIN** — dashboard redaksi (CRUD konten, alur editorial, media, moderasi, user, settings).
  Semua request butuh login + capability sesuai role.

> Beberapa route (mis. `GET /contents`) dipakai **kedua** aplikasi dengan perilaku berbeda
> tergantung ada/tidaknya token. Ini ditandai jelas di tiap bagian.

**Base URL (dev):** `http://localhost:3000/v1`
**Swagger interaktif:** `http://localhost:3000/docs`

---

## Daftar Isi
- [Catatan Integrasi Teknis (wajib dibaca)](#catatan-integrasi-teknis-wajib-dibaca)
- [BAGIAN PUBLIC](#bagian-public)
- [BAGIAN ADMIN](#bagian-admin)
- [Lampiran A — Matriks Role → Capability](#lampiran-a--matriks-role--capability)
- [Lampiran B — State Machine Status Editorial](#lampiran-b--state-machine-status-editorial)

---

## Catatan Integrasi Teknis (wajib dibaca)

### Header autentikasi
- **JWT (user)**: `Authorization: Bearer <access_token>` — dipakai FE Admin & komentar terdaftar.
- **API key (mesin/integrasi)**: `X-API-Key: <key>` — umumnya bukan untuk browser FE.
- Endpoint **publik** tidak butuh header apa pun.

### Envelope response (selalu konsisten)
**Sukses:**
```json
{ "data": { ... }, "meta": { ... } }   // meta opsional, mis. untuk pagination
```
**Error:**
```json
{ "error": { "code": "STRING_CODE", "message": "Pesan", "details": { } } }
```

Selalu baca `data` untuk payload, dan `error.code` untuk menentukan UX (bukan hanya status HTTP).

### Tabel kode error
| HTTP | `code` | Arti & saran UX |
|---|---|---|
| 401 | `UNAUTHORIZED` | Token hilang/expired → jalankan refresh, atau arahkan ke login. |
| 403 | `FORBIDDEN` | Capability kurang → sembunyikan/disable aksi, tampilkan pesan. |
| 404 | `NOT_FOUND` | Resource tak ada / tak boleh diakses. |
| 409 | `INVALID_STATUS_TRANSITION` | Transisi status ilegal → lihat state machine (Lampiran B). |
| 422 | `VALIDATION_ERROR` | Input tidak valid → tampilkan `details` di form. |
| 423 | `CONTENT_LOCKED` | Konten sedang diedit user lain → tampilkan pemegang lock. |
| 429 | `RATE_LIMITED` | Terlalu sering → beri jeda, tampilkan notifikasi. |

### Pagination (cursor-based)
Listing feed memakai cursor, **bukan** page number:
```
GET /v1/contents?limit=20                     → meta.next_cursor = "eyJ..."
GET /v1/contents?limit=20&cursor=eyJ...        → halaman berikutnya
```
`meta.next_cursor = null` berarti tidak ada halaman lagi. Filter & sort:
`?type=post&status=published&sort=-published_at` (awalan `-` = descending).

### Alur token (FE Admin)
1. `POST /auth/login` → simpan `access_token` (umur ±15 menit) & `refresh_token` (umur panjang).
2. Pasang `Authorization: Bearer` di semua request admin.
3. Saat dapat **401**, panggil `POST /auth/refresh` dengan `refresh_token` → dapat
   **access + refresh baru** (rotation), simpan ulang, lalu retry request.
4. **Penting:** refresh token bersifat sekali pakai. Jika token lama dipakai ulang, backend
   mencabut seluruh rantai → user harus login ulang. Jangan simpan/replay refresh lama.
5. `POST /auth/logout` mencabut refresh token saat user keluar.

### Rate limit
- `POST /auth/login` — 5 request/menit per klien.
- `POST /auth/refresh` — 10 request/menit.
- `POST /contents/:id/comments` — 5 request/menit (anti-spam). Tangani 429 dengan ramah.

### Webhook (informasi, umumnya bukan untuk FE)
Backend mengirim event (`content.published`, dll) ke URL terdaftar dengan header
`X-Signature` (HMAC-SHA256 dari secret). Ini untuk layanan penerima, bukan browser. FE Admin
hanya **mengelola** daftar webhook (lihat bagian Admin), tidak menerima delivery.

---

## BAGIAN PUBLIC

Route untuk aplikasi web pembaca. Kecuali disebut, **tanpa autentikasi**.

### Auth (opsional — hanya bila ingin komentar sebagai user terdaftar)

#### `POST /v1/auth/login`
Login pembaca terdaftar (opsional). Public.
```json
// request
{ "email": "user@mail.com", "password": "secret123" }
// response 201
{ "data": { "access_token": "eyJ…", "expires_in": 900, "refresh_token": "rt_…", "token_type": "Bearer" } }
```
**UI:** form login opsional; mayoritas pembaca anonim.

#### `GET /v1/auth/me` — Auth
Profil user login (id, email, roles, capabilities). **UI:** tampilkan nama/avatar saat sudah login.

---

### Konten (inti web publik)

#### `GET /v1/contents` — Public
Feed konten. **Anonim hanya menerima konten `published`.** Filter & cursor pagination.
```
GET /v1/contents?type=post&limit=20&sort=-published_at
GET /v1/contents?type=post&cursor=eyJ...           # halaman berikutnya
```
```json
// response
{
  "data": [
    { "id": "ct_99", "type": "post", "title": "…", "slug": "judul-artikel",
      "excerpt": "…", "published_at": "2026-06-21T08:00:00Z" }
  ],
  "meta": { "next_cursor": "eyJ…", "limit": 20 }
}
```
**UI:** homepage, listing kategori, infinite scroll / tombol "muat lebih banyak" pakai `next_cursor`.

#### `GET /v1/contents/:id` — Public
Detail satu konten. **Anonim hanya bisa membuka konten `published`** (selain itu balas 404).
```json
{ "data": { "id": "ct_99", "type": "post", "title": "…", "slug": "…", "body": "<p>…</p>",
  "status": "published", "published_at": "…", "authors": [...], "terms": [...], "metas": [...] } }
```
**UI:** halaman detail artikel. (Catatan: bisa juga ambil per-slug dengan filter listing.)

#### `GET /v1/contents/:id/meta` — Public
Meta EAV konten (field CPT + SEO) sebagai map key-value.
```json
{ "data": { "seo_title": "…", "seo_description": "…", "og_image": "…",
  "video_url": "https://…", "video_duration": "320" } }
```
**UI:** isi tag `<meta>` SEO/OpenGraph; render field khusus CPT (video player, galeri, dll).

---

### Komentar

#### `GET /v1/contents/:id/comments` — Public
Komentar berstatus `approved` untuk satu konten.
```json
{ "data": [ { "id": "cm_1", "body": "…", "guest_name": "Budi", "created_at": "…", "parent_id": null } ] }
```
**UI:** daftar komentar di bawah artikel; bangun thread dari `parent_id`.

#### `POST /v1/contents/:id/comments` — Public (rate-limited 5/menit)
Kirim komentar. Tamu mengisi `guest_name`/`guest_email`; user login otomatis terkait akunnya.
Status awal **`pending`** (perlu moderasi sebelum tampil).
```json
// request (tamu)
{ "body": "Artikel bagus!", "guest_name": "Budi", "guest_email": "budi@mail.com", "parent_id": null }
// response 201
{ "data": { "id": "cm_9", "status": "pending", "created_at": "…" } }
```
**UI:** form komentar; setelah kirim tampilkan "menunggu moderasi". Body disanitasi server (aman).

---

### Navigasi & metadata situs

#### `GET /v1/taxonomies` — Public
Daftar taxonomy (mis. `category`, `tag`). **UI:** menu kategori utama.
```json
{ "data": [ { "id": "tx_1", "slug": "category", "label": "Category", "hierarchical": true } ] }
```

#### `GET /v1/taxonomies/:slug/terms` — Public
Term di bawah satu taxonomy (mis. semua kategori). **UI:** sidebar kategori, filter listing.
```json
{ "data": [ { "id": "tm_1", "name": "Politik", "slug": "politik", "parent_id": null } ] }
```
Lalu filter feed: `GET /v1/contents?type=post` (filter per term di sisi FE/listing sesuai kebutuhan).

#### `GET /v1/authors` — Public
Daftar author byline. **UI:** halaman/blok profil penulis.
```json
{ "data": [ { "id": "au_1", "display_name": "Andi Wijaya", "bio": "…", "social_links": {…} } ] }
```

#### `GET /v1/menus` — Public · `GET /v1/widgets` — Public
Struktur menu navigasi & widget area. **UI:** header/footer menu, sidebar widget.
*(Saat ini listing-only; struktur item bisa berkembang.)*

#### `GET /v1/redirects` — Public
Daftar redirect `from_path → to_path` (301/302). **UI/Edge:** dipakai middleware FE atau proxy
untuk mengarahkan URL lama ke baru (SEO). **Bukan** untuk ditampilkan ke pembaca.

---

## BAGIAN ADMIN

Dashboard redaksi. **Semua route butuh `Authorization: Bearer`.** Kolom **Capability**
menentukan apakah tombol/menu ditampilkan untuk role tertentu (lihat Lampiran A).

### Auth & sesi

| Method & Path | Capability | Keterangan |
|---|---|---|
| `POST /v1/auth/login` | publik | Login admin → access + refresh token. |
| `POST /v1/auth/refresh` | publik | Rotasi token (panggil saat 401). |
| `POST /v1/auth/logout` | publik | Cabut refresh saat logout. |
| `GET /v1/auth/me` | login | Identitas + `roles` + `capabilities` → atur menu & guard UI. |
| `POST /v1/auth/api-keys` | login | Buat API key (raw key muncul **sekali**). |
| `DELETE /v1/auth/api-keys/:id` | login | Cabut API key. |

> **Pola guard UI:** setelah login, simpan `capabilities` dari `/auth/me`. Tampilkan aksi
> hanya jika capability-nya ada (mis. tombol "Publish" hanya untuk yang punya `publish_post`).

---

### Konten — CRUD & alur editorial

#### `GET /v1/contents?status=…` — login
Listing dashboard. **Dengan token**, bisa memfilter status apa pun (`draft`, `pending_review`,
`scheduled`, `published`, `archived`, `trashed`). Tanpa `?status=` admin tetap melihat sesuai akses.
```
GET /v1/contents?status=pending_review&limit=20&sort=-created_at
```
**UI:** tabel konten dengan filter status, kolom author, tanggal.

#### `POST /v1/contents` — `edit_post`
Buat konten. Status awal `draft`, slug unik per `type` dibuat otomatis.
```json
// request
{
  "type": "video",
  "title": "Liputan Banjir Jakarta",
  "body": "<p>…</p>",
  "primary_author_id": "au_1",
  "co_author_ids": ["au_7"],
  "terms": ["tm_politik", "tm_jakarta"],
  "meta": { "video_url": "https://…/v.mp4", "video_provider": "youtube", "video_duration": "320", "seo_title": "…" }
}
// response 201
{ "data": { "id": "ct_99", "type": "video", "slug": "liputan-banjir-jakarta", "status": "draft", … } }
```
**UI:** form editor; pilih tipe → tampilkan field meta khusus (lihat tabel CPT di README).

#### `PUT /v1/contents/:id` — `edit_post`
Update konten. Non-pemilik butuh `edit_others_post`. Field opsional (partial update).
**UI:** simpan draft. Field `type` tidak bisa diubah setelah dibuat.

#### `DELETE /v1/contents/:id` — `delete_post`
Soft-delete (pindah ke `trashed`), bukan hapus permanen. **UI:** tombol "Pindah ke sampah".

#### `POST /v1/contents/:id/transition` — login (+ capability per transisi)
Ubah status editorial via state machine (Lampiran B). Capability ditegakkan per transisi.
```json
// ajukan review (butuh edit_post)
{ "to": "pending_review" }
// publish (butuh publish_post)
{ "to": "published" }
// jadwalkan (butuh publish_post; published_at WAJIB di masa depan)
{ "to": "scheduled", "published_at": "2026-12-31T08:00:00Z" }
```
Error `409 INVALID_STATUS_TRANSITION` bila transisi ilegal (`details.from`, `details.to`).
**UI:** tombol aksi editorial; tampilkan hanya transisi legal dari status saat ini.

#### `GET /v1/contents/:id/meta` — Public · `PUT /v1/contents/:id/meta` — `edit_post`
Baca/upsert meta EAV (CPT & SEO). Key di-whitelist sesuai tipe.
```json
// PUT request
{ "meta": { "seo_title": "Judul SEO", "video_duration": "320" } }
```
**UI:** panel "SEO & Field Tambahan" di editor.

---

### Article Locking (cegah edit bentrok)

| Method & Path | Capability | Keterangan |
|---|---|---|
| `POST /v1/contents/:id/lock` | `edit_post` | Kunci konten saat membuka editor. |
| `POST /v1/contents/:id/lock/heartbeat` | `edit_post` | Perpanjang lock selama mengedit. |
| `DELETE /v1/contents/:id/lock` | `edit_post` | Lepas lock saat keluar editor. |
| `DELETE /v1/contents/:id/lock?force=true` | `override_lock` | Override paksa (Editor/Admin). |

**Alur UI editor:**
1. Saat buka editor → `POST …/lock`. Jika **423 `CONTENT_LOCKED`**, tampilkan siapa pemegang
   lock (`error.details.locked_by`) dan buat editor read-only.
2. Selama mengedit → `POST …/lock/heartbeat` tiap **1–2 menit** agar lock tidak kedaluwarsa
   (TTL 30 menit).
3. Saat keluar/selesai → `DELETE …/lock`.
4. Editor/Admin yang punya `override_lock` boleh `?force=true` untuk merebut lock.

---

### Media

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/media` | `manage_media` | Listing media. |
| `POST /v1/media` | `manage_media` | Upload **multipart** (`file` + `alt_text`, `caption`). |
| `DELETE /v1/media/:id` | `manage_media` | Hapus file + metadata. |

```
POST /v1/media   (multipart/form-data)
  file:     <binary>          (wajib; image/video/pdf, maks 50MB)
  alt_text: "Foto banjir"
  caption:  "Genangan di Kampung Melayu"
```
```json
// response
{ "data": { "id": "md_12", "file_url": "http://…/cms-media/2026/uuid.jpg",
  "mime_type": "image/jpeg", "file_size": 234112, "alt_text": "…" } }
```
**UI:** media library + uploader; pakai `file_url` untuk preview & sisipkan ke konten/featured image.

---

### Taxonomy & Term (kelola)

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/taxonomies` | publik | Daftar taxonomy. |
| `POST /v1/taxonomies` | `manage_settings` | Buat taxonomy (`slug`, `label`, `hierarchical`). |
| `GET /v1/taxonomies/:slug/terms` | publik | Daftar term. |
| `POST /v1/taxonomies/:slug/terms` | `manage_settings` | Buat term (`name`, `slug?`, `parent_id?`). |

**UI:** halaman kelola kategori/tag; form tambah term (dropdown parent untuk hierarki).

---

### Author (kelola byline)

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/authors` | publik | Daftar author. |
| `POST /v1/authors` | `manage_users` | Buat author byline. |
| `PUT /v1/authors/:id` | `manage_users` | Update author. |

```json
// POST/PUT request
{ "display_name": "Andi Wijaya", "bio": "Jurnalis politik",
  "avatar_media_id": "md_3", "social_links": { "twitter": "https://x.com/andi" } }
```
**UI:** halaman penulis; author terpisah dari akun login (bisa ditautkan via `linked_user_id`).

---

### Comment — moderasi

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/comments` | `manage_comments` | Semua komentar untuk moderasi. |
| `PUT /v1/comments/:id/status` | `manage_comments` | Ubah status moderasi. |

```json
// PUT request
{ "status": "approved" }   // opsi: approved | spam | trash | pending
```
**UI:** tabel moderasi dengan filter status; aksi Approve / Spam / Trash per baris.

---

### User & RBAC

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/users` | `manage_users` | Daftar user (tanpa password_hash). |
| `POST /v1/users` | `manage_users` | Buat user + assign role. |
| `GET /v1/roles` | publik | Daftar role (referensi assign). |

```json
// POST /users
{ "email": "editor@cmscore.local", "password": "StrongPass123!", "roles": ["editor"] }
```
**UI:** halaman manajemen user; dropdown role dari `GET /roles`.

---

### Settings

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/settings` | `manage_settings` | Baca semua setting (map key-value). |
| `PUT /v1/settings` | `manage_settings` | Upsert batch. |

```json
// GET response
{ "data": { "site_title": "CMS Core", "posts_per_page": 10 } }
// PUT request
{ "settings": { "site_title": "Berita Hari Ini", "posts_per_page": 12 } }
```
**UI:** halaman pengaturan situs (form key-value).

---

### Redirect (kelola)

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/redirects` | publik | Daftar redirect. |
| `POST /v1/redirects` | `manage_settings` | Buat redirect. |

```json
// POST request
{ "from_path": "/berita-lama", "to_path": "/berita/baru", "status_code": 301 }
```
**UI:** halaman kelola redirect (SEO/migrasi URL).

---

### Webhook

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/webhooks` | `manage_settings` | Daftar webhook terdaftar. |
| `POST /v1/webhooks` | `manage_settings` | Daftarkan webhook. |
| `DELETE /v1/webhooks/:id` | `manage_settings` | Hapus webhook. |

```json
// POST request
{ "event": "content.published", "target_url": "https://example.com/hook" }
```
Event tersedia: `content.published`, `content.trashed`, `comment.created`,
`comment.status_changed`, `media.uploaded`. **UI:** halaman integrasi/webhook.

---

### Audit log

| Method & Path | Capability | Keterangan |
|---|---|---|
| `GET /v1/audit` | `manage_users` | Daftar audit log (read-only). |

**UI:** halaman audit untuk Admin/Super Admin.

---

## Lampiran A — Matriks Role → Capability

Setelah login, ambil `capabilities` dari `GET /v1/auth/me` dan gunakan untuk menampilkan/menyembunyikan
menu & tombol. Role bawaan: `super_admin`, `admin`, `editor`, `author`, `contributor`, `viewer`.

| Capability | super_admin | admin | editor | author | contributor | viewer |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `edit_post` (milik sendiri) | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| `edit_others_post` | ✔ | ✔ | ✔ | — | — | — |
| `publish_post` | ✔ | ✔ | ✔ | — | — | — |
| `delete_post` | ✔ | ✔ | ✔ | — | — | — |
| `override_lock` | ✔ | ✔ | ✔ | — | — | — |
| `manage_comments` | ✔ | ✔ | ✔ | — | — | — |
| `manage_media` | ✔ | ✔ | ✔ | ✔ | — | — |
| `manage_users` | ✔ | ✔ | — | — | — | — |
| `manage_roles` | ✔ | ✔ | — | — | — | — |
| `manage_settings` | ✔ | ✔ | — | — | — | — |
| `read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

**Implikasi UI Admin:**
- **Contributor/Author** hanya melihat konten miliknya, tanpa tombol Publish (status mentok di `pending_review`).
- **Editor** dapat review/publish/hapus semua konten + override lock + moderasi komentar.
- **Admin/Super Admin** akses penuh (user, role, settings).

---

## Lampiran B — State Machine Status Editorial

Transisi `POST /v1/contents/:id/transition` (body `{ "to": "<status>" }`). Tombol di UI editor
sebaiknya hanya menampilkan transisi yang legal dari status saat ini.

```
draft ──────────► pending_review ──────► scheduled ──────► published ──────► archived
  │                    │  │  │                                 │  ▲              │
  │ (ditolak editor) ◄─┘  │  └────────────► published          │  └──────────────┘
  │                       └──────────────► trashed             │
  └──────────────────────────────────────► trashed ◄──────────┘ (dari status mana pun)
                                              │
                                              └──► draft (restore)
```

**Transisi legal & capability yang dibutuhkan:**

| Dari | Ke | Capability |
|---|---|---|
| `draft` | `pending_review` | `edit_post` |
| `draft` | `trashed` | `delete_post` |
| `pending_review` | `draft` (tolak) | `publish_post` |
| `pending_review` | `scheduled` | `publish_post` |
| `pending_review` | `published` | `publish_post` |
| `pending_review` | `trashed` | `delete_post` |
| `scheduled` | `published` | `publish_post` |
| `scheduled` | `trashed` | `delete_post` |
| `published` | `archived` | `publish_post` |
| `published` | `trashed` | `delete_post` |
| `archived` | `published` | `publish_post` |
| `archived` | `trashed` | `delete_post` |
| `trashed` | `draft` (restore) | `delete_post` |

**Catatan:**
- Menuju `scheduled` **wajib** sertakan `published_at` (ISO 8601, di masa depan). Backend
  otomatis mempublikasikan saat waktunya tiba (job scheduler).
- Transisi di luar tabel → `409 INVALID_STATUS_TRANSITION`.

---

## Status modul backend (per dokumen ini)

| Modul | Status |
|---|---|
| Auth, Content (CRUD/status/lock/meta), Media, Comment, Taxonomy, Author, User, Settings, Redirect, Webhook | ✅ Fungsional penuh |
| Roles, Menus, Widgets, Audit | 🟡 Listing-only (endpoint tulis belum tersedia) |

FE sebaiknya **tidak** mengandalkan endpoint tulis untuk modul 🟡 sampai backend menyediakannya.
