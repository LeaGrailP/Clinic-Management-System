const colors = require('tailwindcss/colors')

module.exports = {
  darkMode: 'class',   // ⬅️ REQUIRED for theme toggle to work
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './app.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        secondary: colors.gray,
        danger: colors.red,
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}