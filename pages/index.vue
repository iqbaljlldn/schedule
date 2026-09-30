<template>
  <div class="min-h-screen flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors">
    <!-- Ambient glowing backgrounds -->
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none"></div>

    <!-- Header -->
    <header class="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-200/80 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🎙️</span>
        <div>
          <h1 class="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
            Motivational Show Tracker
          </h1>
          <span class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Multi-Guru & Multi-Kelas Portal</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ThemeToggle />
        <NuxtLink
          to="/login"
          class="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
        >
          Portal Guru &rarr;
        </NuxtLink>
      </div>
    </header>

    <!-- Hero Content -->
    <main class="max-w-4xl mx-auto my-auto text-center py-12">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Sistem Manajemen Jadwal & Rubrik Kelas Multi-Guru
      </div>

      <h2 class="font-display font-black text-4xl sm:text-6xl text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
        Menjawab seketika:<br />
        <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
          "Hari ini siapa yang maju?"
        </span>
      </h2>

      <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
        Satu platform untuk <strong>semua guru</strong> dan <strong>semua kelas</strong>. Setiap guru dapat membuat banyak kelas dengan murid berbeda, jadwal otomatis bergulir, mode layar proyektor TV, dan link khusus murid tanpa perlu login.
      </p>

      <!-- Student Class Finder Box -->
      <div class="max-w-md mx-auto mb-10 p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Siswa: Masukkan Kode / Slug Kelas Anda
        </p>
        <div class="flex items-center gap-2">
          <input
            v-model="inputSlug"
            type="text"
            placeholder="contoh: public-speaking-2026"
            class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keyup.enter="goToClass"
          />
          <button
            type="button"
            @click="goToClass"
            class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
          >
            Buka Jadwal &rarr;
          </button>
        </div>
        <p class="text-[11px] text-slate-400">
          Atau lihat kelas contoh:
          <NuxtLink to="/c/public-speaking-2026" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Motivational Show Class Demo &rarr;
          </NuxtLink>
        </p>
      </div>

      <!-- Quick Action CTAs -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <NuxtLink
          to="/c/public-speaking-2026/stage"
          class="w-full sm:w-auto px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 shadow-md transition"
        >
          📺 Demo Layar Proyektor TV
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="w-full sm:w-auto px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition"
        >
          👨‍🏫 Masuk / Daftar Sebagai Guru
        </NuxtLink>
      </div>

      <!-- Multi-Teacher / Multi-Class Features -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span class="text-3xl mb-3 block">🏫</span>
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Banyak Guru & Banyak Kelas</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Setiap guru bebas mendaftar dan membuat kelas sebanyak mungkin (Kelas 10-A, 10-B, Tahfidz, dll). Data antar kelas dan guru terpisah rapi.
          </p>
        </div>

        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span class="text-3xl mb-3 block">🔄</span>
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Multi-Putaran & Carry-Over</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Setelah murid terakhir maju, sistem dapat langsung mengulang putaran baru. Siswa yang sakit/izin otomatis menjadi pembicara #1 di putaran berikutnya.
          </p>
        </div>

        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span class="text-3xl mb-3 block">🔗</span>
          <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">Link Publik Khusus Murid</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Format tautan unik <code class="text-indigo-600 dark:text-indigo-400">/c/:slug</code> untuk setiap kelas. Murid tidak perlu registrasi/login sama sekali.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-5xl mx-auto w-full pt-8 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
      Motivational Show Daily Schedule Tracker • Nuxt 3 & PostgreSQL (Neon) • Multi-Teacher & Multi-Class Architecture
    </footer>
  </div>
</template>

<script setup lang="ts">
const inputSlug = ref('')

const goToClass = () => {
  const slug = inputSlug.value.trim().toLowerCase().replace(/^\/c\//, '')
  if (!slug) {
    navigateTo('/c/public-speaking-2026')
  } else {
    navigateTo(`/c/${slug}`)
  }
}
</script>
