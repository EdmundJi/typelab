/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        mt: {
          bg: '#111111',
          surface: '#1e1e1e',
          border: '#2a2a2a',
          text: '#d1d0c5',
          sub: '#646669',
          correct: '#d1d0c5',
          wrong: '#ca4754',
          accent: '#e2b714',
        },
      },
    },
  },
  plugins: [],
}
