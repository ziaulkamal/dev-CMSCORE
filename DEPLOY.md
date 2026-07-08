# Cara Deploy ke Server (Docker)

Panduan menjalankan **CMS Core** (backend/API) dan **CMS Panel** (tampilan admin) di server pakai **Docker**. Ditulis untuk diikuti langkah demi langkah, tanpa asumsi Anda sudah paham Docker.

Yang akan berjalan di server:

- **CMS Core** — API + database (Postgres) + Redis + penyimpanan file (MinIO) + Nginx.
- **CMS Panel** — tampilan web admin (file statis disajikan Nginx).

Akses lewat **IP publik server**, contoh: `http://123.45.67.89`.

---

## Ringkasan Alur (baca ini dulu)

```
1. Install Docker di server
2. Ambil kode dari GitHub (git clone)
3. Isi file rahasia (.env.prod) — password database, dll
4. Nyalakan CMS Core   → docker compose up
5. Nyalakan CMS Panel  → docker compose up
6. Cek semua jalan
```

Perkiraan waktu: 15–30 menit (paling lama menunggu build pertama).

---

## Yang Perlu Disiapkan

- Server (VPS/cloud) dengan **Ubuntu** (atau Linux lain) dan akses SSH.
- **IP publik** server. Catat, misalnya `123.45.67.89`. Di panduan ini ditulis `IP-SERVER` — ganti dengan IP asli Anda.
- Port **80** (web) terbuka di firewall server.

---

## Langkah 1 — Install Docker di Server

Masuk ke server via SSH, lalu jalankan (Ubuntu):

```bash
# Install Docker (cara resmi, sekali jalan)
curl -fsSL https://get.docker.com | sh

# Pastikan Docker jalan
sudo docker --version
sudo docker compose version
```

> Kalau muncul `docker: permission denied`, jalankan perintah `docker` pakai `sudo`, atau tambahkan user Anda ke grup docker: `sudo usermod -aG docker $USER` lalu logout–login lagi.

---

## Langkah 2 — Ambil Kode dari GitHub

```bash
# Buat folder kerja lalu clone kedua project
mkdir -p ~/apps && cd ~/apps

git clone https://github.com/ziaulkamal/dev-CMSCORE.git
git clone https://github.com/ziaulkamal/dev-CMSPANEL.git
```

---

## Langkah 3 — Isi File Rahasia (Backend)

File `.env.prod` berisi password & kunci rahasia. **Tidak ada di GitHub** (sengaja, demi keamanan), jadi Anda buat sendiri dari contoh.

```bash
cd ~/apps/dev-CMSCORE

# Salin contoh jadi file asli
cp .env.prod.example .env.prod

# Edit isinya
nano .env.prod
```

Di dalam `.env.prod`, **ganti semua yang bertanda `<...>`**:

- `<IP-SERVER>` → IP publik server Anda (mis. `123.45.67.89`).
- Semua `<GANTI-...>` → isi dengan nilai rahasia yang kuat.

**Cara bikin nilai rahasia acak** (jalankan di server, salin hasilnya):

```bash
openssl rand -base64 32
```

Jalankan beberapa kali untuk mengisi: password database, password Redis, dua JWT secret, dan secret MinIO.

> ⚠️ Pastikan `POSTGRES_PASSWORD` dan password yang ada di dalam `DATABASE_URL` **sama persis**.

Simpan file: di `nano` tekan `Ctrl+O` lalu `Enter`, keluar dengan `Ctrl+X`.

---

## Langkah 4 — Nyalakan CMS Core (Backend)

```bash
cd ~/apps/dev-CMSCORE

docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
```

Apa yang terjadi:

- Docker membangun image aplikasi (build pertama beberapa menit).
- Menyalakan: database, Redis, penyimpanan file, aplikasi, dan Nginx.
- Aplikasi otomatis menjalankan migrasi database saat start.

Cek statusnya:

```bash
docker compose -f compose.prod.yaml ps
```

Semua harus `running` (kecuali `minio-init` yang memang `exited` setelah membuat folder penyimpanan — itu normal).

Tes cepat API sudah hidup:

```bash
curl http://localhost/docs   # harus keluar HTML (halaman dokumentasi API)
```

---

## Langkah 5 — Nyalakan CMS Panel (Tampilan Admin)

Panel perlu tahu alamat API. Alamat ini **ditanam saat build**, jadi set dulu:

```bash
cd ~/apps/dev-CMSPANEL

# Buat file env & isi alamat API (pakai IP server, diakhiri /v1)
cp .env.prod.example .env.prod
nano .env.prod
# ubah menjadi:  VITE_API_BASE_URL=http://IP-SERVER/v1
```

Lalu build & nyalakan:

```bash
docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
```

Panel akan tersedia di port **8080**.

> ⚠️ Kalau nanti IP/alamat API berubah, panel **harus di-build ulang** (ulangi perintah di atas), karena alamat API sudah ditanam saat build.

---

## Langkah 6 — Cek Semuanya Jalan

Buka di browser:

| Yang dibuka          | Alamat                          |
| -------------------- | ------------------------------- |
| Panel admin          | `http://IP-SERVER:8080`         |
| API (dokumentasi)    | `http://IP-SERVER/docs`         |
| API (endpoint dasar) | `http://IP-SERVER/v1`           |

**Login admin pertama:** `admin@cmscore.local` / `ChangeMe123!`
→ **Segera ganti password ini setelah login pertama.**

---

## Operasi Sehari-hari

Semua perintah dijalankan di dalam folder project (`~/apps/dev-CMSCORE` atau `~/apps/dev-CMSPANEL`).

```bash
# Lihat log (Ctrl+C untuk berhenti melihat)
docker compose -f compose.prod.yaml logs -f

# Matikan (data tetap aman)
docker compose -f compose.prod.yaml down

# Nyalakan lagi
docker compose -f compose.prod.yaml --env-file .env.prod up -d

# Restart satu layanan saja (mis. aplikasi backend)
docker compose -f compose.prod.yaml restart app
```

### Kalau ada update kode baru

```bash
cd ~/apps/dev-CMSCORE
git pull
docker compose -f compose.prod.yaml --env-file .env.prod up -d --build

# Lakukan hal sama untuk panel bila ada perubahan tampilan
cd ~/apps/dev-CMSPANEL
git pull
docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
```

---

## Keamanan (penting)

Yang sudah diatur otomatis di setup ini:

- **Hanya Nginx yang terbuka ke internet** (port 80 & 8080). Database, Redis, dan penyimpanan file **tidak** bisa diakses dari luar — hanya dipakai antar-aplikasi di dalam server.
- **Redis wajib password** di produksi (diambil dari `.env.prod`).

Yang **harus Anda lakukan sendiri**:

- ✅ Ganti **semua** nilai `<GANTI-...>` di `.env.prod` (jangan pakai contoh apa adanya).
- ✅ Ganti password login admin default setelah login pertama.
- ✅ Jangan pernah `git push` file `.env.prod` (sudah otomatis diabaikan git, tapi jangan dipaksa masuk).

---

## Kalau Bermasalah

| Gejala                                     | Kemungkinan sebab & solusi                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `docker: command not found`                | Docker belum terinstall — ulangi Langkah 1.                                                 |
| Build gagal / berhenti di tengah           | Server kehabisan memori. Coca lagi, atau pakai server dengan RAM lebih besar (min. 2 GB).   |
| API tidak bisa dibuka di browser           | Port 80 belum dibuka di firewall server. Buka port 80 (dan 8080 untuk panel).               |
| Panel muncul tapi "tidak konek ke server"  | `VITE_API_BASE_URL` salah/URL API beda. Perbaiki `.env.prod` panel lalu **build ulang**.    |
| Login gagal / CORS error                   | IP server belum ada di `CORS_ORIGINS` (file `.env.prod` backend). Tambahkan, lalu restart app. |
| Cek penyebab error apa pun                 | Lihat log: `docker compose -f compose.prod.yaml logs -f app`                                 |

### Setelah mengubah `.env.prod`

Ubahan `.env.prod` baru terbaca kalau container dibuat ulang (bukan sekadar restart biasa):

```bash
docker compose -f compose.prod.yaml --env-file .env.prod up -d --force-recreate app
```

---

## Reset Data (hati-hati)

Menghapus **semua** data (database, file upload) dan mulai bersih:

```bash
docker compose -f compose.prod.yaml down -v   # ⚠️ -v menghapus data permanen
```

Tanpa `-v`, data aman saat `down`.

---

## Catatan Lanjutan (opsional)

- **Pakai domain + HTTPS**: kalau nanti punya domain, ganti `server_name _;` di `docker/nginx.prod.conf` dengan domain Anda, dan tambahkan sertifikat SSL (mis. pakai Certbot atau Caddy). Untuk sekarang panduan ini memakai IP + HTTP biasa.
- **Database terpisah**: kalau mau Postgres di luar Docker (managed service), hapus service `postgres` di `compose.prod.yaml` dan arahkan `DATABASE_URL` di `.env.prod` ke server database tersebut.
```
