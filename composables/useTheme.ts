export const useTheme = () => {
  const isDark = useState<boolean>('theme_is_dark', () => false)

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('ps-theme')
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const activeTheme = saved || (prefersDark ? 'dark' : 'light')
      isDark.value = activeTheme === 'dark'
      document.documentElement.setAttribute('data-theme', activeTheme)
    }
  }

  const toggleTheme = () => {
    if (import.meta.client) {
      isDark.value = !isDark.value
      const activeTheme = isDark.value ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', activeTheme)
      localStorage.setItem('ps-theme', activeTheme)
    }
  }

  return {
    isDark,
    initTheme,
    toggleTheme
  }
}
