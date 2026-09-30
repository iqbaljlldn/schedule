<template>
  <div class="min-h-screen flex flex-col justify-between p-6 sm:p-12">
    <!-- Header -->
    <header class="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🎙️</span>
        <div>
          <h1 class="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
            Motivational Show Tracker
          </h1>
          <span class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Multi-Teacher & Student Portal</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="toggleTheme"
          class="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80 transition"
          aria-label="Toggle theme"
        >
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <NuxtLink
          to="/login"
          class="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
        >
          Login Guru →
        </NuxtLink>
      </div>
    </header>

    <!-- Hero Content -->
    <main class="max-w-4xl mx-auto my-auto text-center py-12">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Sistem Manajemen Jadwal & Rubrik Motivational Show Kelas
      </div>

      <h2 class="font-display font-black text-4xl sm:text-6xl text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
        Menjawab seketika:<br />
        <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
          "Hari ini siapa yang maju?"
        </span>
      </h2>

      <p class="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
        Dirancang khusus untuk dinamika ruang kelas nyata: kelola antrean bergulir multi-putaran, tukar giliran instan, penanganan siswa sakit tanpa merusak jadwal, dan portal publik ramah murid tanpa login.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <NuxtLink
          to="/c/public-speaking-2026"
          class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition transform hover:-translate-y-0.5"
        >
          📱 Buka Jadwal Siswa (Read-Only)
        </NuxtLink>
        <NuxtLink
          to="/c/public-speaking-2026/stage"
          class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-base border border-slate-700 shadow-md transition transform hover:-translate-y-0.5"
        >
          📺 Mode Layar Proyektor TV
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-base border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          👨‍🏫 Portal Pengajar / Guru
        </NuxtLink>
      </div>

      <!-- Features summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-3xl mb-3 block">🔄</span>
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Multi-Putaran & Carry-over</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Siswa yang 2x berhalangan otomatis dialihkan sebagai pembuka Putaran berikutnya tanpa menahan antrean kelas.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-3xl mb-3 block">⏱️</span>
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Live Scoring & Timer</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Penilaian rubrik langsung (kelancaran, isi materi, ketepatan waktu) plus stopwatch countdown di layar proyektor.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-3xl mb-3 block">🔗</span>
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Link Publik Khusus Murid</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Murid cukup bookmark link kelas. Bisa cari namanya, cek hitung mundur giliran, dan ajukan judul materi H-1.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-5xl mx-auto w-full pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
      Motivational Show Daily Schedule Tracker • Nuxt 3 & PostgreSQL (Neon) • Built for Classroom Excellence
    </footer>
  </div>
</template>

<script setup lang="ts">
const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
})

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('ps-theme', theme)
}
</script>
