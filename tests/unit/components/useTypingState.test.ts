import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTypingState } from '@/components/TypingEngine/useTypingState'

function makeChars(str) {
  return ref(str.split('').map((char) => ({ char, status: 'pending' })))
}

// ─── Whitespace must be typed ───────────────────────────────────────────────

describe('Whitespace handling', () => {
  it('does not skip the space between tokens (e.g. "if n")', () => {
    const chars = makeChars('if n')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('i')
    handleKey('f')

    expect(cursorIndex.value).toBe(2)
    expect(chars.value[2].char).toBe(' ')
    expect(chars.value[2].status).toBe('pending')
    expect(typedCharCount.value).toBe(2)

    handleKey('n')
    expect(chars.value[2].status).toBe('wrong')
    expect(cursorIndex.value).toBe(3)
    expect(typedCharCount.value).toBe(3)
  })

  it('typing the required space marks it correct and advances one character', () => {
    const chars = makeChars('if n')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('i')
    handleKey('f')
    handleKey(' ')

    expect(chars.value[2].status).toBe('correct')
    expect(cursorIndex.value).toBe(3)
    expect(typedCharCount.value).toBe(3)
  })

  it('resetCursor leaves leading spaces pending instead of auto-skipping them', () => {
    const chars = makeChars('    x')
    const { cursorIndex, resetCursor } = useTypingState(chars)

    resetCursor()
    expect(cursorIndex.value).toBe(0)
    for (let i = 0; i < 4; i++) {
      expect(chars.value[i].status).toBe('pending')
    }
  })

  it('Tab only types a real tab character, not normal spaces', () => {
    const spaceChars = makeChars('    x')
    const spaceState = useTypingState(spaceChars)
    expect(spaceState.handleKey('Tab')).toBe('ignore')
    expect(spaceState.cursorIndex.value).toBe(0)

    const tabChars = makeChars('\tx')
    const tabState = useTypingState(tabChars)
    expect(tabState.handleKey('Tab')).toBe('advance')
    expect(tabChars.value[0].status).toBe('correct')
    expect(tabState.cursorIndex.value).toBe(1)
  })

  it('allows formatter spaces before operators to be skipped', () => {
    const chars = makeChars('doubled = 1')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    for (const key of 'doubled') handleKey(key)
    expect(cursorIndex.value).toBe(7)

    handleKey('=')
    expect(chars.value[7].char).toBe(' ')
    expect(chars.value[7].status).toBe('correct')
    expect(chars.value[7].autoSkipped).toBe(true)
    expect(chars.value[8].status).toBe('correct')
    expect(cursorIndex.value).toBe(9)
    expect(typedCharCount.value).toBe(8)
  })

  it('allows formatter spaces after operators to be skipped', () => {
    const chars = makeChars('n => n')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('n')
    handleKey('=')
    handleKey('>')
    handleKey('n')

    expect(chars.value[1].status).toBe('correct')
    expect(chars.value[1].autoSkipped).toBe(true)
    expect(chars.value[4].status).toBe('correct')
    expect(chars.value[4].autoSkipped).toBe(true)
    expect(cursorIndex.value).toBe(6)
    expect(typedCharCount.value).toBe(4)
  })
})

// ─── Enter ─────────────────────────────────────────────────────────────────

describe('Enter', () => {
  it('Enter only advances over the newline; indentation spaces remain required', () => {
    const chars = makeChars('a\n    b')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('a')
    handleKey('Enter')

    expect(cursorIndex.value).toBe(2)
    expect(typedCharCount.value).toBe(2)
    expect(chars.value[1].status).toBe('correct')
    expect(chars.value[2].char).toBe(' ')
    expect(chars.value[2].status).toBe('pending')
  })

  it('Enter on non-newline char marks wrong and advances normally', () => {
    const chars = makeChars('ab')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('Enter')
    expect(chars.value[0].status).toBe('wrong')
    expect(cursorIndex.value).toBe(1)
    expect(typedCharCount.value).toBe(1)
  })
})

// ─── Backspace ──────────────────────────────────────────────────────────────

describe('Backspace', () => {
  let chars: ReturnType<typeof makeChars>
  let cursorIndex: { value: number }
  let typedCharCount: { value: number }
  let handleKey: (key: string) => string

  beforeEach(() => {
    chars = makeChars('ab')
    ;({ cursorIndex, typedCharCount, handleKey } = useTypingState(chars))
  })

  it('Backspace at position 0 returns ignore', () => {
    expect(handleKey('Backspace')).toBe('ignore')
    expect(cursorIndex.value).toBe(0)
  })

  it('Backspace after a typed char undoes it', () => {
    handleKey('a')
    handleKey('Backspace')
    expect(cursorIndex.value).toBe(0)
    expect(chars.value[0].status).toBe('pending')
    expect(typedCharCount.value).toBe(0)
  })

  it('Backspace only undoes one character at a time, including spaces', () => {
    chars = makeChars('a  b')
    ;({ cursorIndex, typedCharCount, handleKey } = useTypingState(chars))

    handleKey('a')
    handleKey(' ')
    handleKey(' ')
    expect(cursorIndex.value).toBe(3)

    handleKey('Backspace')
    expect(cursorIndex.value).toBe(2)
    expect(chars.value[2].status).toBe('pending')
    expect(chars.value[1].status).toBe('correct')
    expect(typedCharCount.value).toBe(2)
  })
})
