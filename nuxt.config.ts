export default {
  ssr: false,
  app: {
    head: {
      title: 'Clinic POS',
      meta: [{ charset: 'utf-8' }],
    },
  },
  css: ['@/assets/css/tailwind.css'],
  alias: {
    '#tailwind-config': './tailwind-config'
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  nitro: {
    compatibility: {
      date: '2025-06-06',
    },
  },
};
