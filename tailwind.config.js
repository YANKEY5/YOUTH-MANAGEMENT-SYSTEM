/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        church: {
          navy: {
            50: '#f0f4f9',
            100: '#dbe5f2',
            200: '#bdcfe7',
            300: '#90add5',
            400: '#5d85be',
            500: '#3c64a3',
            600: '#2f4f85',
            700: '#26406c',
            800: '#22385c',
            900: '#20314f',
            950: '#0f172a', // Deep background
          },
          gold: {
            50: '#fdfbeb',
            100: '#fbf5c6',
            200: '#f7e78b',
            300: '#f2d14b',
            400: '#ecb81f',
            500: '#d99710',
            600: '#b4700c',
            700: '#904e0d',
            800: '#773e10',
            900: '#653311',
            950: '#3b1a06',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
