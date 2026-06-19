import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: localStorage.getItem('theme') || 'dark',
  }),
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
  },
})
