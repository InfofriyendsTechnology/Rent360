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
        brand: {
          blue: '#0B60B0',
          sky: '#40A2D8',
          subtle: 'rgba(11, 96, 176, 0.12)',
          border: 'rgba(11, 96, 176, 0.35)'
        },
        dark: {
          bg: '#000000',
          card: '#0A0A0A',
          elevated: '#121212',
          border: '#202020'
        }
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['Inter', 'monospace']
      }
    },
  },
  plugins: [],
}
