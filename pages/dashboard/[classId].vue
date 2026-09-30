<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors pb-24">
    <!-- Ambient glowing backgrounds -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none"></div>

    <!-- Header Bar -->
    <header class="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-[#0b0f19]/80 border-b border-slate-200/80 dark:border-slate-800/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <NuxtLink
            to="/dashboard"
            class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
            title="Kembali ke Daftar Kelas"
          >
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>

          <div class="min-w-0">
            <h1 class="text-base sm:text-lg font-bold font-display truncate text-slate-900 dark:text-white flex items-center gap-2">
              <span>{{ classData?.name || 'Ruang Kontrol Guru' }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-semibold shrink-0">
                Putaran #{{ classData?.currentRound || 1 }}
              </span>
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
              Motivational Show Control Room
            </p>
          </div>
        </div>

        <!-- Quick Actions & Theme -->
        <div class="flex items-center gap-2">
          <!-- Copy Student Link -->
          <button
            type="button"
            @click="copyStudentLink"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-all shadow-sm"
            title="Salin Tautan Portal Siswa"
          >
            <Copy class="w-3.5 h-3.5 text-indigo-500" />
            <span>{{ isCopied ? 'Tersalin!' : 'Link Siswa' }}</span>
          </button>

          <!-- Stage Mode Button -->
          <NuxtLink
            v-if="classData?.slug"
            :to="`/c/${classData.slug}/stage`"
            target="_blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            title="Buka Layar Proyektor TV di Tab Baru"
          >
            <Tv class="w-3.5 h-3.5" />
            <span class="hidden md:inline">Layar TV Kelas</span>
          </NuxtLink>

          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      <!-- Stats Strip -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p class="text-[11px] font-semibold uppercase text-slate-400">Total Siswa Aktif</p>
          <p class="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1">{{ stats?.totalStudents || 0 }}</p>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p class="text-[11px] font-semibold uppercase text-slate-400">Selesai Berpidato</p>
          <p class="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
            {{ stats?.completedCount || 0 }} <span class="text-xs text-slate-400 font-normal">/ {{ stats?.totalSessions || 0 }}</span>
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p class="text-[11px] font-semibold uppercase text-slate-400">Sesi Tertunda</p>
          <p class="text-2xl font-bold font-display text-amber-500 mt-1">{{ stats?.postponedCount || 0 }}</p>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p class="text-[11px] font-semibold uppercase text-slate-400">Progres Putaran Ini</p>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold font-display text-indigo-600 dark:text-indigo-400">
              {{ stats?.totalSessions ? Math.round((stats.completedCount / stats.totalSessions) * 100) : 0 }}%
            </span>
            <span class="text-xs text-slate-400 font-mono">Putaran #{{ stats?.currentRound || 1 }}</span>
          </div>
        </div>
      </section>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          type="button"
          @click="activeTab = 'today'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap',
            activeTab === 'today'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <Sparkles class="w-4 h-4" />
          <span>Hari Ini & Penilaian Langsung</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'schedule'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap',
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <Calendar class="w-4 h-4" />
          <span>Jadwal Lengkap & Manajemen</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'students'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap',
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <Users class="w-4 h-4" />
          <span>Daftar Siswa ({{ studentsList.length }})</span>
        </button>
      </div>

      <!-- TAB 1: TODAY & LIVE RUBRIC -->
      <section v-if="activeTab === 'today'" class="space-y-6">
        
        <!-- Active Speaker Hero Card -->
        <div class="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {{ activeSpeaker?.date === data?.todayDate ? 'Giliran Hari Ini' : 'Sesi Terdekat' }}
                </span>
                <span v-if="activeSpeaker?.isCarryOver" class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  ⚠️ Carry-Over Putaran #{{ activeSpeaker.carryOverFromRound || (activeSpeaker.round - 1) }}
                </span>
                <span class="text-xs text-indigo-200/70 font-mono">
                  Sesi #{{ activeSpeaker?.sessionNumber }} • Putaran {{ activeSpeaker?.round }}
                </span>
              </div>

              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  {{ activeSpeaker ? formatDateIndonesian(activeSpeaker.date, true) : 'Tidak ada sesi' }}
                </p>
                <h2 class="text-3xl sm:text-4xl font-black font-display text-white mt-1">
                  {{ activeSpeaker?.student?.name || 'Semua Sesi Selesai' }}
                </h2>
              </div>

              <div class="flex items-center gap-2 text-sm text-slate-300">
                <BookOpen class="w-4 h-4 text-indigo-400 shrink-0" />
                <span class="italic font-medium">
                  "{{ activeSpeaker?.topicTitle || 'Belum menentukan judul topik pidato' }}"
                </span>
              </div>
            </div>

            <!-- Speaker Action Buttons -->
            <div v-if="activeSpeaker" class="flex flex-wrap md:flex-col gap-2 shrink-0">
              <button
                v-if="activeSpeaker.status !== 'completed'"
                type="button"
                @click="openAssessment(activeSpeaker)"
                class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Beri Nilai & Selesaikan</span>
              </button>

              <button
                v-else
                type="button"
                @click="revertSchedule(activeSpeaker.id)"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw class="w-3.5 h-3.5 text-amber-400" />
                <span>Batalkan Selesai</span>
              </button>

              <button
                type="button"
                @click="openPostponeModal(activeSpeaker)"
                class="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Clock class="w-3.5 h-3.5" />
                <span>Tunda Sesi Ini</span>
              </button>
            </div>
          </div>
        </div>

        <!-- LIVE SCORING RUBRIC FORM -->
        <div v-if="activeSpeaker" class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 class="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Award class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Rubrik Penilaian Pidato Langsung
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Nilai penampilan {{ activeSpeaker.student?.name }} secara langsung saat pidato berlangsung
              </p>
            </div>

            <!-- Average Badge -->
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Total Nilai Rata-Rata</span>
              <div class="flex items-center gap-2 justify-end">
                <span class="text-2xl sm:text-3xl font-black font-display text-indigo-600 dark:text-indigo-400">
                  {{ calculatedAverage }}
                </span>
                <span class="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                  {{ scoreGrade }}
                </span>
              </div>
            </div>
          </div>

          <!-- 4 Rubric Sliders -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 1. Fluency -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>1. Kelancaran & Artikulasi (0-100)</span>
                <span class="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono">{{ scoreFluency }}</span>
              </div>
              <input
                v-model.number="scoreFluency"
                type="range"
                min="0"
                max="100"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <p class="text-[11px] text-slate-400">Kejelasan pengucapan kata, intonasi, dan minim jeda berlebih ("umm/err").</p>
            </div>

            <!-- 2. Content -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>2. Struktur & Bobot Materi (0-100)</span>
                <span class="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono">{{ scoreContent }}</span>
              </div>
              <input
                v-model.number="scoreContent"
                type="range"
                min="0"
                max="100"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <p class="text-[11px] text-slate-400">Pembuka memikat, isi runtut logis, dan pesan/kesimpulan yang kuat.</p>
            </div>

            <!-- 3. Delivery -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>3. Bahasa Tubuh & Kontak Mata (0-100)</span>
                <span class="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono">{{ scoreDelivery }}</span>
              </div>
              <input
                v-model.number="scoreDelivery"
                type="range"
                min="0"
                max="100"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <p class="text-[11px] text-slate-400">Postur percaya diri, kontak mata merata ke audiens, dan ekspresi wajah.</p>
            </div>

            <!-- 4. Time -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>4. Manajemen Waktu Pidato (0-100)</span>
                <span class="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono">{{ scoreTime }}</span>
              </div>
              <input
                v-model.number="scoreTime"
                type="range"
                min="0"
                max="100"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <p class="text-[11px] text-slate-400">Kesesuaian durasi bicara dengan target (tidak terlalu singkat/melebihi batas).</p>
            </div>
          </div>

          <!-- Feedback & Duration Inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">Durasi Bicara (Detik)</label>
              <input
                v-model.number="durationSeconds"
                type="number"
                placeholder="300 (5 menit)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">Catatan & Masukan Guru</label>
              <input
                v-model="feedbackText"
                type="text"
                placeholder="Contoh: Sangat baik dalam bercerita, perlu ditingkatkan volume suara di akhir kalimat."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              :disabled="isSavingAssessment"
              @click="saveAssessment"
              class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              <Loader2 v-if="isSavingAssessment" class="w-4 h-4 animate-spin" />
              <CheckCircle2 v-else class="w-4 h-4" />
              <span>Simpan Nilai & Tandai Selesai</span>
            </button>
          </div>
        </div>
      </section>

      <!-- TAB 2: FULL SCHEDULE & SMART ACTIONS -->
      <section v-if="activeTab === 'schedule'" class="space-y-4">
        
        <!-- Action Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Filter Status -->
            <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                @click="scheduleFilter = 'all'"
                :class="['px-3 py-1.5 rounded-lg transition-all', scheduleFilter === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : '']"
              >
                Semua
              </button>
              <button
                type="button"
                @click="scheduleFilter = 'upcoming'"
                :class="['px-3 py-1.5 rounded-lg transition-all', scheduleFilter === 'upcoming' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : '']"
              >
                Akan Datang
              </button>
              <button
                type="button"
                @click="scheduleFilter = 'completed'"
                :class="['px-3 py-1.5 rounded-lg transition-all', scheduleFilter === 'completed' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : '']"
              >
                Selesai
              </button>
            </div>

            <!-- Round selector -->
            <select
              v-if="availableRounds.length > 1"
              v-model="scheduleRound"
              class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Semua Putaran</option>
              <option v-for="r in availableRounds" :key="r" :value="r">Putaran #{{ r }}</option>
            </select>
          </div>

          <!-- Next Round Button -->
          <button
            type="button"
            @click="openNextRoundModal"
            class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/20 active:scale-95 transition-all"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Mulai Putaran Baru (#{{ (stats?.currentRound || 1) + 1 }})</span>
          </button>
        </div>

        <!-- Schedule Items -->
        <div class="space-y-3">
          <div
            v-for="(item, idx) in filteredSchedules"
            :key="item.id"
            :class="[
              'p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4',
              item.date === data?.todayDate
                ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-400/40'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'
            ]"
          >
            <!-- Left Info -->
            <div class="flex items-start sm:items-center gap-4 min-w-0">
              <!-- Reorder Up/Down arrows -->
              <div v-if="item.status !== 'completed'" class="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  @click="moveSchedule(item.id, 'up')"
                  class="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 text-xs"
                  title="Geser Naik"
                >
                  <ChevronUp class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="moveSchedule(item.id, 'down')"
                  class="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 text-xs"
                  title="Geser Turun"
                >
                  <ChevronDown class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Date Box -->
              <div class="shrink-0 text-center w-14 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span class="block text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  {{ getDayName(item.date).slice(0, 3) }}
                </span>
                <span class="block text-lg font-black font-display text-slate-900 dark:text-white leading-tight">
                  {{ item.date.split('-')[2] }}
                </span>
                <span class="block text-[10px] text-slate-400">
                  {{ item.date.split('-')[1] }}/{{ item.date.split('-')[0].slice(2) }}
                </span>
              </div>

              <!-- Student and Topic details -->
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-mono font-semibold text-slate-400">#{{ item.sessionNumber }}</span>
                  <span v-if="item.round > 1" class="text-[10px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-semibold">
                    Putaran {{ item.round }}
                  </span>
                  <span v-if="item.isCarryOver" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                    <AlertCircle class="w-3 h-3" />
                    Carry-over Putaran #{{ item.carryOverFromRound || (item.round - 1) }}
                  </span>
                  <span v-if="item.assessment" class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    Nilai: {{ Math.round((item.assessment.scoreFluency + item.assessment.scoreContent + item.assessment.scoreDelivery + item.assessment.scoreTime) / 4) }}
                  </span>
                </div>

                <h4 class="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  {{ item.student.name }}
                </h4>

                <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <BookOpen class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span class="italic truncate">{{ item.topicTitle ? `"${item.topicTitle}"` : 'Topik belum ditentukan' }}</span>
                </p>

                <p v-if="item.note" class="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  Catatan: {{ item.note }}
                </p>
              </div>
            </div>

            <!-- Right Actions Toolbar -->
            <div class="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              <!-- Mark Done / Rubric -->
              <button
                v-if="item.status !== 'completed'"
                type="button"
                @click="openAssessment(item)"
                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 transition-all"
                title="Beri Nilai & Selesaikan"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>Nilai / Selesai</span>
              </button>

              <button
                v-else
                type="button"
                @click="revertSchedule(item.id)"
                class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:text-amber-600"
                title="Batalkan Selesai"
              >
                <RotateCcw class="w-3.5 h-3.5" />
              </button>

              <!-- Postpone Button -->
              <button
                v-if="item.status !== 'completed'"
                type="button"
                @click="openPostponeModal(item)"
                class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Tunda Sesi"
              >
                <Clock class="w-3.5 h-3.5 text-rose-500" />
                <span>Tunda</span>
              </button>

              <!-- Swap Button -->
              <button
                v-if="item.status !== 'completed'"
                type="button"
                @click="openSwapModal(item)"
                class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Tukar Jadwal dengan Siswa Lain"
              >
                <ArrowLeftRight class="w-3.5 h-3.5 text-indigo-500" />
                <span>Tukar</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 3: STUDENTS DIRECTORY -->
      <section v-if="activeTab === 'students'" class="space-y-4">
        <div class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div>
            <h3 class="font-bold font-display text-base text-slate-900 dark:text-white">Daftar Murid Kelas</h3>
            <p class="text-xs text-slate-500">Kelola daftar murid dan tambahkan siswa baru ke dalam siklus putaran</p>
          </div>

          <button
            type="button"
            @click="openAddStudentModal"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="(student, idx) in studentsList"
            :key="student.id"
            class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <span class="text-[10px] font-mono text-slate-400 block">#{{ idx + 1 }}</span>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">{{ student.name }}</h4>
              <p class="text-[11px] text-slate-500">{{ student.studentNumber || 'Tanpa NIS' }}</p>
            </div>

            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                student.active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-slate-100 text-slate-400'
              ]"
            >
              {{ student.active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
        </div>
      </section>
    </main>

    <!-- POSTPONE / CARRY-OVER MODAL -->
    <div
      v-if="showPostponeModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      @click.self="showPostponeModal = false"
    >
      <div class="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-bold font-display text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Clock class="w-5 h-5 text-rose-500" />
            Tunda Sesi Motivational Show
          </h3>
          <button @click="showPostponeModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
          <span class="text-slate-400 block">Siswa:</span>
          <span class="font-bold text-slate-900 dark:text-white text-sm">{{ selectedItem?.student?.name }}</span>
          <span class="text-slate-500 block mt-0.5">Jadwal: {{ formatDateIndonesian(selectedItem?.date) }}</span>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Aksi Penundaan:</label>

          <label class="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
            <input type="radio" value="end" v-model="postponeTarget" class="mt-1 accent-indigo-600" />
            <div>
              <span class="text-xs font-bold text-slate-900 dark:text-white block">Pindah ke Akhir Putaran Ini</span>
              <span class="text-[11px] text-slate-500 block">Siswa digeser ke antrian paling belakang di putaran aktif.</span>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
            <input type="radio" value="next" v-model="postponeTarget" class="mt-1 accent-indigo-600" />
            <div>
              <span class="text-xs font-bold text-slate-900 dark:text-white block">Tunda ke Sesi Berikutnya</span>
              <span class="text-[11px] text-slate-500 block">Mundur 1 hari pertemuan berikutnya.</span>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 cursor-pointer">
            <input type="radio" value="carry_over" v-model="postponeTarget" class="mt-1 accent-amber-600" />
            <div>
              <span class="text-xs font-bold text-amber-800 dark:text-amber-300 block">Carry-Over ke Putaran Berikutnya (Tunggakan)</span>
              <span class="text-[11px] text-amber-700 dark:text-amber-400 block">
                Menjadi Pembicara Prioritas #1 di awal putaran depan dengan lencana tunggakan.
              </span>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
            <input type="radio" value="skip" v-model="postponeTarget" class="mt-1 accent-indigo-600" />
            <div>
              <span class="text-xs font-bold text-slate-900 dark:text-white block">Lewati (Tandai Gugur di Putaran Ini)</span>
              <span class="text-[11px] text-slate-500 block">Siswa dilewati dan giliran langsung diteruskan ke siswa berikutnya.</span>
            </div>
          </label>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alasan Penundaan</label>
          <input
            v-model="postponeReason"
            type="text"
            placeholder="Izin / Sakit / Ada lomba"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showPostponeModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="isSubmittingAction"
            @click="submitPostpone"
            class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <Loader2 v-if="isSubmittingAction" class="w-3.5 h-3.5 animate-spin" />
            <span>Terapkan Penundaan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SWAP MODAL -->
    <div
      v-if="showSwapModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      @click.self="showSwapModal = false"
    >
      <div class="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-bold font-display text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight class="w-5 h-5 text-indigo-600" />
            Tukar Jadwal dengan Siswa Lain
          </h3>
          <button @click="showSwapModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div class="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
          <span class="text-indigo-600 dark:text-indigo-400 block font-semibold">Siswa Sumber:</span>
          <span class="font-bold text-slate-900 dark:text-white text-sm">{{ selectedItem?.student?.name }}</span>
          <span class="text-slate-500 block">Jadwal: {{ formatDateIndonesian(selectedItem?.date) }}</span>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Jadwal Sasaran Penukaran:</label>
          <select
            v-model="swapTargetScheduleId"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium"
          >
            <option value="" disabled>-- Pilih Siswa Lawan Tukar --</option>
            <option
              v-for="cand in eligibleSwapCandidates"
              :key="cand.id"
              :value="cand.id"
            >
              {{ cand.student.name }} ({{ formatDateIndonesian(cand.date) }} - Sesi #{{ cand.sessionNumber }})
            </option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showSwapModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="!swapTargetScheduleId || isSubmittingAction"
            @click="submitSwap"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <Loader2 v-if="isSubmittingAction" class="w-3.5 h-3.5 animate-spin" />
            <span>Tukar Jadwal Sekarang</span>
          </button>
        </div>
      </div>
    </div>

    <!-- NEXT ROUND CONFIRMATION MODAL -->
    <div
      v-if="showNextRoundModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      @click.self="showNextRoundModal = false"
    >
      <div class="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-bold font-display text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw class="w-5 h-5 text-violet-600" />
            Mulai Putaran Baru (#{{ (stats?.currentRound || 1) + 1 }})
          </h3>
          <button @click="showNextRoundModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-400">
          Sistem akan menjadwalkan ulang seluruh {{ studentsList.length }} siswa aktif secara otomatis pada hari kelas setelah sesi terakhir selesai.
        </p>

        <label class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
          <input type="checkbox" v-model="nextRoundShuffle" class="w-4 h-4 accent-indigo-600 rounded" />
          <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Acak urutan pembicara (Shuffle Random) untuk putaran baru
          </span>
        </label>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showNextRoundModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="isSubmittingAction"
            @click="submitNextRound"
            class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <Loader2 v-if="isSubmittingAction" class="w-3.5 h-3.5 animate-spin" />
            <span>Generate Putaran Baru</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ADD STUDENT MODAL -->
    <div
      v-if="showAddStudentModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      @click.self="showAddStudentModal = false"
    >
      <div class="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-bold font-display text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Plus class="w-5 h-5 text-indigo-600" />
            Tambah Siswa Baru
          </h3>
          <button @click="showAddStudentModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form @submit.prevent="submitAddStudent" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Siswa</label>
            <input
              v-model="newStudentName"
              type="text"
              required
              placeholder="Contoh: BIMA SAKTI"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Nomor Induk Siswa (Opsional)</label>
            <input
              v-model="newStudentNumber"
              type="text"
              placeholder="Contoh: 20261001"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono"
            />
          </div>

          <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
            <input type="checkbox" v-model="newStudentAddToSchedule" class="w-4 h-4 accent-indigo-600 rounded" />
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Langsung jadwalkan di akhir antrian putaran aktif
            </span>
          </label>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showAddStudentModal = false"
              class="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmittingAction"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2 v-if="isSubmittingAction" class="w-3.5 h-3.5 animate-spin" />
              <span>Simpan Siswa</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft, ArrowLeftRight, Award, BookOpen, Calendar, CheckCircle2,
  ChevronDown, ChevronUp, Clock, Copy, Plus, RotateCcw,
  Sparkles, Tv, Users, AlertCircle, Loader2
} from 'lucide-vue-next'
import confetti from 'canvas-confetti'

const route = useRoute()
const classId = computed(() => route.params.classId as string)

const { fetchUser } = useAuth()
const { formatDateIndonesian, getDayName } = useFormatters()

onMounted(async () => {
  const me = await fetchUser()
  if (!me) navigateTo('/login')
})

// Fetch Class Dashboard Data
const { data, refresh } = await useFetch<any>(() => `/api/classes/${classId.value}`)

const classData = computed(() => data.value?.class)
const stats = computed(() => data.value?.stats)
const fullSchedule = computed(() => data.value?.fullSchedule || [])
const studentsList = computed(() => data.value?.students || [])

// Tab State
const activeTab = ref<'today' | 'schedule' | 'students'>('today')

// Active / Today Speaker
const activeSpeaker = computed(() => {
  if (!data.value) return null
  if (data.value.todayEntry) return data.value.todayEntry
  const next = fullSchedule.value.find((s: any) => s.status === 'scheduled')
  return next || fullSchedule.value[0] || null
})

// Live Rubric State
const scoreFluency = ref(85)
const scoreContent = ref(85)
const scoreDelivery = ref(80)
const scoreTime = ref(90)
const durationSeconds = ref<number | undefined>(300)
const feedbackText = ref('')
const isSavingAssessment = ref(false)

const calculatedAverage = computed(() => {
  const sum = scoreFluency.value + scoreContent.value + scoreDelivery.value + scoreTime.value
  return Math.round(sum / 4)
})

const scoreGrade = computed(() => {
  const avg = calculatedAverage.value
  if (avg >= 90) return 'A (Sangat Baik)'
  if (avg >= 80) return 'B+ (Baik Sekali)'
  if (avg >= 70) return 'B (Baik)'
  if (avg >= 60) return 'C (Cukup)'
  return 'D (Perlu Bimbingan)'
})

const openAssessment = (scheduleItem: any) => {
  activeTab.value = 'today'
  if (scheduleItem.assessment) {
    scoreFluency.value = scheduleItem.assessment.scoreFluency
    scoreContent.value = scheduleItem.assessment.scoreContent
    scoreDelivery.value = scheduleItem.assessment.scoreDelivery
    scoreTime.value = scheduleItem.assessment.scoreTime
    durationSeconds.value = scheduleItem.assessment.durationSeconds || undefined
    feedbackText.value = scheduleItem.assessment.feedback || ''
  } else {
    scoreFluency.value = 85
    scoreContent.value = 85
    scoreDelivery.value = 85
    scoreTime.value = 85
    durationSeconds.value = undefined
    feedbackText.value = ''
  }
}

const saveAssessment = async () => {
  if (!activeSpeaker.value) return
  isSavingAssessment.value = true
  try {
    await $fetch(`/api/classes/${classId.value}/assessments`, {
      method: 'POST',
      body: {
        scheduleId: activeSpeaker.value.id,
        scoreFluency: scoreFluency.value,
        scoreContent: scoreContent.value,
        scoreDelivery: scoreDelivery.value,
        scoreTime: scoreTime.value,
        durationSeconds: durationSeconds.value,
        feedback: feedbackText.value
      }
    })

    // Confetti celebration!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch (e) {}

    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal menyimpan penilaian')
  } finally {
    isSavingAssessment.value = false
  }
}

// Revert schedule
const revertSchedule = async (scheduleId: string) => {
  if (!confirm('Kembalikan sesi ini ke status Belum Selesai?')) return
  try {
    await $fetch(`/api/classes/${classId.value}/schedule/${scheduleId}/revert`, { method: 'POST' })
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal mengubah status')
  }
}

// Schedule Tab Filters
const scheduleFilter = ref<'all' | 'upcoming' | 'completed'>('all')
const scheduleRound = ref<string | number>('all')

const availableRounds = computed(() => {
  const rounds = new Set<number>()
  fullSchedule.value.forEach((s: any) => rounds.add(s.round || 1))
  return Array.from(rounds).sort((a, b) => a - b)
})

const filteredSchedules = computed(() => {
  let list = [...fullSchedule.value]
  if (scheduleRound.value !== 'all') {
    list = list.filter((s: any) => s.round === Number(scheduleRound.value))
  }
  if (scheduleFilter.value === 'upcoming') {
    list = list.filter((s: any) => s.status === 'scheduled')
  } else if (scheduleFilter.value === 'completed') {
    list = list.filter((s: any) => s.status === 'completed')
  }
  return list
})

// Move Up / Down
const moveSchedule = async (scheduleId: string, direction: 'up' | 'down') => {
  try {
    await $fetch(`/api/classes/${classId.value}/schedule/move`, {
      method: 'POST',
      body: { scheduleId, direction }
    })
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal menggeser jadwal')
  }
}

// Postpone Modal State
const showPostponeModal = ref(false)
const selectedItem = ref<any>(null)
const postponeTarget = ref<'end' | 'next' | 'carry_over' | 'skip'>('end')
const postponeReason = ref('Izin / Sakit')
const isSubmittingAction = ref(false)

const openPostponeModal = (item: any) => {
  selectedItem.value = item
  postponeTarget.value = 'end'
  postponeReason.value = 'Izin / Sakit'
  showPostponeModal.value = true
}

const submitPostpone = async () => {
  if (!selectedItem.value) return
  isSubmittingAction.value = true
  try {
    await $fetch(`/api/classes/${classId.value}/schedule/${selectedItem.value.id}/postpone`, {
      method: 'POST',
      body: {
        target: postponeTarget.value,
        reason: postponeReason.value.trim()
      }
    })
    showPostponeModal.value = false
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal menunda sesi')
  } finally {
    isSubmittingAction.value = false
  }
}

// Swap Modal State
const showSwapModal = ref(false)
const swapTargetScheduleId = ref('')

const openSwapModal = (item: any) => {
  selectedItem.value = item
  swapTargetScheduleId.value = ''
  showSwapModal.value = true
}

const eligibleSwapCandidates = computed(() => {
  if (!selectedItem.value) return []
  return fullSchedule.value.filter((s: any) => s.id !== selectedItem.value.id && s.status !== 'completed')
})

const submitSwap = async () => {
  if (!selectedItem.value || !swapTargetScheduleId.value) return
  isSubmittingAction.value = true
  try {
    await $fetch(`/api/classes/${classId.value}/schedule/${selectedItem.value.id}/swap`, {
      method: 'POST',
      body: { targetScheduleId: swapTargetScheduleId.value }
    })
    showSwapModal.value = false
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal menukar jadwal')
  } finally {
    isSubmittingAction.value = false
  }
}

// Next Round Modal
const showNextRoundModal = ref(false)
const nextRoundShuffle = ref(false)

const openNextRoundModal = () => {
  nextRoundShuffle.value = false
  showNextRoundModal.value = true
}

const submitNextRound = async () => {
  isSubmittingAction.value = true
  try {
    await $fetch(`/api/classes/${classId.value}/schedule/next-round`, {
      method: 'POST',
      body: { shuffle: nextRoundShuffle.value }
    })
    showNextRoundModal.value = false
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal memulai putaran baru')
  } finally {
    isSubmittingAction.value = false
  }
}

// Add Student Modal
const showAddStudentModal = ref(false)
const newStudentName = ref('')
const newStudentNumber = ref('')
const newStudentAddToSchedule = ref(true)

const openAddStudentModal = () => {
  newStudentName.value = ''
  newStudentNumber.value = ''
  newStudentAddToSchedule.value = true
  showAddStudentModal.value = true
}

const submitAddStudent = async () => {
  if (!newStudentName.value.trim()) return
  isSubmittingAction.value = true
  try {
    await $fetch(`/api/classes/${classId.value}/students`, {
      method: 'POST',
      body: {
        name: newStudentName.value.trim(),
        studentNumber: newStudentNumber.value.trim() || undefined,
        addToSchedule: newStudentAddToSchedule.value
      }
    })
    showAddStudentModal.value = false
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal menambahkan siswa')
  } finally {
    isSubmittingAction.value = false
  }
}

// Copy Student Link
const isCopied = ref(false)
const copyStudentLink = () => {
  if (!classData.value?.slug) return
  const url = `${window.location.origin}/c/${classData.value.slug}`
  navigator.clipboard.writeText(url)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

useHead({
  title: computed(() => classData.value?.name ? `${classData.value.name} - Ruang Kontrol Guru` : 'Ruang Kontrol Guru')
})
</script>
