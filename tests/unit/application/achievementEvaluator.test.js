import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock adapters/db.js
vi.mock('@/lib/adapters/db', () => ({
  listUserAchievements: vi.fn().mockResolvedValue([]),
  unlockAchievement: vi.fn().mockResolvedValue(undefined),
}))

import * as db from '@/lib/adapters/db'
import { evaluateAndUnlock } from '@/lib/application/achievementEvaluator'

const USER_ID = 'test-user-001'

beforeEach(() => {
  vi.clearAllMocks()
  db.listUserAchievements.mockResolvedValue([])
  db.unlockAchievement.mockResolvedValue(undefined)
})

describe('evaluateAndUnlock', () => {
  it('首次完成练习 → 返回 ["first-finish"]', async () => {
    const latestResult = { wpm: 60, accuracy: 90, language: 'python' }
    const allResults = [latestResult]
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 0)
    expect(result).toContain('first-finish')
    expect(db.unlockAchievement).toHaveBeenCalledWith(USER_ID, 'first-finish')
  })

  it('WPM ≥ 100 → 返回包含 "wpm-100"', async () => {
    const latestResult = { wpm: 105, accuracy: 90, language: 'python' }
    const allResults = [latestResult, { wpm: 80, accuracy: 85, language: 'python' }]
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 0)
    expect(result).toContain('wpm-100')
    expect(db.unlockAchievement).toHaveBeenCalledWith(USER_ID, 'wpm-100')
  })

  it('已全部解锁 → 返回 []', async () => {
    // 所有成就 id
    const allAchievementIds = [
      'first-finish',
      'wpm-100',
      'perfect-accuracy',
      'streak-7',
      'multilingual',
      'practice-50',
      'night-owl',
    ]
    db.listUserAchievements.mockResolvedValue(allAchievementIds)

    const latestResult = { wpm: 120, accuracy: 100, language: 'python' }
    const allResults = Array.from({ length: 50 }, () => latestResult)
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 10)
    expect(result).toEqual([])
    expect(db.unlockAchievement).not.toHaveBeenCalled()
  })

  it('无新解锁时 → 返回 []', async () => {
    const latestResult = { wpm: 60, accuracy: 90, language: 'python' }
    const allResults = [latestResult, { wpm: 50, accuracy: 80, language: 'python' }]
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 0)
    expect(result).not.toContain('first-finish') // allResults.length !== 1
    expect(result).not.toContain('wpm-100')
  })

  it('unlockAchievement PK 冲突（throw）→ 静默忽略，返回值不含该 id', async () => {
    // Simulate: first-finish already unlocked at DB level but not in listUserAchievements
    // So checkNewUnlocks computes it, but unlockAchievement throws (PK conflict)
    db.unlockAchievement.mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint'),
    )

    const latestResult = { wpm: 60, accuracy: 90, language: 'python' }
    const allResults = [latestResult]
    // Should not throw; the PK-conflicting id should not be in result
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 0)
    // The unlock failed for first-finish, so it should NOT be in the returned array
    expect(result).not.toContain('first-finish')
  })

  it('listUserAchievements 失败 → 降级为空列表，不 throw', async () => {
    db.listUserAchievements.mockRejectedValueOnce(new Error('Network error'))
    const latestResult = { wpm: 60, accuracy: 90, language: 'python' }
    const allResults = [latestResult]
    // Should not throw; behaves as if no achievements are locked yet
    await expect(evaluateAndUnlock(USER_ID, latestResult, allResults, 0)).resolves.toBeDefined()
  })

  it('perfect-accuracy → 返回包含 "perfect-accuracy"', async () => {
    const latestResult = { wpm: 70, accuracy: 100, language: 'python' }
    const allResults = [latestResult, { wpm: 60, accuracy: 90, language: 'python' }]
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 0)
    expect(result).toContain('perfect-accuracy')
  })

  it('streak ≥ 7 → 返回包含 "streak-7"', async () => {
    const latestResult = { wpm: 60, accuracy: 90, language: 'python' }
    const allResults = [latestResult]
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 7)
    expect(result).toContain('streak-7')
  })

  it('已解锁的成就不重复解锁', async () => {
    db.listUserAchievements.mockResolvedValue(['first-finish'])
    const latestResult = { wpm: 110, accuracy: 100, language: 'python' }
    const allResults = [latestResult]
    const result = await evaluateAndUnlock(USER_ID, latestResult, allResults, 0)
    expect(result).not.toContain('first-finish')
    // wpm-100 and perfect-accuracy are new
    expect(result).toContain('wpm-100')
    expect(result).toContain('perfect-accuracy')
  })
})
