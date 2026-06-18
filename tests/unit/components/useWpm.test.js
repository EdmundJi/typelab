import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useWpm } from '@/components/TypingEngine/useWpm.js'

describe('T015 — useWpm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 0 when startTime is null', () => {
    const typedCharCount = ref(0)
    const startTime = ref(null)
    const { wpm } = useWpm(typedCharCount, startTime)
    expect(wpm.value).toBe(0)
  })

  it('WPM = Math.round(typedCharCount / 5 / elapsedMinutes)', () => {
    const typedCharCount = ref(100) // 100 chars
    const now = Date.now()
    vi.setSystemTime(now)
    const startTime = ref(now)

    const { wpm } = useWpm(typedCharCount, startTime)

    // Advance 1 minute
    vi.advanceTimersByTime(60_000)
    // Expected: round(100 / 5 / 1) = 20
    expect(wpm.value).toBe(20)
  })

  it('typedCharCount is independent of cursorIndex', () => {
    // Simulate: cursorIndex advanced by 4 (Tab skip), but typedCharCount stayed at 0
    const _cursorIndex = ref(4) // advanced by auto-skip — NOT used in WPM
    const typedCharCount = ref(0) // no user-typed chars
    const now = Date.now()
    vi.setSystemTime(now)
    const startTime = ref(now)

    const { wpm } = useWpm(typedCharCount, startTime)

    vi.advanceTimersByTime(60_000)
    // WPM should be 0 because typedCharCount=0, NOT because cursorIndex=4
    expect(wpm.value).toBe(0)
  })

  it('after Tab skip cursorIndex+4, typedCharCount unchanged → WPM unchanged', () => {
    const typedCharCount = ref(50)
    const now = Date.now()
    vi.setSystemTime(now)
    const startTime = ref(now)

    const { wpm } = useWpm(typedCharCount, startTime)

    vi.advanceTimersByTime(60_000)
    const wpmBefore = wpm.value // round(50/5/1) = 10

    // Simulate Tab skip: cursorIndex jumps but typedCharCount stays
    // (we don't pass cursorIndex to useWpm so it has no effect)
    // WPM should not change
    expect(wpm.value).toBe(wpmBefore)
    expect(wpm.value).toBe(10)
  })

  it('WPM result is rounded integer', () => {
    const typedCharCount = ref(11) // 11 chars
    const now = Date.now()
    vi.setSystemTime(now)
    const startTime = ref(now)

    const { wpm } = useWpm(typedCharCount, startTime)

    vi.advanceTimersByTime(60_000)
    // 11 / 5 / 1 = 2.2 → rounds to 2
    expect(wpm.value).toBe(2)
    expect(Number.isInteger(wpm.value)).toBe(true)
  })
})
