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
          bg: 'rgb(var(--mt-bg) / <alpha-value>)',
          surface: 'rgb(var(--mt-surface) / <alpha-value>)',
          border: 'rgb(var(--mt-border) / <alpha-value>)',
          text: 'rgb(var(--mt-text) / <alpha-value>)',
          sub: 'rgb(var(--mt-sub) / <alpha-value>)',
          correct: 'rgb(var(--mt-correct) / <alpha-value>)',
          wrong: 'rgb(var(--mt-wrong) / <alpha-value>)',
          accent: 'rgb(var(--mt-accent) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
