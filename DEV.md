# Cara Menjalankan di Lokal (Development)

Panduan menjalankan **CMS Core** (backend/API) dan **CMS Panel** (admin) di komputer sendiri untuk development, pakai **Podman** di **Windows**. Mode ini **hot-reload**: edit kode di `src/` langsung ter-refresh tanpa build ulang.

> Untuk deploy ke server produksi (Docker), lihat **[DEPLOY.md](DEPLOY.md)** — itu setup berbeda.

---

## Ringkasan Alur

```
1. Pastikan Podman jalan
2. Siapkan file .env (dari contoh)
3. Build image (sekali) + nyalakan CMS Core
4. Nyalakan CMS Panel
5. Buka di browser
```

---

## Ringkasan Port

Semua port ditata di range **40200–40205**, dan **di-bind ke `127.0.0.1`** (hanya bisa diakses dari komputer ini, tidak dari jaringan luar).

| Layanan             | Buka di browser / tool           | Kredensial                          |
| ------------------- | -------------------------------- | ----------------------------------- |
| CMSCORE API         | http://localhost:40200/v1        | —                                   |
| API Docs (Swagger)  | http://localhost:40200/docs      | —                                   |
| CMSPANEL (admin)    | http://localhost:40201           | —                                   |
| Postgres            | `localhost:40202`                | `cms` / `cms_secret` / db `cmscore` |
| Redis               | `localhost:40203`                | (tanpa password)                    |
| MinIO API           | http://localhost:40204           | `cms_minio` / `cms_minio_secret`    |
| MinIO Console       | http://localhost:40205           | `cms_minio` / `cms_minio_secret`    |

**Login admin (hasil seed):** `admin@cmscore.local` / `ChangeMe123!`

---

## Yang Perlu Disiapkan

- **Podman** (diuji v5.8.2) + mesinnya berjalan.
- Kedua project ada di folder sejajar:
  ```
  d:/Projects/dev-CMSCORE/     ← backend
  d:/Projects/dev-CMSPANEL/    ← frontend
  ```

Cek Podman siap:

```bash
podman --version
podman machine list          # harus "Currently running"
podman compose version
```

Kalau mesin belum jalan: `podman machine start`.

---

## Langkah 1 — Siapkan File .env

Kedua project butuh `.env`. File ini tidak ada di GitHub, jadi salin dari contoh.

```bash
# Backend
cd d:/Projects/dev-CMSCORE
cp .env.example .env

# Frontend
cd d:/Projects/dev-CMSPANEL
cp .env.example .env
```

Untuk development, isi contoh sudah cukup — tidak perlu diubah. Nilai penting yang sudah benar:

- Backend `.env`: `CORS_ORIGINS` sudah memuat `localhost:40201` **dan** `127.0.0.1:40201` (dua-duanya, supaya browser tidak kena CORS error apa pun cara aksesnya).
- Frontend `.env`: `VITE_API_BASE_URL=http://localhost:40200/v1` (alamat API yang dipanggil dari browser).

---

## Langkah 2 — Build Image (sekali saja)

Di Windows, `podman compose` memakai versi Python yang punya keterbatasan (lihat [Catatan Penting](#catatan-penting)). Cara paling aman: **build image manual dulu**, baru nyalakan.

```bash
# Backend
cd d:/Projects/dev-CMSCORE
podman build -f Dockerfile.dev -t cms-core-dev .

# Frontend
cd d:/Projects/dev-CMSPANEL
podman build -f Dockerfile -t cms-panel-dev .
```

> Build pertama menjalankan install dependency (beberapa menit). Berikutnya cepat karena pakai cache.

---

## Langkah 3 — Nyalakan CMS Core (Backend)

```bash
cd d:/Projects/dev-CMSCORE
podman compose up -d
```

Yang terjadi saat start:

1. Nyala database, Redis, MinIO (tunggu sehat).
2. Buat folder penyimpanan file (`minio-init`, lalu berhenti — normal).
3. Aplikasi: migrasi database → **seed** (bikin akun admin) → build → jalan.

Boot pertama **~1–2 menit** (kompilasi). Pantau prosesnya:

```bash
podman logs -f dev-cmscore_app_1
# tunggu sampai muncul: "Nest application successfully started"
```

Tes API sudah hidup:

```bash
curl http://localhost:40200/docs      # keluar HTML = OK
```

---

## Langkah 4 — Nyalakan CMS Panel (Admin)

```bash
cd d:/Projects/dev-CMSPANEL
podman compose up -d
```

Cek jalan:

```bash
curl http://localhost:40201            # keluar HTML = OK
```

---

## Langkah 5 — Buka di Browser

Buka **http://localhost:40201**, login: `admin@cmscore.local` / `ChangeMe123!`

Selesai. Sekarang edit apa pun di `src/` kedua project → otomatis ter-refresh (hot-reload).

---

## Operasi Sehari-hari

```bash
# NYALAKAN (image sudah ada, tak perlu build lagi)
cd d:/Projects/dev-CMSCORE  && podman compose up -d
cd d:/Projects/dev-CMSPANEL && podman compose up -d

# MATIKAN (data tetap aman)
cd d:/Projects/dev-CMSCORE  && podman compose down
cd d:/Projects/dev-CMSPANEL && podman compose down

# LIHAT LOG
podman logs -f dev-cmscore_app_1
podman logs -f dev-cmspanel_web_1

# CEK STATUS
podman ps --filter "name=dev-cms" --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Kapan perlu build ulang image?** Hanya kalau `package.json` / `pnpm-lock.yaml` atau `Dockerfile` berubah:

```bash
cd d:/Projects/dev-CMSCORE
podman build -f Dockerfile.dev -t cms-core-dev .
podman compose up -d --force-recreate app
```

---

## Catatan Penting

Dua "jebakan" Podman di Windows yang sudah diatasi di setup ini. Pahami supaya tidak salah perbaiki.

### 1. `podman compose up --build` bisa gagal

`podman compose` versi Windows **mengabaikan** pengaturan `dockerfile` di compose. Kalau langsung pakai `--build`, ia cari `Dockerfile` default dan gagal:

```
Error: no Containerfile or Dockerfile ... found
```

**Solusi:** build manual dulu (`podman build -f ...`), lalu `podman compose up -d` **tanpa** `--build`. (Sudah jadi Langkah 2 & 3 di atas.)

### 2. Ubah `.env` tapi tidak berubah?

`podman restart` **tidak** membaca ulang `.env`. Setelah edit `.env`, container harus dibuat ulang:

```bash
# ❌ tidak cukup
podman restart dev-cmscore_app_1

# ✅ benar
cd d:/Projects/dev-CMSCORE
podman compose up -d --force-recreate app
```

---

## Kalau Bermasalah

| Gejala                                          | Solusi                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `no Dockerfile found` saat `up --build`         | Build manual dulu (Langkah 2), lalu `up -d` tanpa `--build`.                                |
| Browser: **"Tidak dapat terhubung ke server"**  | `.env` panel tidak terbaca Vite. Pastikan container panel dibuat ulang: `podman compose up -d web`. |
| Browser: **CORS error** saat login              | Origin belum ada di `CORS_ORIGINS` (`.env` backend). Tambahkan, lalu `up -d --force-recreate app`. |
| API `curl` gagal (connection refused) sesaat    | Backend masih boot/kompilasi (~1–2 menit). Tunggu; pantau `podman logs -f dev-cmscore_app_1`. |
| Ubah `.env` tidak berefek                       | Pakai `--force-recreate`, bukan `restart` (lihat Catatan Penting #2).                       |
| Port bentrok dengan aplikasi lain               | Hentikan aplikasi lain yang pakai port 40200–40205, atau ubah nomor port di `compose.yaml`. |

---

## Reset Data

Menghapus semua data lokal (database, file) dan mulai bersih:

```bash
cd d:/Projects/dev-CMSCORE
podman compose down -v        # ⚠️ -v menghapus data permanen (seed jalan lagi saat up berikutnya)
```

Tanpa `-v`, data aman saat `down`.
