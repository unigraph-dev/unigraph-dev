/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans]
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    }
  },
  safelist: ['prose'],
  plugins: [
    require('@tailwindcss/typography'),
  ],
}