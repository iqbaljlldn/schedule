<template>
  <button
    type="button"
    @click="toggleTheme"
    class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm"
    :title="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
  >
    <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
    <Moon v-else class="w-4 h-4 text-indigo-600" />
  </button>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
const { isDark, toggleTheme } = useTheme()
</script>
