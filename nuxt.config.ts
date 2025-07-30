export default {
  ssr: false,
  app: {
    head: {
      title: 'Clinic POS',
      meta: [{ charset: 'utf-8' }],
    },
  },
  css: ['@/assets/css/tailwind.css'],
  modules: ['@nuxtjs/tailwindcss', 
            '@pinia/nuxt'],
  build: {
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    },
  },
  nitro: {
    compatibility: {
      date: '2025-06-06', 
    },
  },
};
