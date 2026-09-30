# 🎙️ Public Speaking Daily Schedule Tracker

> **Menjawab seketika dalam 1 detik: *"Hari ini siapa yang maju?"***

Aplikasi web modern, ringan, responsif, dan berbasis *offline-first* untuk mengelola jadwal harian sesi *public speaking* kelas. Setiap hari, tepat satu siswa dijadwalkan maju ke depan kelas untuk membawakan materi.

Didesain khusus untuk menangani dinamika nyata di ruang kelas: siswa sakit/izin, tukar giliran, pemajuan/pengunduran jadwal, tanpa merusak riwayat masa lalu.

---

## 🚀 Fitur Utama

1. **Fokus Utama: Siapa yang Maju Hari Ini?**
   - Kartu *hero* berukuran besar yang menampilkan nama pembicara hari ini secara jelas dan dominan dalam 1-2 detik setelah aplikasi dibuka.
   - Status sesi (*Dijadwalkan*, *Selesai ✓*, *Ditunda ⏱*).
   - Pintasan langsung untuk **Tandai Selesai**, **Tunda (Izin/Sakit)**, **Tukar Jadwal**, dan **Catatan Topik**.

2. **Antrean Terurut & Rekalkulasi Tanggal Otomatis (Ordered Queue)**
   - Jadwal dikelola sebagai antrean urutan dinamis.
   - Menggeser urutan siswa ke atas (`▲`) atau ke bawah (`▼`) otomatis menghitung ulang tanggal tanpa perlu mengedit kalender secara manual.
   - Mengakomodasi hari aktif kelas (Senin–Jumat secara default, otomatis melewati akhir pekan atau hari libur).

3. **Penanganan Kasus Siswa Berhalangan / Sakit (Postpone & Skip)**
   - Ketika pembicara hari ini sakit, satu klik **Tunda** akan memindahkan siswa ke akhir antrean (atau besok) dan otomatis memajukan antrean siswa berikutnya ke hari ini.
   - Riwayat penundaan dicatat transparan di kartu sesi.

4. **Tukar Giliran (Swap Speakers)**
   - Dialog pemilihan siswa untuk saling bertukar tanggal presentasi secara instan.

5. **Riwayat Sesi yang Kekal (Historical Records)**
   - Sesi yang telah ditandai selesai (`completed`) atau telah lewat terkunci di arsip riwayat dan tidak akan teracak saat urutan masa depan dimodifikasi.

6. **Manajemen Anggota Kelas**
   - Tambah siswa baru dengan opsi langsung dijadwalkan di slot kosong berikutnya.
   - Edit nama siswa.
   - Fitur **Arsipkan** yang aman agar riwayat sesi yang sudah selesai tidak hilang saat siswa tidak aktif lagi.

7. **Pencadangan & Pemulihan Data (Backup & Restore)**
   - Ekspor seluruh data kelas ke format JSON (`public-speaking-schedule-backup-YYYY-MM-DD.json`).
   - Impor file backup dengan validasi integritas skema data yang ketat.
   - Fitur muat data simulasi (Demo) dan reset data bersih.

8. **Estetika & Aksesibilitas Modern**
   - Dukungan tema **Mode Gelap (Dark Mode)** dan **Mode Terang (Light Mode)** otomatis atau via toggle.
   - Pintasan keyboard cepat (`T`: Hari Ini, `S`: Jadwal, `M`: Siswa, `P`: Pengaturan, `D`: Mode Gelap, `?`: Bantuan).
   - Desain responsif optimal untuk layar ponsel siswa maupun laptop pengajar.

---

## 🏛️ Arsitektur Aplikasi

Aplikasi dibangun menggunakan **Vanilla JavaScript (ES Modules)**, **HTML5 semantik**, dan **Vanilla CSS** berbasis token desain kustom tanpa *framework bloated*.

```text
┌─────────────────────────────────────────────────────────────┐
│                           UI Layer                          │
│   (dashboard.js, schedule.js, students.js, settings.js)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Schedule Service Layer                   │
│                    (schedule-service.js)                    │
│   - Aturan bisnis antrean (move, swap, postpone, complete)  │
│   - Rekalkulasi tanggal berbasis hari aktif kelas           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Central Store (Pub/Sub)                │
│                        (core/store.js)                      │
│   - State terpadu & mutasi deterministik                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repository Abstraction                  │
│                (local-storage-repository.js)                │
│   - Serialisasi, validasi skema, & penanganan error         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      localStorage Storage                   │
│              Key: "public-speaking-schedule:v1"             │
└─────────────────────────────────────────────────────────────┘
```

Struktur folder:

```text
/
├── index.html                   # Halaman utama aplikasi
├── vercel.json                  # Konfigurasi deployment statis Vercel
├── package.json                 # Skrip lokal & metadata
├── README.md                    # Dokumentasi lengkap
├── css/
│   ├── reset.css                # CSS reset modern
│   ├── variables.css            # Variabel desain (tema terang/gelap, HSL, tipografi)
│   ├── style.css                # Komponen UI utama (hero, kartu, modal, toast)
│   └── responsive.css           # Optimasi mobile dan touch screen
└── js/
    ├── app.js                   # Inisialisasi, routing tab, pintasan keyboard
    ├── core/
    │   ├── state.js             # Skema state awal & generator data demo
    │   └── store.js             # State store reaktif dengan langganan (pub/sub)
    ├── services/
    │   └── schedule-service.js  # Layanan logika bisnis jadwal & manipulasi antrean
    ├── repositories/
    │   └── local-storage-repository.js # Abstraksi penyimpanan & import/export
    ├── utils/
    │   ├── date.js              # Utilitas tanggal murni bebas bug timezone
    │   ├── id.js                # Generator ID unik
    │   └── validation.js        # Validasi integritas skema data
    └── ui/
        ├── dashboard.js         # Tampilan hero hari ini (Today)
        ├── schedule.js          # Tampilan daftar jadwal lengkap & kontrol urutan
        ├── students.js          # Tampilan direktori siswa & absensi sesi
        ├── settings.js          # Tampilan konfigurasi kelas & backup
        ├── modal.js             # Pengelola modal & dialog konfirmasi aksesibel
        └── toast.js             # Notifikasi toast mengambang
```

---

## 📦 Model Data (Data Schema)

Disimpan dalam kunci `public-speaking-schedule:v1`:

```json
{
  "version": 1,
  "class": {
    "name": "Backend Engineering Batch #4",
    "startDate": "2026-09-28",
    "classDays": [1, 2, 3, 4, 5],
    "timezone": "Asia/Jakarta"
  },
  "students": [
    {
      "id": "student-1",
      "name": "Alice Prasetyo",
      "active": true
    }
  ],
  "schedule": [
    {
      "id": "schedule-1",
      "studentId": "student-1",
      "date": "2026-09-28",
      "status": "completed",
      "completedAt": "2026-09-28T10:15:00.000Z",
      "note": "Topik: Microservices Architecture"
    }
  ]
}
```

### Format Tanggal Bebas Masalah Timezone
Semua tanggal disimpan secara eksklusif dalam format ISO `YYYY-MM-DD`. Komputasi tanggal dilakukan menggunakan aritmatika berbasis UTC di dalam `js/utils/date.js`, sehingga perbedaan zona waktu pengguna tidak akan menggeser hari secara salah.

---

## 💻 Menjalankan Secara Lokal

Karena aplikasi menggunakan Vanilla ES Modules murni, Anda cukup menyajikan folder project dengan server statis lokal:

### Opsi 1: Menggunakan Python (Bawaan Sistem)
```bash
python3 -m http.server 3000
```
Buka browser di `http://localhost:3000`.

### Opsi 2: Menggunakan Node / npm
```bash
npm start
# atau
npx serve .
```

---

## 🌐 Deployment ke Vercel

Aplikasi ini 100% statis tanpa dependensi backend atau *build-step* rumit.

1. Hubungkan repositori GitHub Anda ke **Vercel**.
2. Vercel akan otomatis mendeteksi `index.html` dan `vercel.json`.
3. Klik **Deploy**.
4. Aplikasi langsung aktif dan dapat diakses publik!

---

## 🔄 Rencana Migrasi ke Backend (Future Migration)

Arsitektur aplikasi memisahkan UI dan penyimpanan melalui `ScheduleService` dan `LocalStorageRepository`.

Untuk menghubungkan ke backend API (seperti Node.js Express, Go, atau Supabase) di masa depan:
1. Buat berkas `js/repositories/api-repository.js` dengan antarmuka yang sama (`loadSchedule()`, `saveSchedule()`).
2. Ganti instansiasi repository di `ScheduleService`.
3. Seluruh UI, logika antrean, dan validasi tetap berfungsi tanpa perlu ditulis ulang.

---

## 📝 Lisensi
MIT License.
