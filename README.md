# Carewell — Clinic Management

Aplikasi manajemen klinik full-stack: **Vue 3 + Vite + Tailwind CSS v4** (frontend) dan **Node.js + Express + MySQL** (backend).

![Carewell]
## Fitur

| Modul | Kemampuan |
|---|---|
| Login | JWT auth, bcrypt hash, sesi persist, auto-redirect bila token invalid |
| Hak akses | 3 role (admin / dokter / resepsionis) dengan menu, data, dan aksi berbeda |
| Dashboard | Statistik live; dokter melihat versi terbatas miliknya sendiri |
| Patients | CRUD penuh, kode otomatis (`P-XXXX`), hitung usia, pencarian, filter, pagination, export CSV |
| Appointments | CRUD, ubah status (selesai/batal), filter tanggal & status, ringkasan |
| Doctors | CRUD, relasi departemen, jumlah pasien |
| Departments | CRUD, okupansi bed, jumlah dokter/pasien |
| Medical Records | CRUD, 6 tipe rekaman, relasi pasien/dokter |
| Billing & Payments | CRUD invoice, kode otomatis (`INV-XXX`), tandai lunas, auto-flag jatuh tempo |
| Reports | Laporan pasien / keuangan / performa dokter, 5 periode, export CSV, cetak |
| Users | (admin) CRUD akun staf, tautkan akun dokter ↔ data dokter, reset password, jejak aktivitas |
| Profil Saya | Ubah nama sendiri, ganti password dengan verifikasi password lama, lihat modul yang diizinkan |

## Prasyarat

- Node.js 18+
- MySQL 8 (mis. via Laragon) berjalan di `127.0.0.1:3306`

## Setup

```bash
npm install
```

Buat database + tabel:

```bash
# Windows (Laragon)
& "D:\Program\Laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root < server\schema.sql

# atau jika mysql ada di PATH
mysql -u root < server/schema.sql
```

Isi data contoh:

```bash
npm run seed
```

Konfigurasi ada di `.env` (salin dari contoh):

```bash
# Windows
Copy-Item .env.example .env

# atau macOS/Linux
cp .env.example .env
```

Isi `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=carewell_clinic
PORT=3000
JWT_SECRET=ganti-dengan-secret-acak-yang-kuat
JWT_EXPIRES_IN=7d
```

> `.env` sudah masuk `.gitignore` — jangan pernah commit kredensial. Ganti `JWT_SECRET` dengan nilai acak:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Menjalankan

Butuh **dua terminal**:

```bash
# Terminal 1 — backend API (port 3000)
npm run server

# Terminal 2 — frontend (port 5173)
npm run dev
```

Buka `http://localhost:5173`.

## Migrasi

Jika database sudah pernah dibuat sebelum fitur role, jalankan migrasi berikut (urut):

```bash
& "D:\Program\Laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root < server\migrations\001_user_doctor_link.sql
& "D:\Program\Laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root < server\migrations\002_staff_user.sql
& "D:\Program\Laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root < server\migrations\003_user_doctor_unique.sql
& "D:\Program\Laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root < server\migrations\004_audit_log.sql
```

| Migrasi | Isi |
|---|---|
| `001_user_doctor_link.sql` | Kolom `users.doctor_id` + FK ke `doctors`, lalu menautkan akun Dr. Sarah |
| `002_staff_user.sql` | Akun demo resepsionis |
| `003_user_doctor_unique.sql` | Unique index `uq_user_doctor` — satu dokter hanya boleh punya satu akun |
| `004_audit_log.sql` | Tabel `audit_log` untuk jejak perubahan data |

Semua migrasi idempoten (aman dijalankan berulang).

## Akun demo

Semua password: `admin123`

| Email | Role | Label di UI | Cakupan |
|---|---|---|---|
| `admin@carewell.test` | admin | Clinic Admin | Semua modul, semua data |
| `sarah@carewell.test` | doctor | Dokter | Hanya pasien & jadwal miliknya |
| `staff@carewell.test` | staff | Resepsionis | Operasional, tanpa laporan |

> Reset password: admin dapat mengubah password akun mana pun lewat **Users → ikon kunci**. Tiap user juga bisa mengganti password sendiri di **Profil Saya**.

## Hak akses per role

Matriks izin ada di satu tempat: `server/permissions.js`. Backend memasang `requireModule(...)` per prefix route, frontend memfilter menu dari `user.permissions` yang dikirim saat login.

| Modul | Admin | Dokter | Resepsionis |
|---|:--:|:--:|:--:|
| Dashboard | ✅ penuh | ✅ versi dirinya | ✅ penuh |
| Patients | ✅ CRUD | 👁 hanya pasiennya | ✅ tambah/ubah |
| Appointments | ✅ CRUD | ✅ miliknya saja | ✅ CRUD |
| Doctors | ✅ CRUD | ❌ | 👁 hanya lihat |
| Departments | ✅ CRUD | 👁 hanya lihat | 👁 hanya lihat |
| Medical Records | ✅ CRUD | ✅ miliknya saja | ✅ tambah/ubah |
| Billing & Payments | ✅ CRUD | ❌ | ✅ tambah/ubah |
| Reports | ✅ | ❌ | ❌ |
| Users | ✅ CRUD | ❌ | ❌ |

Catatan tambahan:

- Hapus data bersifat **admin-only** untuk pasien, dokter, departemen, rekam medis, dan invoice.
- Dokter **wajib** tertaut ke baris `doctors` (`users.doctor_id`). Bila tidak, login ditolak (403) dan tidak ada token yang diterbitkan. Bila token sudah terlanjur beredar, middleware `requireDoctorLink` tetap menolak semua endpoint data — prinsip *fail-closed*.
- Dokter hanya bisa membaca/menulis data pasien yang pernah ia tangani; akses ke rekam medis atau appointment pasien lain ditolak 403, termasuk bila ID ditebak langsung.
- Admin tidak bisa menghapus akunnya sendiri, menurunkan role-nya sendiri, atau menghapus admin terakhir.
- Halaman yang tidak diizinkan tetap bisa diketik di URL — router mengarahkan ke `/forbidden`, dan API tetap menolak dengan 403.
- Login dibatasi **8 percobaan gagal per 15 menit** per kombinasi IP + email (in-memory, tanpa dependensi tambahan). Setelah itu balasan 429.

## API

Semua endpoint di bawah `/api` butuh header `Authorization: Bearer <token>`, kecuali `POST /api/auth/login`.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/health` | Status server + DB |
| POST | `/api/auth/login` | Login, balikan `token` + `user` |
| GET | `/api/auth/me` | Profil user aktif |
| PATCH | `/api/auth/profile` | Ubah nama sendiri |
| PATCH | `/api/auth/password` | Ganti password sendiri (verifikasi password lama) |
| GET | `/api/dashboard` | Agregat statistik dashboard |
| GET/POST | `/api/patients` | List / buat pasien |
| GET/PUT/DELETE | `/api/patients/:id` | Detail / ubah / hapus |
| GET/POST | `/api/appointments` | List / buat appointment |
| PUT/DELETE | `/api/appointments/:id` | Ubah / hapus |
| PATCH | `/api/appointments/:id/status` | Ubah status saja |
| GET/POST | `/api/doctors` | List / buat dokter |
| GET/PUT/DELETE | `/api/doctors/:id` | Detail / ubah / hapus |
| GET/POST | `/api/departments` | List / buat departemen |
| GET/PUT/DELETE | `/api/departments/:id` | Detail / ubah / hapus |
| GET/POST | `/api/records` | List / buat rekam medis |
| GET/PUT/DELETE | `/api/records/:id` | Detail / ubah / hapus |
| GET/POST | `/api/invoices` | List / buat invoice |
| PUT/DELETE | `/api/invoices/:id` | Ubah / hapus |
| PATCH | `/api/invoices/:id/pay` | Tandai lunas |
| GET | `/api/reports/overview` | Ringkasan untuk kartu laporan |
| GET | `/api/reports?type=&period=` | Data laporan (`patients`/`finance`/`doctors`, `this_month`/`last_month`/`last_7`/`year`/`all`) |
| GET/POST | `/api/users` | (admin) List / buat akun |
| GET/PUT/DELETE | `/api/users/:id` | (admin) Detail / ubah / hapus akun |
| PATCH | `/api/users/:id/password` | (admin) Reset password akun lain |
| GET | `/api/audit` | (admin) Jejak perubahan data, `?limit=&action=&entity=&user_id=&search=` |
| GET | `/api/audit/summary` | (admin) Ringkasan jumlah aksi 7 hari terakhir |

Query list mendukung `?search=`, `?status=`, `?date=`, `?type=`, `?department_id=`, `?patient_id=`.

## Struktur

```
server/
  index.js          # entry Express; guard = authenticate → auditTrail → requireDoctorLink → requireModule
  db.js             # pool mysql2 + helper query()/one()
  auth.js           # middleware authenticate, signToken, publicUser
  permissions.js    # matriks izin role: PERMISSIONS, can(), authorize(), requireModule(),
                    # isScopedDoctor(), requireDoctorLink()
  scope.js          # penjagaan data milik dokter (doctorHasPatient, denyPatientAccess)
  audit.js          # auditTrail middleware + writeAudit()
  rate-limit.js     # throttle login in-memory (8 gagal / 15 menit)
  helpers.js        # asyncHandler, validasi, paging
  schema.sql        # DDL 8 tabel (FK + index)
  seed.js           # data contoh
  migrations/       # 001..004
  routes/           # auth, dashboard, patients, appointments, doctors,
                    # departments, records, invoices, reports, users, audit

src/
  main.js           # bootstrap (tunggu router siap → pulihkan sesi → mount)
  App.vue           # layout publik vs protected
  lib/              # api.js, auth.js, format.js, toast.js, ui.js
  components/
    Sidebar.vue, Header.vue, Dashboard.vue
    pages/          # Login, Patients, Appointments, Doctors, Departments,
                    # MedicalRecords, Billing, Reports, Users, Profile, Forbidden
    ui/             # Badge, Card, BaseButton, StatCard, AppModal,
                    # TextField, TextareaField, SelectField, dll.
```

## Catatan teknis

- **Tailwind v4**: konfigurasi lewat `@import "tailwindcss"` + `@theme {}` di `src/style.css`, plugin `@tailwindcss/vite`. Tidak memakai `tailwind.config.js` / `postcss.config.js`.
- Semua styling via utility class inline di template (tanpa `@apply` di `<style scoped>`).
- **Izin ditegakkan dua lapis**: backend menolak dengan 403 lewat `requireModule()` / `authorize()`, frontend menyembunyikan menu & tombol yang tidak relevan. Menyembunyikan tombol saja tidak cukup — API tetap memvalidasi.
- **Prinsip fail-closed**: `isScopedDoctor()` hanya memeriksa `role === 'doctor'`, bukan keberadaan `doctor_id`. Tautan yang hilang membuat request ditolak oleh `requireDoctorLink`, bukan malah membuka seluruh data.
- `users.doctor_id` menautkan akun dokter ke baris `doctors`; unique index `uq_user_doctor` menjaga relasi 1:1.
- **Audit trail** mencatat setiap POST/PUT/PATCH/DELETE yang berhasil (2xx) ke tabel `audit_log`: pelaku, aksi, entitas, id, endpoint, IP, waktu. Penolakan 4xx tidak dicatat karena bukan perubahan data. Penulisan log bersifat *best effort* — kegagalan log tidak menggagalkan aksi bisnis.
- Error 401 pada `/auth/login` diterjemahkan sebagai "Email atau password salah"; 401 pada endpoint lain memicu logout otomatis.
- Hapus pasien akan menghapus appointment, rekam medis, dan invoice terkait (cascade).
