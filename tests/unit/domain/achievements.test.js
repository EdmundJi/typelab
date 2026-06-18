import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, checkNewUnlocks } from '../../../src/lib/domain/achievements.js'

// Helper: 创建基础 ctx，所有条件均不满足
function makeCtx(overrides = {}) {
  return {
    allResults: [],
    latestResult: { wpm: 50, accuracy: 90, language: 'python' },
    currentStreak: 0,
    alreadyUnlocked: [],
    ...overrides,
  }
}

describe('ACHIEVEMENTS metadata', () => {
  it('has exactly 7 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(7)
  })

  it('each achievement has required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a).toHaveProperty('id')
      expect(a).toHaveProperty('name')
      expect(a).toHaveProperty('description')
      expect(a).toHaveProperty('condition')
    }
  })
})

describe('checkNewUnlocks', () => {
  it('first-finish: unlocks when allResults.length === 1', () => {
    const ctx = makeCtx({
      allResults: [{ wpm: 50, accuracy: 90, language: 'python' }],
    })
    const result = checkNewUnlocks(ctx)
    expect(result).toContain('first-finish')
  })

  it('first-finish: does not unlock when allResults.length === 0', () => {
    const ctx = makeCtx({ allResults: [] })
    expect(checkNewUnlocks(ctx)).not.toContain('first-finish')
  })

  it('first-finish: does not unlock when allResults.length > 1', () => {
    const ctx = makeCtx({
      allResults: [
        { wpm: 50, accuracy: 90, language: 'python' },
        { wpm: 60, accuracy: 95, language: 'python' },
      ],
    })
    expect(checkNewUnlocks(ctx)).not.toContain('first-finish')
  })

  it('wpm-100: unlocks when latestResult.wpm >= 100', () => {
    const ctx = makeCtx({ latestResult: { wpm: 100, accuracy: 90, language: 'python' } })
    expect(checkNewUnlocks(ctx)).toContain('wpm-100')
  })

  it('wpm-100: unlocks when latestResult.wpm > 100', () => {
    const ctx = makeCtx({ latestResult: { wpm: 120, accuracy: 90, language: 'python' } })
    expect(checkNewUnlocks(ctx)).toContain('wpm-100')
  })

  it('wpm-100: does not unlock when wpm < 100', () => {
    const ctx = makeCtx({ latestResult: { wpm: 99, accuracy: 90, language: 'python' } })
    expect(checkNewUnlocks(ctx)).not.toContain('wpm-100')
  })

  it('perfect-accuracy: unlocks when latestResult.accuracy === 100', () => {
    const ctx = makeCtx({ latestResult: { wpm: 50, accuracy: 100, language: 'python' } })
    expect(checkNewUnlocks(ctx)).toContain('perfect-accuracy')
  })

  it('perfect-accuracy: does not unlock when accuracy < 100', () => {
    const ctx = makeCtx({ latestResult: { wpm: 50, accuracy: 99, language: 'python' } })
    expect(checkNewUnlocks(ctx)).not.toContain('perfect-accuracy')
  })

  it('streak-7: unlocks when currentStreak >= 7', () => {
    const ctx = makeCtx({ currentStreak: 7 })
    expect(checkNewUnlocks(ctx)).toContain('streak-7')
  })

  it('streak-7: unlocks when currentStreak > 7', () => {
    const ctx = makeCtx({ currentStreak: 10 })
    expect(checkNewUnlocks(ctx)).toContain('streak-7')
  })

  it('streak-7: does not unlock when currentStreak < 7', () => {
    const ctx = makeCtx({ currentStreak: 6 })
    expect(checkNewUnlocks(ctx)).not.toContain('streak-7')
  })

  it('multilingual: unlocks when distinct languages in allResults >= 3', () => {
    const ctx = makeCtx({
      allResults: [
        { wpm: 50, accuracy: 90, language: 'python' },
        { wpm: 60, accuracy: 90, language: 'javascript' },
        { wpm: 70, accuracy: 90, language: 'typescript' },
      ],
    })
    expect(checkNewUnlocks(ctx)).toContain('multilingual')
  })

  it('multilingual: does not unlock when distinct languages < 3', () => {
    const ctx = makeCtx({
      allResults: [
        { wpm: 50, accuracy: 90, language: 'python' },
        { wpm: 60, accuracy: 90, language: 'javascript' },
        { wpm: 70, accuracy: 90, language: 'python' }, // duplicate
      ],
    })
    expect(checkNewUnlocks(ctx)).not.toContain('multilingual')
  })

  it('multilingual: counts distinct languages correctly (deduplication)', () => {
    const ctx = makeCtx({
      allResults: [
        { wpm: 50, accuracy: 90, language: 'python' },
        { wpm: 60, accuracy: 90, language: 'python' },
        { wpm: 70, accuracy: 90, language: 'javascript' },
        { wpm: 80, accuracy: 90, language: 'javascript' },
      ],
    })
    expect(checkNewUnlocks(ctx)).not.toContain('multilingual')
  })

  it('practice-50: unlocks when allResults.length >= 50', () => {
    const results = Array.from({ length: 50 }, () => ({
      wpm: 60,
      accuracy: 90,
      language: 'python',
    }))
    const ctx = makeCtx({ allResults: results })
    expect(checkNewUnlocks(ctx)).toContain('practice-50')
  })

  it('practice-50: does not unlock when allResults.length < 50', () => {
    const results = Array.from({ length: 49 }, () => ({
      wpm: 60,
      accuracy: 90,
      language: 'python',
    }))
    const ctx = makeCtx({ allResults: results })
    expect(checkNewUnlocks(ctx)).not.toContain('practice-50')
  })

  it('already unlocked achievements are not returned again', () => {
    const ctx = makeCtx({
      allResults: [{ wpm: 50, accuracy: 90, language: 'python' }],
      latestResult: { wpm: 120, accuracy: 100, language: 'python' },
      currentStreak: 10,
      alreadyUnlocked: ['first-finish', 'wpm-100', 'perfect-accuracy', 'streak-7'],
    })
    const result = checkNewUnlocks(ctx)
    expect(result).not.toContain('first-finish')
    expect(result).not.toContain('wpm-100')
    expect(result).not.toContain('perfect-accuracy')
    expect(result).not.toContain('streak-7')
  })

  it('returns empty array when everything is already unlocked', () => {
    const allIds = ACHIEVEMENTS.map((a) => a.id)
    const ctx = makeCtx({
      allResults: Array.from({ length: 50 }, () => ({
        wpm: 120,
        accuracy: 100,
        language: 'python',
      })),
      latestResult: { wpm: 120, accuracy: 100, language: 'python' },
      currentStreak: 10,
      alreadyUnlocked: allIds,
    })
    expect(checkNewUnlocks(ctx)).toEqual([])
  })

  it('returns empty array when no conditions are met', () => {
    const ctx = makeCtx()
    expect(checkNewUnlocks(ctx)).toEqual([])
  })
})
