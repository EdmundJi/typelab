import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calcStreak } from '../../../src/lib/domain/streak.js'

// Helper: 给定 UTC+8 日期字符串，返回对应的 UTC ISO 时间戳（取当天 UTC+8 正午）
function utc8DayToUTC(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  // UTC+8 正午 = UTC 04:00（不跨日，安全）
  return new Date(Date.UTC(y, m - 1, d, 4, 0, 0)).toISOString()
}

// 模拟"今天"是某个固定 UTC+8 日期
function mockToday(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  // 取 UTC+8 正午对应的 UTC 时间戳
  const fakeNowMs = Date.UTC(y, m - 1, d, 4, 0, 0)
  vi.setSystemTime(fakeNowMs)
}

describe('calcStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 默认今天 = 2025-01-15（UTC+8）
    mockToday('2025-01-15')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('empty array returns zeros and empty calendarData', () => {
    expect(calcStreak([])).toEqual({ currentStreak: 0, bestStreak: 0, calendarData: {} })
  })

  it('consecutive 7 days ending today gives currentStreak: 7', () => {
    const days = [
      '2025-01-09',
      '2025-01-10',
      '2025-01-11',
      '2025-01-12',
      '2025-01-13',
      '2025-01-14',
      '2025-01-15',
    ]
    const timestamps = days.map(utc8DayToUTC)
    const result = calcStreak(timestamps)
    expect(result.currentStreak).toBe(7)
    expect(result.bestStreak).toBe(7)
  })

  it('gap day: today has a record but yesterday did not — currentStreak is 1', () => {
    // 今天 2025-01-15 有练习，但 2025-01-14 没有（断了一天）
    const timestamps = [
      utc8DayToUTC('2025-01-10'),
      utc8DayToUTC('2025-01-11'),
      utc8DayToUTC('2025-01-12'),
      // 13 日 没有记录
      utc8DayToUTC('2025-01-15'), // 今天
    ]
    const result = calcStreak(timestamps)
    expect(result.currentStreak).toBe(1)
    expect(result.bestStreak).toBe(3)
  })

  it('yesterday last practice, today no record — streak continues from yesterday', () => {
    // 最后有记录是 2025-01-14（昨天），今天 2025-01-15 没有记录
    const days = ['2025-01-10', '2025-01-11', '2025-01-12', '2025-01-13', '2025-01-14']
    const timestamps = days.map(utc8DayToUTC)
    const result = calcStreak(timestamps)
    // 昨天有记录，streak 仍然有效
    expect(result.currentStreak).toBe(5)
  })

  it('old streak is not current — currentStreak 0 if last day is before yesterday', () => {
    // 最近练习是 2025-01-10，今天 2025-01-15，超过昨天，streak 断了
    const timestamps = [
      utc8DayToUTC('2025-01-08'),
      utc8DayToUTC('2025-01-09'),
      utc8DayToUTC('2025-01-10'),
    ]
    const result = calcStreak(timestamps)
    expect(result.currentStreak).toBe(0)
    expect(result.bestStreak).toBe(3)
  })

  it('UTC+8 boundary: UTC 15:59 归当天 (2025-01-14)', () => {
    // UTC 15:59 = UTC+8 23:59，归 2025-01-14
    mockToday('2025-01-14')
    const ts = new Date(Date.UTC(2025, 0, 14, 15, 59, 0)).toISOString()
    const result = calcStreak([ts])
    expect(result.calendarData['2025-01-14']).toBe(1)
    expect(result.calendarData['2025-01-15']).toBeUndefined()
  })

  it('UTC+8 boundary: UTC 16:00 归次日 (2025-01-15)', () => {
    // UTC 16:00 = UTC+8 00:00 次日，归 2025-01-15
    mockToday('2025-01-15')
    const ts = new Date(Date.UTC(2025, 0, 14, 16, 0, 0)).toISOString()
    const result = calcStreak([ts])
    expect(result.calendarData['2025-01-15']).toBe(1)
    expect(result.calendarData['2025-01-14']).toBeUndefined()
  })

  it('invalid timestamps are skipped without throwing', () => {
    const timestamps = ['not-a-date', '', null, undefined, 'invalid', utc8DayToUTC('2025-01-15')]
    expect(() => calcStreak(timestamps)).not.toThrow()
    const result = calcStreak(timestamps)
    expect(result.calendarData['2025-01-15']).toBe(1)
  })

  it('multiple sessions on same day count as one streak day but multiple in calendarData', () => {
    const timestamps = [
      utc8DayToUTC('2025-01-15'),
      utc8DayToUTC('2025-01-15'),
      utc8DayToUTC('2025-01-15'),
    ]
    const result = calcStreak(timestamps)
    expect(result.calendarData['2025-01-15']).toBe(3)
    expect(result.currentStreak).toBe(1)
  })

  it('supports object array with created_at field', () => {
    const timestamps = [
      { created_at: utc8DayToUTC('2025-01-14') },
      { created_at: utc8DayToUTC('2025-01-15') },
    ]
    const result = calcStreak(timestamps)
    expect(result.currentStreak).toBe(2)
  })
})
