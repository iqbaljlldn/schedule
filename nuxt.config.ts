import { fileURLToPath } from 'node:url';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  alias: {
    '#server': fileURLToPath(new URL('./server', import.meta.url))
  },
  nitro: {
    alias: {
      '#server': fileURLToPath(new URL('./server', import.meta.url))
    }
  },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  app: {
    head: {
      title: 'Motivational Show Daily Schedule Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Aplikasi pelacak jadwal harian sesi public speaking kelas multi-guru berbasis Nuxt 3 & PostgreSQL.'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
        }
      ]
    }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET || 'public-speaking-tracker-super-secret-jwt-key-2026',
    public: {
      appName: 'Motivational Show Tracker'
    }
  }
});
