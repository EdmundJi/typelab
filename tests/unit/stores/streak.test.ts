import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryAdapter } from '@/lib/adapters/MemoryAdapter'
import { useStreakStore } from '@/stores/streak'

describe('streak store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('refreshes dashboard state with injected MemoryAdapter', async () => {
    const db = new MemoryAdapter()
    await db.saveResult({
      user_id: 'u',
      lesson_id: 'l',
      wpm: 88,
      accuracy: 99,
      duration: 1,
      errors: 0,
    })
    const s = useStreakStore()
    await s.refresh('u', db)
    expect(s.totalCount).toBe(1)
    expect(s.bestWpm).toBe(88)
  })
  it('resets when user missing', async () => {
    const s = useStreakStore()
    await s.refresh(undefined)
    expect(s.totalCount).toBe(0)
  })
})
