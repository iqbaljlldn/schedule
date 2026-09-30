<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
    <!-- Ambient glowing backgrounds -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 dark:bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header bar with home & theme toggle -->
    <div class="absolute top-6 left-6 right-6 flex items-center justify-between max-w-5xl mx-auto w-full px-4">
      <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <ArrowLeft class="w-4 h-4" />
        Kembali ke Beranda
      </NuxtLink>
      <ThemeToggle />
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md px-4 mt-8">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4 ring-1 ring-indigo-500/20 shadow-inner">
          <Sparkles class="w-7 h-7" />
        </div>
        <h2 class="text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
          Portal Guru
        </h2>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Masuk untuk mengelola jadwal, penilaian langsung, dan kelas
        </p>
      </div>

      <div class="mt-8 bg-white dark:bg-slate-900/90 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl relative">
        <!-- Demo Banner / Quick Fill -->
        <div class="mb-6 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-indigo-700 dark:text-indigo-300 block">Akun Pengajar Demo:</span>
            <span class="text-slate-600 dark:text-slate-400 font-mono text-[11px]">guru@sekolah.id</span>
          </div>
          <button
            type="button"
            @click="fillDemo"
            class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-sm active:scale-95"
          >
            Gunakan Demo
          </button>
        </div>

        <!-- Error notification -->
        <div v-if="errorMessage" class="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Alamat Email
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="nama@sekolah.id"
                class="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/20 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <span>{{ loading ? 'Memverifikasi...' : 'Masuk ke Dashboard' }}</span>
            </button>
          </div>
        </form>

        <div class="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Siswa tidak perlu login. Cukup buka tautan kelas yang dibagikan guru.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Sparkles, AlertCircle, Mail, Lock, Loader2 } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const { login, loading } = useAuth()

const fillDemo = () => {
  email.value = 'guru@sekolah.id'
  password.value = 'password123'
  errorMessage.value = ''
}

const handleLogin = async () => {
  errorMessage.value = ''
  const res = await login(email.value, password.value)
  if (res.success) {
    navigateTo('/dashboard')
  } else {
    errorMessage.value = res.error || 'Email atau kata sandi tidak valid'
  }
}
</script>
