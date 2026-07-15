/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eat: { DEFAULT: '#c4561e', light: '#e8733a', dark: '#3a1c0e', tint: '#fbeee5' },
        fk: { DEFAULT: '#7b4fa0', light: '#9b6fc0', dark: '#241433', tint: '#f3ecfa' },
        ink: '#1a0e04',
      },
      fontFamily: {
        display: ['"Arial Black"', 'Impact', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        comic: '4px 4px 0 rgba(0,0,0,0.85)',
      },
    },
  },
  plugins: [],
};
