/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffcf2',
          100: '#fff9e6',
          200: '#fef3cc',
          300: '#fde699',
          400: '#fcd366',
          500: '#D4AF37', // Core Gold
          600: '#c5a059',
          700: '#a6874b',
          800: '#876e3d',
          900: '#68552f',
          950: '#493c21',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
