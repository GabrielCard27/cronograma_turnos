/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        papel: '#F5F6F8',
        tinta: '#16213A',
        linea: '#D9DEE7',
        suave: '#5B667C',
        acento: '#0E6B63',
        alerta: '#B3261E',
        ok: '#1B7F4B',
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
