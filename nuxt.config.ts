export default defineNuxtConfig({
  ssr: false, // no server-side rendering, for offline Electron use
  app: {
    baseURL: './', // relative path so assets load in file:// or app://
    buildAssetsDir: 'assets/',
    head: {
      title: 'Clinic POS',
      meta: [{ charset: 'utf-8' }],
    },
  },

  css: ['@/assets/css/tailwind.css'],

  alias: {
    '#tailwind-config': './tailwind-config',
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  postcss: {
    plugins: {
      autoprefixer: {}, // ✅ correct
    },
  },

  nitro: {
    preset: 'static', // ✅ ensures Nuxt outputs index.html into /dist
  },

  compatibilityDate: '2025-06-06', // ✅ correct placement (outside nitro)
})
