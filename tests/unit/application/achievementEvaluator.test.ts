import { describe, expect, it } from 'vitest'
import { MemoryAdapter } from '@/lib/adapters/MemoryAdapter'
import { evaluateAndUnlock } from '@/lib/application/achievementEvaluator'

const USER_ID = 'test-user-001'

describe('evaluateAndUnlock', () => {
  it('unlocks first finish with injected MemoryAdapter', async () => {
    const adapter = new MemoryAdapter()
    const latestResult = { wpm: 60, accuracy: 90, language: 'python' }
    const result = await evaluateAndUnlock(USER_ID, latestResult, [latestResult], 0, adapter)
    expect(result).toContain('first-finish')
    expect(await adapter.listUserAchievements(USER_ID)).toContain('first-finish')
  })
  it('does not duplicate already unlocked achievements', async () => {
    const adapter = new MemoryAdapter()
    await adapter.unlockAchievement(USER_ID, 'first-finish')
    const latestResult = { wpm: 60, accuracy: 90, language: 'python' }
    const result = await evaluateAndUnlock(USER_ID, latestResult, [latestResult], 0, adapter)
    expect(result).not.toContain('first-finish')
  })
  it('unlocks wpm-100', async () => {
    const adapter = new MemoryAdapter()
    const latestResult = { wpm: 105, accuracy: 90, language: 'python' }
    const result = await evaluateAndUnlock(
      USER_ID,
      latestResult,
      [latestResult, { wpm: 80, accuracy: 80, language: 'python' }],
      0,
      adapter,
    )
    expect(result).toContain('wpm-100')
  })
})
