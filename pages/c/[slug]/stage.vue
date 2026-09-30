<template>
  <div class="min-h-screen bg-[#07090e] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none font-sans">
    <!-- Ambient glowing stadium lights -->
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="absolute -bottom-40 right-10 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- Top Navigation Bar (Header) -->
    <header class="relative z-10 flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <NuxtLink
          :to="`/c/${slug}`"
          class="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-sm font-semibold backdrop-blur-md"
          title="Kembali ke Portal Jadwal"
        >
          <ArrowLeft class="w-5 h-5" />
          <span class="hidden sm:inline">Kembali</span>
        </NuxtLink>

        <div>
          <h1 class="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2.5">
            <Sparkles class="w-6 h-6 text-indigo-400 shrink-0" />
            <span>{{ data?.class?.name || 'Motivational Show' }}</span>
          </h1>
          <p class="text-xs sm:text-sm text-indigo-300/80 font-medium">
            Putaran #{{ currentSpeaker?.round || 1 }} • Sesi #{{ currentSpeaker?.sessionNumber || 1 }}
          </p>
        </div>
      </div>

      <!-- Controls: Fullscreen & Live Indicator -->
      <div class="flex items-center gap-3">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
          <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Layar Panggung</span>
        </div>

        <button
          type="button"
          @click="toggleFullscreen"
          class="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md"
          title="Layar Penuh (F11)"
        >
          <Maximize v-if="!isFullscreen" class="w-5 h-5" />
          <Minimize v-else class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Center Stage: Speaker Spotlight & Timer -->
    <main class="relative z-10 my-auto py-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      
      <!-- Left Column: Big Speaker Info -->
      <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
        <!-- Badges -->
        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
          <span class="px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            {{ currentSpeaker?.date === data?.todayDate ? 'Pembicara Hari Ini' : 'Sesi Aktif' }}
          </span>

          <span v-if="currentSpeaker?.isCarryOver" class="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
            <AlertCircle class="w-3.5 h-3.5" />
            Carry-Over Putaran #{{ currentSpeaker.carryOverFromRound || (currentSpeaker.round - 1) }}
          </span>

          <span class="text-xs font-mono text-slate-400">
            {{ currentSpeaker ? formatDateIndonesian(currentSpeaker.date, true) : '-' }}
          </span>
        </div>

        <!-- Speaker Name -->
        <div>
          <h2 class="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-white drop-shadow-lg leading-tight uppercase">
            {{ currentSpeaker?.student?.name || 'Semua Sesi Selesai' }}
          </h2>
        </div>

        <!-- Topic Card -->
        <div class="p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl max-w-xl mx-auto lg:mx-0">
          <p class="text-xs font-bold uppercase tracking-wider text-indigo-300/80 mb-2 flex items-center justify-center lg:justify-start gap-2">
            <BookOpen class="w-4 h-4 text-indigo-400" />
            Topik Pidato
          </p>
          <p class="text-xl sm:text-2xl font-bold font-display text-slate-100 italic">
            "{{ currentSpeaker?.topicTitle || 'Topik Bebas / Belum Ditentukan' }}"
          </p>
        </div>

        <!-- Next Up Banner -->
        <div v-if="nextSpeaker" class="pt-2 flex items-center justify-center lg:justify-start gap-3 text-xs sm:text-sm text-slate-400">
          <span class="uppercase tracking-wider font-semibold text-slate-500">Berikutnya:</span>
          <span class="font-bold text-slate-200">{{ nextSpeaker.student.name }}</span>
          <span class="text-slate-500">({{ formatDateIndonesian(nextSpeaker.date) }})</span>
        </div>
      </div>

      <!-- Right Column: Presentation Timer -->
      <div class="lg:col-span-5 flex flex-col items-center">
        <div class="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl text-center space-y-6 shadow-2xl">
          
          <div class="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span class="flex items-center gap-1.5">
              <Clock class="w-4 h-4 text-indigo-400" />
              Pengatur Waktu Pidato
            </span>
            <span>{{ isRunning ? 'Berjalan' : isPaused ? 'Jeda' : 'Siap' }}</span>
          </div>

          <!-- Digital Countdown Display -->
          <div
            :class="[
              'py-4 rounded-2xl transition-all duration-300 font-mono font-black text-6xl sm:text-7xl tracking-wider select-none',
              timeLeft <= 0 ? 'text-rose-500 animate-pulse bg-rose-500/10' :
              timeLeft <= 60 ? 'text-amber-400 animate-pulse bg-amber-500/10' :
              'text-white'
            ]"
          >
            {{ formattedTime }}
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-300 rounded-full"
              :class="timeLeft <= 0 ? 'bg-rose-500' : timeLeft <= 60 ? 'bg-amber-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500'"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>

          <!-- Presets (3m, 5m, 7m, 10m) -->
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="min in [3, 5, 7, 10]"
              :key="min"
              type="button"
              @click="setDuration(min * 60)"
              :class="[
                'py-2 px-1 rounded-xl text-xs font-bold transition-all border',
                targetDuration === min * 60 && !isRunning
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              ]"
            >
              {{ min }} Menit
            </button>
          </div>

          <!-- Timer Actions: Play/Pause, Reset, +30s -->
          <div class="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              @click="resetTimer"
              class="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              title="Atur Ulang"
            >
              <RotateCcw class="w-5 h-5" />
            </button>

            <button
              type="button"
              @click="toggleTimer"
              :class="[
                'flex-1 py-3.5 px-6 rounded-2xl font-bold font-display text-base transition-all flex items-center justify-center gap-2 shadow-xl',
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
              ]"
            >
              <Pause v-if="isRunning" class="w-5 h-5" />
              <Play v-else class="w-5 h-5" />
              <span>{{ isRunning ? 'Jeda' : 'Mulai Bicara' }}</span>
            </button>

            <button
              type="button"
              @click="addSeconds(30)"
              class="px-3.5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all"
              title="Tambah 30 Detik"
            >
              +30d
            </button>
          </div>

        </div>
      </div>
    </main>

    <!-- Bottom Stage Footer -->
    <footer class="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-4">
      <div>
        Tekan <kbd class="px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">F11</kbd> untuk Layar Penuh • Dirancang untuk Proyektor Kelas
      </div>
      <div>
        Motivational Show Tracker &copy; {{ new Date().getFullYear() }}
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft, Sparkles, AlertCircle, BookOpen, Clock,
  Play, Pause, RotateCcw, Maximize, Minimize
} from 'lucide-vue-next'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { formatDateIndonesian } = useFormatters()

// Fetch Class Data
const { data } = await useFetch<any>(() => `/api/public/${slug.value}`)

// Current speaker & next speaker
const currentSpeaker = computed(() => {
  if (!data.value) return null
  if (data.value.todayEntry) return data.value.todayEntry
  const next = data.value.fullSchedule?.find((s: any) => s.status === 'scheduled')
  return next || data.value.fullSchedule?.[0] || null
})

const nextSpeaker = computed(() => {
  if (!data.value?.fullSchedule || !currentSpeaker.value) return null
  const currentIdx = data.value.fullSchedule.findIndex((s: any) => s.id === currentSpeaker.value.id)
  if (currentIdx !== -1 && currentIdx + 1 < data.value.fullSchedule.length) {
    return data.value.fullSchedule[currentIdx + 1]
  }
  return null
})

// Presentation Timer State
const targetDuration = ref(5 * 60) // 5 minutes default
const timeLeft = ref(5 * 60)
const isRunning = ref(false)
const isPaused = ref(false)
let timerInterval: any = null

const formattedTime = computed(() => {
  const abs = Math.abs(timeLeft.value)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  const prefix = timeLeft.value < 0 ? '-' : ''
  return `${prefix}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progressPercent = computed(() => {
  if (targetDuration.value <= 0) return 0
  const pct = (timeLeft.value / targetDuration.value) * 100
  return Math.max(0, Math.min(100, pct))
})

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 tone
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.6)
  } catch (e) {
    // Audio context not allowed or failed
  }
}

const toggleTimer = () => {
  if (isRunning.value) {
    clearInterval(timerInterval)
    isRunning.value = false
    isPaused.value = true
  } else {
    isRunning.value = true
    isPaused.value = false
    timerInterval = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value === 0) {
        playBeep()
      }
    }, 1000)
  }
}

const setDuration = (secs: number) => {
  clearInterval(timerInterval)
  isRunning.value = false
  isPaused.value = false
  targetDuration.value = secs
  timeLeft.value = secs
}

const resetTimer = () => {
  clearInterval(timerInterval)
  isRunning.value = false
  isPaused.value = false
  timeLeft.value = targetDuration.value
}

const addSeconds = (secs: number) => {
  timeLeft.value += secs
}

// Fullscreen Handling
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(() => {})
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(() => {})
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = Boolean(document.fullscreenElement)
  })
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

useHead({
  title: computed(() => currentSpeaker.value?.student?.name ? `${currentSpeaker.value.student.name} - Layar TV Panggung` : 'Layar Panggung TV')
})
</script>
