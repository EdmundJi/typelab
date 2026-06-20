import { defineStore } from 'pinia'

const getSystemTheme = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', {
  state: () => {
    const saved = localStorage.getItem('theme')
    return { mode: saved ?? getSystemTheme() }
  },
  getters: {
    isDark: (state) => state.mode === 'dark',
  },
  actions: {
    toggle() {
      this.mode = this.mode === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', this.mode)
      this.apply()
    },
    apply() {
      document.documentElement.classList.toggle('light', this.mode === 'light')
      document.documentElement.classList.toggle('dark', this.mode === 'dark')
    },
    listenSystem() {
      if (typeof window.matchMedia !== 'function') return
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.mode = e.matches ? 'dark' : 'light'
          this.apply()
        }
      })
    },
  },
})
