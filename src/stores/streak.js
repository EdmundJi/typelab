import { defineStore } from 'pinia'
import { listUserResults } from '@/lib/adapters/db'
import { calcStreak } from '@/lib/domain/streak'

export const useStreakStore = defineStore('streak', {
  state: () => ({
    currentStreak: 0,
    bestStreak: 0,
    calendarData: {},
  }),
  actions: {
    async refresh(userId) {
      const { data, error } = await listUserResults(userId)
      if (error || !data) {
        this.currentStreak = 0
        this.bestStreak = 0
        this.calendarData = {}
        return
      }
      const result = calcStreak(data)
      this.currentStreak = result.currentStreak
      this.bestStreak = result.bestStreak
      this.calendarData = result.calendarData
    },
  },
})
