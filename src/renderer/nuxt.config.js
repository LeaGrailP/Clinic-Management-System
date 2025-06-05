/**
 * By default, Nuxt.js is configured to cover most use cases.
 * This default configuration can be overwritten in this file
 * @link {https://nuxtjs.org/guide/configuration/}
 */


module.exports = {
  ssr: false,
  target: 'static',
  head: {
    title: 'clinic-pos',
    meta: [{ charset: "utf-8" }]
  },
  loading: false,
  css: ['@/assets/css/tailwind.css'],
  buildModules: [
    
  ],
  build: {
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    },
    extend(config, ctx) {
      config.resolve.alias['vue$'] = 'vue/dist/vue.esm.js'
    },
  },
  modules: [
    
  ],
};
