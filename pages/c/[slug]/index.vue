<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors pb-20">
    <!-- Ambient glowing backgrounds -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent blur-3xl pointer-events-none"></div>

    <!-- Navigation Header -->
    <header class="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-[#0b0f19]/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <NuxtLink to="/" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors" title="Beranda">
            <GraduationCap class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </NuxtLink>
          <div class="min-w-0">
            <h1 class="text-base sm:text-lg font-bold font-display truncate text-slate-900 dark:text-white">
              {{ data?.class?.name || 'Memuat Kelas...' }}
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Putaran #{{ data?.class?.currentRound || 1 }}</span>
              <span>•</span>
              <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Portal Siswa
              </span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- TV / Stage Mode Button -->
          <NuxtLink
            :to="`/c/${slug}/stage`"
            class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-sm"
          >
            <Tv class="w-4 h-4" />
            <span>Layar TV / Panggung</span>
          </NuxtLink>

          <!-- Theme Toggle -->
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="pending" class="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
      <Loader2 class="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
      <p class="text-slate-500 dark:text-slate-400 font-medium text-sm">Menyiapkan jadwal kelas...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-xl mx-auto px-4 py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
        <AlertTriangle class="w-8 h-8" />
      </div>
      <h2 class="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">Kelas Tidak Ditemukan</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Tautan yang Anda tuju mungkin salah atau kelas belum didaftarkan oleh guru.
      </p>
      <NuxtLink to="/" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors">
        Kembali ke Beranda
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <main v-else class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      
      <!-- HERO: Featured Active / Today Speaker -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 text-white p-6 sm:p-10 shadow-2xl shadow-indigo-950/30 border border-indigo-800/40">
        <!-- Glows -->
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-4 max-w-2xl">
            <!-- Header Badge -->
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 backdrop-blur-md">
                <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
                {{ featuredEntry?.date === data?.todayDate ? 'Pembicara Hari Ini' : 'Sesi Terdekat' }}
              </span>

              <span v-if="featuredEntry?.isCarryOver" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                <AlertCircle class="w-3.5 h-3.5" />
                Carry-Over Putaran #{{ featuredEntry.carryOverFromRound || (featuredEntry.round - 1) }}
              </span>

              <span class="text-xs text-indigo-200/80 font-mono">
                Sesi #{{ featuredEntry?.sessionNumber }} • Putaran {{ featuredEntry?.round }}
              </span>
            </div>

            <!-- Speaker Name -->
            <div>
              <p class="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-1">
                {{ featuredEntry ? formatDateIndonesian(featuredEntry.date, true) : 'Tidak ada jadwal terdekat' }}
              </p>
              <h2 class="text-3xl sm:text-5xl font-black font-display tracking-tight text-white drop-shadow-sm">
                {{ featuredEntry?.student?.name || 'Semua Sesi Selesai' }}
              </h2>
            </div>

            <!-- Topic Display / Propose Button -->
            <div v-if="featuredEntry" class="pt-1 flex flex-wrap items-center gap-3">
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-slate-100 text-sm">
                <BookOpen class="w-4 h-4 text-indigo-300 shrink-0" />
                <span class="font-medium italic">
                  "{{ featuredEntry.topicTitle || 'Belum menentukan judul topik pidato' }}"
                </span>
              </div>
              <button
                type="button"
                @click="openTopicModal(featuredEntry)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/30 text-indigo-200 text-xs font-semibold transition-colors"
              >
                <Edit3 class="w-3.5 h-3.5" />
                {{ featuredEntry.topicTitle ? 'Ubah Topik' : 'Ajukan Topik' }}
              </button>
            </div>
          </div>

          <!-- Quick Stats Box on Right -->
          <div class="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 sm:min-w-[260px]">
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/70">Total Siswa</p>
              <p class="text-2xl font-bold font-display text-white mt-1">{{ data?.stats?.totalStudents || 0 }}</p>
            </div>
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/70">Selesai</p>
              <p class="text-2xl font-bold font-display text-emerald-400 mt-1">
                {{ data?.stats?.completedCount || 0 }} <span class="text-xs font-normal text-indigo-200/60">/ {{ data?.stats?.totalSessions || 0 }}</span>
              </p>
            </div>
            <div class="col-span-2 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-center">
              <NuxtLink
                :to="`/c/${slug}/stage`"
                class="inline-flex items-center justify-center gap-2 w-full text-xs font-bold text-indigo-200 hover:text-white transition-colors"
              >
                <Tv class="w-4 h-4 text-indigo-400" />
                Tampilkan di Proyektor / TV Kelas &rarr;
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- SEARCH BAR: Cari Giliran Saya -->
      <section class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Search class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Cari Giliran Bicara Saya
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Ketik nama Anda untuk mengetahui tanggal giliran dan mengajukan judul topik
            </p>
          </div>

          <!-- Search Input -->
          <div class="relative sm:w-80">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Ketik nama siswa..."
              class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Search Results (When Typing) -->
        <div v-if="searchQuery.trim()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 shadow-md shadow-indigo-500/5 space-y-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  Sesi #{{ item.sessionNumber }} • Putaran {{ item.round }}
                </span>
                <h4 class="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                  {{ item.student.name }}
                </h4>
              </div>
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[11px] font-bold',
                  item.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                  item.status === 'postponed' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                ]"
              >
                {{ item.status === 'completed' ? 'Selesai' : item.status === 'postponed' ? 'Ditunda' : 'Dijadwalkan' }}
              </span>
            </div>

            <div class="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div class="flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span class="font-medium text-slate-900 dark:text-white">{{ formatDateIndonesian(item.date, true) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{{ item.relativeDate?.label || 'Jadwal mendatang' }}</span>
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <p class="text-[10px] uppercase font-semibold text-slate-400">Topik Pidato:</p>
              <p class="font-medium text-slate-800 dark:text-slate-200 italic mt-0.5">
                {{ item.topicTitle ? `"${item.topicTitle}"` : 'Belum diisi' }}
              </p>
            </div>

            <button
              type="button"
              @click="openTopicModal(item)"
              class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit3 class="w-3.5 h-3.5" />
              {{ item.topicTitle ? 'Ubah Judul Topik' : 'Ajukan Topik Pidato' }}
            </button>
          </div>

          <div v-if="searchResults.length === 0" class="col-span-full py-8 text-center text-slate-400">
            Tidak ada siswa dengan nama "{{ searchQuery }}"
          </div>
        </div>
      </section>

      <!-- TIMELINE / FULL SCHEDULE -->
      <section class="space-y-4">
        <!-- Filter Tabs -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-bold font-display text-slate-900 dark:text-white">
              Daftar Jadwal Lengkap
            </h3>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              {{ filteredSchedules.length }} Sesi
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Filter Status -->
            <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                @click="statusFilter = 'all'"
                :class="['px-3 py-1.5 rounded-lg transition-all', statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'hover:text-slate-900 dark:hover:text-white']"
              >
                Semua
              </button>
              <button
                type="button"
                @click="statusFilter = 'upcoming'"
                :class="['px-3 py-1.5 rounded-lg transition-all', statusFilter === 'upcoming' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'hover:text-slate-900 dark:hover:text-white']"
              >
                Akan Datang
              </button>
              <button
                type="button"
                @click="statusFilter = 'completed'"
                :class="['px-3 py-1.5 rounded-lg transition-all', statusFilter === 'completed' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'hover:text-slate-900 dark:hover:text-white']"
              >
                Selesai
              </button>
            </div>

            <!-- Round Selector if multiple rounds -->
            <select
              v-if="availableRounds.length > 1"
              v-model="selectedRound"
              class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Semua Putaran</option>
              <option v-for="r in availableRounds" :key="r" :value="r">
                Putaran #{{ r }}
              </option>
            </select>
          </div>
        </div>

        <!-- Schedule List -->
        <div class="space-y-3">
          <div
            v-for="(item, idx) in filteredSchedules"
            :key="item.id"
            :class="[
              'p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
              item.date === data?.todayDate
                ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-400/40'
                : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
            ]"
          >
            <!-- Left Info: Date & Speaker -->
            <div class="flex items-start sm:items-center gap-4 min-w-0">
              <!-- Date Badge -->
              <div class="shrink-0 text-center w-14 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {{ getDayName(item.date).slice(0, 3) }}
                </span>
                <span class="block text-lg font-black font-display text-slate-900 dark:text-white leading-tight">
                  {{ item.date.split('-')[2] }}
                </span>
                <span class="block text-[10px] text-slate-400">
                  {{ item.date.split('-')[1] }}/{{ item.date.split('-')[0].slice(2) }}
                </span>
              </div>

              <!-- Speaker & Topic -->
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-mono font-semibold text-slate-400">
                    #{{ item.sessionNumber }}
                  </span>
                  <span v-if="item.round > 1" class="text-[11px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 font-semibold">
                    Putaran {{ item.round }}
                  </span>
                  <span v-if="item.isCarryOver" class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                    <AlertCircle class="w-3 h-3" />
                    Carry-over Putaran #{{ item.carryOverFromRound || (item.round - 1) }}
                  </span>
                  <span v-if="item.date === data?.todayDate" class="text-[11px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold animate-pulse">
                    Hari Ini
                  </span>
                </div>

                <h4 class="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  {{ item.student.name }}
                </h4>

                <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span class="italic truncate">
                    {{ item.topicTitle ? `"${item.topicTitle}"` : 'Belum menentukan judul topik' }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Right Actions & Badges -->
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  item.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                  item.status === 'postponed' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                ]"
              >
                {{ item.status === 'completed' ? '✓ Selesai' : item.status === 'postponed' ? 'Ditunda' : 'Dijadwalkan' }}
              </span>

              <!-- Topic Proposal Button -->
              <button
                type="button"
                @click="openTopicModal(item)"
                class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="Ajukan atau ubah judul topik pidato"
              >
                <Edit3 class="w-3.5 h-3.5 text-indigo-500" />
                <span class="hidden sm:inline">Topik</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- TOPIC PROPOSAL MODAL -->
    <div
      v-if="topicModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      @click.self="topicModalOpen = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <BookOpen class="w-5 h-5" />
            <h3 class="font-bold font-display text-lg text-slate-900 dark:text-white">Ajukan Judul Topik Pidato</h3>
          </div>
          <button @click="topicModalOpen = false" class="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
          <p class="font-bold text-slate-900 dark:text-white text-sm">{{ selectedScheduleItem?.student?.name }}</p>
          <p class="text-slate-500 dark:text-slate-400">
            Jadwal: {{ formatDateIndonesian(selectedScheduleItem?.date, true) }} (Sesi #{{ selectedScheduleItem?.sessionNumber }})
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
            Judul Topik Pidato (Minimal 3 Karakter)
          </label>
          <input
            v-model="inputTopic"
            type="text"
            placeholder="Contoh: Manfaat Disiplin Waktu Bagi Pelajar"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxlength="200"
            @keyup.enter="submitTopic"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="topicModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="isSubmittingTopic || !inputTopic.trim()"
            @click="submitTopic"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Loader2 v-if="isSubmittingTopic" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingTopic ? 'Menyimpan...' : 'Simpan Topik' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  GraduationCap, Tv, Sparkles, AlertCircle, BookOpen, Edit3,
  Search, Calendar, Clock, AlertTriangle, Loader2
} from 'lucide-vue-next'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { formatDateIndonesian, getDayName } = useFormatters()

// Fetch Class Public Data
const { data, pending, error, refresh } = await useFetch<any>(() => `/api/public/${slug.value}`)

// Featured speaker (today speaker, or next upcoming speaker)
const featuredEntry = computed(() => {
  if (!data.value) return null
  if (data.value.todayEntry) return data.value.todayEntry
  // Find first scheduled item
  const next = data.value.fullSchedule?.find((s: any) => s.status === 'scheduled')
  return next || data.value.fullSchedule?.[0] || null
})

// Search
const searchQuery = ref('')
const searchResults = computed(() => {
  if (!data.value?.fullSchedule || !searchQuery.value.trim()) return []
  const q = searchQuery.value.toLowerCase().trim()
  return data.value.fullSchedule.filter((item: any) =>
    item.student?.name?.toLowerCase().includes(q)
  )
})

// Timeline Filters
const statusFilter = ref<'all' | 'upcoming' | 'completed'>('all')
const selectedRound = ref<string | number>('all')

const availableRounds = computed(() => {
  if (!data.value?.fullSchedule) return []
  const rounds = new Set<number>()
  data.value.fullSchedule.forEach((s: any) => rounds.add(s.round || 1))
  return Array.from(rounds).sort((a, b) => a - b)
})

const filteredSchedules = computed(() => {
  if (!data.value?.fullSchedule) return []
  let list = [...data.value.fullSchedule]

  if (selectedRound.value !== 'all') {
    list = list.filter((s: any) => s.round === Number(selectedRound.value))
  }

  if (statusFilter.value === 'upcoming') {
    list = list.filter((s: any) => s.status === 'scheduled')
  } else if (statusFilter.value === 'completed') {
    list = list.filter((s: any) => s.status === 'completed')
  }

  return list
})

// Topic Proposal Modal
const topicModalOpen = ref(false)
const selectedScheduleItem = ref<any>(null)
const inputTopic = ref('')
const isSubmittingTopic = ref(false)

const openTopicModal = (item: any) => {
  selectedScheduleItem.value = item
  inputTopic.value = item.topicTitle || ''
  topicModalOpen.value = true
}

const submitTopic = async () => {
  if (!selectedScheduleItem.value || !inputTopic.value.trim()) return
  isSubmittingTopic.value = true
  try {
    await $fetch(`/api/public/${slug.value}/topic`, {
      method: 'POST',
      body: {
        scheduleId: selectedScheduleItem.value.id,
        topicTitle: inputTopic.value.trim()
      }
    })
    topicModalOpen.value = false
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal menyimpan topik')
  } finally {
    isSubmittingTopic.value = false
  }
}

useHead({
  title: computed(() => data.value?.class?.name ? `${data.value.class.name} - Jadwal Siswa` : 'Jadwal Motivational Show')
})
</script>
