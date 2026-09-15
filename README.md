# Sistem Dokumentasi & Verifikasi Closing Logam Mulia

Aplikasi internal fullstack production-ready untuk standardisasi, dokumentasi, verifikasi, dan audit closing harian stok fisik emas batangan (logam mulia) seluruh cabang.

---

## 📋 Daftar Akun Pengguna Terdaftar (Hasil Seeding)

Akun sistem menggunakan penamaan berbasis **Cabang** dan **Kantor Pusat** (tanpa nama orang pribadi).

| No | Nama Akun | Alamat Email | Peran (Role) | Hak Akses & Cakupan | Kata Sandi Awal |
|---|---|---|---|---|---|
| 1 | **Staff Cabang Yogyakarta** | `staff.jogja@closinglm.id` | `STAFF_CABANG` | Cabang Yogyakarta | `Closing2026!` |
| 2 | **Staff Cabang Jakarta** | `staff.jakarta@closinglm.id` | `STAFF_CABANG` | Cabang Jakarta Pusat | `Closing2026!` |
| 3 | **Staff Cabang Bandung** | `staff.bandung@closinglm.id` | `STAFF_CABANG` | Cabang Bandung | `Closing2026!` |
| 4 | **Staff Kantor Pusat (HQ)** | `staff.pusat@closinglm.id` | `STAFF_PUSAT` | Otorisasi Seluruh Cabang | `Closing2026!` |

> [!NOTE]
> Kata sandi disimpan dengan enkripsi aman menggunakan algoritma derivasi kunci `scrypt` berkekuatan tinggi (64-byte derived key dengan random salt per akun).

---

## 🚀 Panduan Persiapan Menuju Production (Neon PostgreSQL)

Untuk mendeploy aplikasi ini ke production menggunakan **Neon PostgreSQL (Serverless Postgres)**:

### 1. Buat Database di Neon
1. Masuk ke dashboard [Neon.tech](https://neon.tech).
2. Buat project baru, beri nama misalnya `closing-logam-mulia`.
3. Buat database baru (misal: `closing_documentation` atau gunakan database default `neondb`).
4. Salin **Connection String (Pooled Connection / Direct Connection)** yang disediakan oleh Neon.
   Formatnya:
   ```env
   DATABASE_URL="postgresql://username:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```

### 2. Konfigurasi Environment Variables Production
Siapkan file `.env` di server production (atau di panel hosting seperti Vercel, Railway, Coolify, Docker) berisi variabel:

```env
# Database Neon PostgreSQL (Gunakan connection string dengan sslmode=require)
DATABASE_URL="postgresql://username:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Secret kunci sesi internal (minimal 32 karakter acak)
BETTER_AUTH_SECRET="ganti_dengan_random_secret_panjang_production_32_karakter"

# URL domain aplikasi production
APP_URL="https://closing.namaperusahaan.com"
BETTER_AUTH_URL="https://closing.namaperusahaan.com"

# Konfigurasi upload & penyimpanan dokumen
MAX_FILE_SIZE_MB=10
STORAGE_PATH="./private_storage/uploads"
```

### 3. Eksekusi Migrasi Database & Seeding di Production
Jalankan perintah berikut di lingkungan production:

```bash
# 1. Install seluruh dependensi
pnpm install --frozen-lockfile

# 2. Generate Prisma Client
pnpm prisma generate

# 3. Jalankan migrasi schema ke database Neon
pnpm prisma migrate deploy

# 4. Jalankan seed data cabang dan pengguna awal
pnpm prisma db seed

# 5. Build aplikasi Next.js
pnpm build

# 6. Jalankan server production
pnpm start
```

---

## 🛠️ Panduan Menjalankan Secara Lokal (Local Docker PostgreSQL)

Jika Anda ingin menjalankan secara lokal menggunakan container Docker:

```bash
# 1. Nyalakan PostgreSQL 17 di Docker
docker compose up -d

# 2. Install dependensi
pnpm install

# 3. Sinkronkan schema database
pnpm prisma db push

# 4. Seed database lokal
pnpm prisma db seed

# 5. Jalankan server development
pnpm dev
```
Akses aplikasi melalui browser di `http://localhost:3000`.

---

## 🏗️ Arsitektur Aplikasi

Aplikasi dibangun dengan pemisahan tanggung jawab (Separation of Concerns) berlapis:

```
UI / Frontend (Next.js App Router, Tailwind CSS, Lucide Icons)
       ↓
Server Actions & Route Handlers (Download & ZIP Streaming)
       ↓
PermissionService (Server-Side Authorization & Scope Guard)
       ↓
Service Layer (ClosingService, ChecklistService, FileService, RevisionService, ShareService, ActivityService)
       ↓
Repository Layer (Prisma Queries & CRUD)
       ↓
Prisma ORM & PostgreSQL Database (Neon / Local Docker) + StorageService (Private Filesystem)
```

---

## ⚖️ Aturan Bisnis Inti (Business Rules)

1. **BR-001 — Satu Closing per Cabang per Tanggal:**
   - Constraint database `@@unique([branchId, closingDate])` mencegah duplikasi data closing pada cabang dan hari yang sama.
2. **BR-002 & BR-003 — Validasi Checklist 11 Item:**
   - **9 Gramasi Fisik:** `0.5g`, `1g`, `2g`, `3g`, `5g`, `10g`, `25g`, `50g`, `100g`.
   - `HAS_STOCK`: Wajib melampirkan foto fisik stok gramasi tersebut.
   - `NO_STOCK`: **Otomatis dianggap lengkap tanpa foto** dan TIDAK PERNAH dianggap sebagai dokumen yang kurang.
   - **2 Dokumen Wajib:** File Excel Rekapitulasi (`STOCK_EXCEL`) dan Foto Rekapitulasi Harian (`RECAP_PHOTO`).
   - Formula Kelengkapan: `(completed_items / 11) * 100`.
3. **BR-004 — Tautan Berbagi Publik (Guest Read-Only):**
   - Menggunakan token acak kriptografis 64 karakter.
   - Database hanya menyimpan hash SHA-256 (`tokenHash`).
   - Mendukung masa berlaku (1, 3, 7, 30 hari) serta pencabutan manual (*revocation*).
   - Pengunjung publik hanya memiliki hak melihat dan mengunduh (read-only).
4. **BR-005 & BR-006 — Otorisasi Server-Side:**
   - Staff Cabang hanya dapat mengakses data cabang milik sendiri.
   - Staff Pusat hanya dapat mengakses data cabang yang masuk dalam cakupan kewenangannya.
5. **BR-007 — Proteksi Status VERIFIED:**
   - Dokumen closing yang telah diverifikasi oleh Kantor Pusat menjadi *immutable* (terkunci dari pengeditan atau pengunggahan baru melalui UI normal).
6. **BR-008 — Preservasi Riwayat Revisi:**
   - Riwayat catatan revisi dari Kantor Pusat dan perbaikan dari Cabang tersimpan permanen dalam *audit trail* dan tidak boleh dihapus.
