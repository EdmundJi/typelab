import { defineStore } from 'pinia'
import { db } from '@/lib/adapters/db'
import type { DbAdapter } from '@/lib/adapters/types'
import { calcStreak } from '@/lib/domain/streak'

export const useStreakStore = defineStore('streak', {
  state: () => ({
    currentStreak: 0,
    bestStreak: 0,
    calendarData: {} as Record<string, number>,
    practicedToday: false,
    totalCount: 0,
    weekCount: 0,
    bestWpm: 0,
    lastResult: null as any,
    loading: false,
    error: '',
  }),
  actions: {
    async refresh(userId?: string, adapter: DbAdapter = db) {
      if (!userId) {
        this.currentStreak = 0
        this.bestStreak = 0
        this.calendarData = {}
        this.practicedToday = false
        this.totalCount = 0
        this.weekCount = 0
        this.bestWpm = 0
        this.lastResult = null
        return
      }
      this.loading = true
      this.error = ''
      const { data, error } = await adapter.listUserResults(userId)
      this.loading = false
      if (error || !data) {
        this.currentStreak = 0
        this.bestStreak = 0
        this.calendarData = {}
        this.error = '加载失败'
        return
      }
      const result = calcStreak(data)
      this.currentStreak = result.currentStreak
      this.bestStreak = result.bestStreak
      this.calendarData = result.calendarData
      const today = new Date().toISOString().slice(0, 10)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      this.practicedToday = data.some((r: any) => String(r.created_at ?? '').slice(0, 10) === today)
      this.totalCount = data.length
      this.weekCount = data.filter((r: any) => Date.parse(r.created_at ?? '') >= weekAgo).length
      this.bestWpm = data.length ? Math.max(...data.map((r: any) => r.wpm ?? 0)) : 0
      this.lastResult = data[0] ?? null
    },
  },
})
