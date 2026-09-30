# 🚀 Panduan Step-by-Step Deploy ke Vercel (Nuxt 3 & PostgreSQL)

Aplikasi **Motivational Show Daily Schedule Tracker** kini berbasis **Nuxt 3 Full-Stack** (Server-Side Rendering + Serverless API) dengan database **Neon PostgreSQL**.

Vercel mendukung Nuxt 3 secara *native* dengan performa tinggi via Serverless Functions.

---

## 📌 Ringkasan Penting Sebelum Deploy

1. **Database Sudah Siap di Cloud**:
   Database Neon PostgreSQL Anda sudah aktif di Region `ap-southeast-1` (Singapura) dan tabel-tabel (`users`, `classes`, `students`, `schedules`, `assessments`) beserta 18 siswa mulai 1 Oktober 2026 sudah terisi.
2. **File `vercel.json` Lama Sudah Dihapus**:
   File `vercel.json` statis lama telah dihapus agar Vercel otomatis mengaktifkan *Serverless Function Engine* Nuxt 3 tanpa konflik routing.

---

## 📋 Variabel Lingkungan (*Environment Variables*) yang Wajib

Sebelum melakukan *deploy*, pastikan Anda menyiapkan 3 Environment Variables berikut untuk dimasukkan ke Vercel:

| Nama Variabel | Nilai / Value | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_p2P5zGTYAkqv@ep-morning-firefly-a1u1rq3i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Koneksi Neon PostgreSQL Pooler |
| `JWT_SECRET` | `motivational-show-tracker-super-secret-jwt-key-2026` | Kunci enkripsi token login guru |
| `COOKIE_SECURE` | `true` | Mengaktifkan cookie aman via HTTPS Vercel |

---

## 🛠️ Metode 1: Deploy via Vercel Dashboard & GitHub (Sangat Direkomendasikan)

### Langkah 1: Simpan dan Push Kode ke Git
Jalankan perintah ini di terminal proyek:
```bash
git add .
git commit -m "feat: total rewrite to nuxt 3 with postgresql, stage mode, and rubric"
git push origin main
```

### Langkah 2: Hubungkan di Vercel Dashboard
1. Buka [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. Jika proyek sebelumnya sudah ada:
   - Masuk ke proyek tersebut -> Buka tab **Settings** -> **Environment Variables**.
   - Tambahkan ketiga variabel di atas (`DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECURE`).
   - Masuk ke tab **Deployments** -> Klik titik tiga (...) pada commit terbaru -> **Redeploy**.
3. Jika membuat proyek baru:
   - Klik **"Add New..."** -> **"Project"**.
   - Pilih repository GitHub Anda (`scheduler`).
   - Vercel akan otomatis mendeteksi **Framework Preset: Nuxt.js**.
   - Buka bagian accordion **Environment Variables**.
   - Tambahkan 3 variabel di atas.
   - Klik **"Deploy"**.

---

## 💻 Metode 2: Deploy Cepat via Terminal (Vercel CLI)

Jika Anda ingin deploy langsung dari terminal tanpa membuka web browser:

1. **Login ke Vercel CLI**:
   ```bash
   npx vercel login
   ```

2. **Kaitkan dan Deploy**:
   ```bash
   npx vercel
   ```
   - Ikuti prompt di terminal:
     - *Set up and deploy?* -> `Y`
     - *Which scope?* -> Pilih akun Vercel Anda
     - *Link to existing project?* -> `Y` (jika sudah ada) atau `N` (jika baru)
     - *Want to modify settings?* -> `N`

3. **Tambahkan Environment Variables**:
   ```bash
   npx vercel env add DATABASE_URL production
   # Masukkan value string koneksi Neon PostgreSQL
   
   npx vercel env add JWT_SECRET production
   # Masukkan value secret JWT
   
   npx vercel env add COOKIE_SECURE production
   # Masukkan: true
   ```

4. **Deploy ke Production**:
   ```bash
   npx vercel --prod
   ```

---

## ✅ Verifikasi Setelah Berhasil Deploy

Setelah proses deployment selesai (biasanya sekitar 1–2 menit), buka domain Vercel Anda (misal `https://scheduler-xxx.vercel.app`):

1. **Beranda / Landing Page**:
   - `https://your-domain.vercel.app/`
2. **Portal Siswa (Read-Only)**:
   - `https://your-domain.vercel.app/c/public-speaking-2026`
   - Pastikan nama **AHMAD YAZID** tampil pada Kamis, 1 Oktober 2026.
3. **Layar TV / Panggung Proyektor**:
   - `https://your-domain.vercel.app/c/public-speaking-2026/stage`
   - Coba tombol pengatur waktu bicara (5 menit).
4. **Portal Guru**:
   - `https://your-domain.vercel.app/login`
   - Gunakan email: `guru@sekolah.id` dan password: `password123` (atau klik tombol **Gunakan Demo**).
   - Masuk ke Dashboard untuk menguji rubrik penilaian langsung dan pengaturan jadwal.

---

## ❓ FAQ & Troubleshooting

- **Q: Apakah data murid akan hilang saat di-deploy ulang?**
  - **A: Tidak**. Database PostgreSQL berada secara independen di cloud Neon, terpisah dari hosting Vercel. Setiap ada redeploy di Vercel, data murid, penilaian, dan jadwal tetap aman tersimpan di database.
- **Q: Mengapa saya mendapatkan error database saat pertama buka?**
  - **A:** Pastikan variabel `DATABASE_URL` sudah ditambahkan pada Environment Variables di Vercel dengan nilai yang tepat (pastikan mencakup `?sslmode=require`).
