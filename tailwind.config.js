const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.{vue,js}',
    './pages/**/*.{vue,js}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {primary: colors.blue,
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
