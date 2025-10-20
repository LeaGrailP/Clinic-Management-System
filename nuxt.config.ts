export default defineNuxtConfig({
  ssr: false, // No SSR for Electron

  app: {
    baseURL: './', // ✅ Relative paths so Electron can load assets
    buildAssetsDir: '_nuxt/', // ✅ Keep as is
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
      autoprefixer: {},
    },
  },

  nitro: {
    preset: 'static', // ✅ Output static files
    output: {
      publicDir: '../dist/public', // 👈 ✅ Explicitly tell Nuxt where to put built assets
    },
  },

  compatibilityDate: '2025-06-06',
})
