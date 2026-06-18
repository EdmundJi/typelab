import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTypingState } from '@/components/TypingEngine/useTypingState.js'

function makeChars(str) {
  return ref(str.split('').map((char) => ({ char, status: 'pending' })))
}

// ─── T013: Enter auto-indent ───────────────────────────────────────────────

describe('T013 — Enter auto-indent', () => {
  it('Enter after \\n auto-skips leading spaces (cursorIndex +5, typedCharCount +1)', () => {
    const chars = makeChars('a\n    b')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('a')
    expect(cursorIndex.value).toBe(1)
    expect(typedCharCount.value).toBe(1)

    handleKey('Enter')
    expect(cursorIndex.value).toBe(6) // past \n + 4 spaces
    expect(typedCharCount.value).toBe(2) // 'a' + Enter only
  })

  it('auto-skipped spaces are marked correct but do NOT increase typedCharCount', () => {
    const chars = makeChars('\n    x')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('Enter')
    expect(chars.value[0].status).toBe('correct') // \n
    expect(chars.value[1].status).toBe('correct') // space 1
    expect(chars.value[2].status).toBe('correct') // space 2
    expect(chars.value[3].status).toBe('correct') // space 3
    expect(chars.value[4].status).toBe('correct') // space 4
    expect(chars.value[5].status).toBe('pending') // 'x' not yet typed

    expect(cursorIndex.value).toBe(5)
    expect(typedCharCount.value).toBe(1) // only the \n counts
  })

  it('Enter with no leading spaces on next line: cursorIndex +1, typedCharCount +1', () => {
    const chars = makeChars('\nx')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('Enter')
    expect(cursorIndex.value).toBe(1)
    expect(typedCharCount.value).toBe(1)
    expect(chars.value[0].status).toBe('correct')
  })

  it('Enter on non-\\n char marks wrong and advances normally', () => {
    const chars = makeChars('ab')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('Enter')
    expect(chars.value[0].status).toBe('wrong')
    expect(cursorIndex.value).toBe(1)
    expect(typedCharCount.value).toBe(1)
  })
})

// ─── T014: auto-skip whitespace + Tab ─────────────────────────────────────

describe('T014 — whitespace auto-skip', () => {
  it('resetCursor skips all leading spaces so cursor starts at first non-space', () => {
    const chars = makeChars('    x')
    const { cursorIndex, resetCursor } = useTypingState(chars)

    resetCursor()
    expect(cursorIndex.value).toBe(4)
    for (let i = 0; i < 4; i++) {
      expect(chars.value[i].status).toBe('correct')
    }
    expect(chars.value[4].status).toBe('pending') // 'x' not yet typed
  })

  it('resetCursor skips leading tab chars (\\t)', () => {
    const chars = makeChars('\tx')
    const { cursorIndex, resetCursor } = useTypingState(chars)

    resetCursor()
    expect(cursorIndex.value).toBe(1)
    expect(chars.value[0].status).toBe('correct')
  })

  it('after typing a char, following spaces are auto-skipped', () => {
    // "a  b" — after typing 'a', cursor should jump over 2 spaces to 'b'
    const chars = makeChars('a  b')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('a')
    expect(cursorIndex.value).toBe(3) // past 'a' + 2 spaces
    expect(typedCharCount.value).toBe(1) // only 'a' counts
    expect(chars.value[1].status).toBe('correct') // space auto-skipped
    expect(chars.value[2].status).toBe('correct') // space auto-skipped
  })

  it('Tab key skips all consecutive whitespace at cursor', () => {
    const chars = makeChars('        x') // 8 spaces
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('Tab')
    expect(cursorIndex.value).toBe(8) // all 8 spaces skipped
    expect(typedCharCount.value).toBe(0)
  })

  it('Tab ignored when not at whitespace', () => {
    const chars = makeChars('abc')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    const result = handleKey('Tab')
    expect(result).toBe('ignore')
    expect(cursorIndex.value).toBe(0)
    expect(typedCharCount.value).toBe(0)
  })

  it('typedCharCount stays 0 for whitespace, increments only for real chars', () => {
    const chars = makeChars('    y')
    const { cursorIndex, typedCharCount, handleKey } = useTypingState(chars)

    handleKey('Tab') // skip 4 spaces
    expect(typedCharCount.value).toBe(0)

    handleKey('y')
    expect(cursorIndex.value).toBe(5)
    expect(typedCharCount.value).toBe(1)
  })
})

// ─── Backspace ──────────────────────────────────────────────────────────────

describe('Backspace', () => {
  let chars
  let cursorIndex
  let typedCharCount
  let handleKey

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

  it('Backspace also steps back over auto-skipped spaces', () => {
    // "a  b" — type 'a', spaces auto-skip, cursor at 3; backspace → cursor at 0
    chars = makeChars('a  b')
    ;({ cursorIndex, typedCharCount, handleKey } = useTypingState(chars))

    handleKey('a')
    expect(cursorIndex.value).toBe(3)

    handleKey('Backspace')
    expect(cursorIndex.value).toBe(0) // stepped back through spaces + 'a'
    expect(chars.value[0].status).toBe('pending')
    expect(chars.value[1].status).toBe('pending')
    expect(chars.value[2].status).toBe('pending')
    expect(typedCharCount.value).toBe(0)
  })
})
