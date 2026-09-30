<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors pb-20">
    <!-- Top Header -->
    <header class="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-[#0b0f19]/80 border-b border-slate-200/80 dark:border-slate-800/80">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <LayoutDashboard class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
              Dashboard Pengajar
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-none">
              {{ user?.name || user?.email || 'Memuat...' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            @click="logout"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 transition-all"
            title="Keluar"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <!-- Top Actions Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Daftar Kelas Saya
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Pilih kelas untuk mengelola jadwal, penilaian, dan murid
          </p>
        </div>

        <button
          type="button"
          @click="openCreateModal"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Buat Kelas Baru</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="py-20 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
        <p class="text-sm text-slate-500">Memuat daftar kelas...</p>
      </div>

      <!-- Classes Grid -->
      <div v-else-if="classesList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="cls in classesList"
          :key="cls.id"
          class="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all flex flex-col justify-between gap-6 group"
        >
          <div class="space-y-4">
            <div class="flex items-start justify-between gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                Putaran #{{ cls.currentRound }}
              </span>
              <button
                type="button"
                @click="copyStudentLink(cls.slug)"
                class="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                title="Salin tautan portal murid"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>{{ copiedSlug === cls.slug ? 'Tersalin!' : 'Link Siswa' }}</span>
              </button>
            </div>

            <div>
              <h3 class="text-xl font-bold font-display text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {{ cls.name }}
              </h3>
              <p class="text-xs text-slate-400 font-mono mt-1">/c/{{ cls.slug }}</p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3 pt-2">
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span class="text-[10px] font-semibold uppercase text-slate-400 block">Total Murid</span>
                <span class="text-lg font-bold font-display text-slate-900 dark:text-white">{{ cls.studentCount || 0 }}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span class="text-[10px] font-semibold uppercase text-slate-400 block">Selesai</span>
                <span class="text-lg font-bold font-display text-emerald-600 dark:text-emerald-400">
                  {{ cls.completedCount || 0 }} <span class="text-xs font-normal text-slate-400">/ {{ cls.scheduleCount || 0 }}</span>
                </span>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="space-y-1">
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  class="bg-indigo-600 h-full rounded-full transition-all"
                  :style="{ width: `${cls.scheduleCount ? Math.round((cls.completedCount / cls.scheduleCount) * 100) : 0}%` }"
                ></div>
              </div>
              <p class="text-[11px] text-right text-slate-400 font-medium">
                {{ cls.scheduleCount ? Math.round((cls.completedCount / cls.scheduleCount) * 100) : 0 }}% Selesai
              </p>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <NuxtLink
              :to="`/dashboard/${cls.id}`"
              class="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ruang Kontrol Guru</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </NuxtLink>

            <NuxtLink
              :to="`/c/${cls.slug}/stage`"
              class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
              title="Buka Layar Panggung TV"
            >
              <Tv class="w-4 h-4" />
            </NuxtLink>

            <button
              type="button"
              @click="deleteClass(cls)"
              class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900 transition-colors"
              title="Hapus Kelas"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-20 text-center max-w-md mx-auto space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto flex items-center justify-center">
          <GraduationCap class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold font-display text-slate-900 dark:text-white">Belum Ada Kelas</h3>
        <p class="text-sm text-slate-500">Mulai dengan membuat kelas pertama Anda dan masukkan daftar murid.</p>
        <button
          type="button"
          @click="openCreateModal"
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
        >
          + Buat Kelas Sekarang
        </button>
      </div>
    </main>

    <!-- CREATE CLASS MODAL -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      @click.self="showModal = false"
    >
      <div class="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 my-8">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold font-display text-slate-900 dark:text-white">Buat Kelas Baru</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form @submit.prevent="createClass" class="space-y-4 text-xs sm:text-sm">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kelas</label>
            <input
              v-model="newClassName"
              type="text"
              required
              placeholder="Contoh: Motivational Show Kelas 10-A"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @input="onNameInput"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Slug URL (Publik untuk Siswa)</label>
            <div class="flex items-center">
              <span class="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-r-0 border-slate-200 dark:border-slate-800 rounded-l-xl text-xs font-mono">
                /c/
              </span>
              <input
                v-model="newClassSlug"
                type="text"
                required
                placeholder="public-speaking-10a"
                class="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Mulai Putaran</label>
              <input
                v-model="newClassStartDate"
                type="date"
                required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hari Aktif Belajar</label>
              <div class="flex items-center gap-1.5 pt-1">
                <label v-for="(day, idx) in ['Sen', 'Sel', 'Rab', 'Kam', 'Jum']" :key="idx" class="cursor-pointer">
                  <input
                    type="checkbox"
                    :value="idx + 1"
                    v-model="newClassDays"
                    class="sr-only peer"
                  />
                  <span class="px-2 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition-all select-none">
                    {{ day }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Daftar Nama Siswa (1 Nama per Baris)
            </label>
            <textarea
              v-model="newClassStudentsRaw"
              rows="6"
              placeholder="AHMAD YAZID&#10;MUHAMMAD DEDY&#10;MUHAMMAD ZAKY KAMILURRIZAL"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
            <p class="text-[11px] text-slate-400 mt-1">
              Jadwal putaran #1 akan langsung digenerate otomatis berdasarkan urutan nama ini.
            </p>
          </div>

          <div v-if="createError" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 text-xs">
            {{ createError }}
          </div>

          <div class="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isCreating"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2 v-if="isCreating" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isCreating ? 'Membuat Kelas...' : 'Buat & Generate Jadwal' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard, LogOut, Plus, Copy, ArrowRight,
  Tv, GraduationCap, Loader2, Trash2
} from 'lucide-vue-next'

const { user, fetchUser, logout } = useAuth()

// Ensure logged in
onMounted(async () => {
  const me = await fetchUser()
  if (!me) {
    navigateTo('/login')
  }
})

// Fetch Classes
const { data, pending, refresh } = await useFetch<any>('/api/classes')
const classesList = computed(() => data.value?.classes || [])

// Delete Class
const deleteClass = async (cls: any) => {
  if (!confirm(`Hapus kelas "${cls.name}" beserta seluruh jadwal dan muridnya? Tindakan ini tidak dapat dibatalkan.`)) return
  try {
    await $fetch(`/api/classes/${cls.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal menghapus kelas')
  }
}

// Copy Link Helper
const copiedSlug = ref('')
const copyStudentLink = (slug: string) => {
  const url = `${window.location.origin}/c/${slug}`
  navigator.clipboard.writeText(url)
  copiedSlug.value = slug
  setTimeout(() => {
    copiedSlug.value = ''
  }, 2000)
}

// Modal State
const showModal = ref(false)
const newClassName = ref('')
const newClassSlug = ref('')
const newClassStartDate = ref('2026-10-01')
const newClassDays = ref<number[]>([1, 2, 3, 4, 5]) // Mon-Fri
const newClassStudentsRaw = ref('')
const isCreating = ref(false)
const createError = ref('')

const openCreateModal = () => {
  newClassName.value = ''
  newClassSlug.value = ''
  newClassStartDate.value = new Date().toISOString().split('T')[0]
  newClassDays.value = [1, 2, 3, 4, 5]
  newClassStudentsRaw.value = ''
  createError.value = ''
  showModal.value = true
}

const onNameInput = () => {
  if (!newClassSlug.value || newClassSlug.value === slugify(newClassName.value.slice(0, -1))) {
    newClassSlug.value = slugify(newClassName.value)
  }
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

const createClass = async () => {
  isCreating.value = true
  createError.value = ''
  try {
    const studentNames = newClassStudentsRaw.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const res: any = await $fetch('/api/classes', {
      method: 'POST',
      body: {
        name: newClassName.value.trim(),
        slug: newClassSlug.value.trim(),
        startDate: newClassStartDate.value,
        classDays: newClassDays.value,
        studentNames
      }
    })

    showModal.value = false
    await refresh()
    if (res.class?.id) {
      navigateTo(`/dashboard/${res.class.id}`)
    }
  } catch (err: any) {
    createError.value = err.data?.message || err.message || 'Gagal membuat kelas'
  } finally {
    isCreating.value = false
  }
}

useHead({
  title: 'Dashboard Pengajar - Motivational Show Tracker'
})
</script>
