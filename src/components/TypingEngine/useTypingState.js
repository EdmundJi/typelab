import { ref } from 'vue'

/**
 * useTypingState — handles per-character keystroke logic with IDE-like optional spacing.
 *
 * Whitespace between two word characters is semantic and must be typed, e.g. `if n` or
 * `const value`. Whitespace around operators and punctuation is formatter-style spacing,
 * so typing the next non-space character may skip it, similar to how an IDE formatter
 * normalizes `value = 1` from `value=1`.
 *
 * @param {import('vue').Ref<Array<{char: string, status: string}>>} chars
 * @returns {{
 *   cursorIndex: import('vue').Ref<number>,
 *   typedCharCount: import('vue').Ref<number>,
 *   handleKey: (key: string) => 'advance'|'backspace'|'ignore'|null
 * }}
 */
export function useTypingState(chars) {
  const cursorIndex = ref(0)
  const typedCharCount = ref(0)

  function resetCursor() {
    cursorIndex.value = 0
    typedCharCount.value = 0
  }

  function isHorizontalWhitespace(char) {
    return char === ' ' || char === '\t'
  }

  function isWordChar(char) {
    return /[A-Za-z0-9_$]/.test(char ?? '')
  }

  function previousNonWhitespaceIndex(index) {
    for (let i = index - 1; i >= 0; i--) {
      if (chars.value[i].char === '\n') return -1
      if (!isHorizontalWhitespace(chars.value[i].char)) return i
    }
    return -1
  }

  function nextNonWhitespaceIndex(index) {
    for (let i = index; i < chars.value.length; i++) {
      if (chars.value[i].char === '\n') return -1
      if (!isHorizontalWhitespace(chars.value[i].char)) return i
    }
    return -1
  }

  function canSkipFormatterWhitespace(index) {
    if (!isHorizontalWhitespace(chars.value[index]?.char)) return false

    const prevIndex = previousNonWhitespaceIndex(index)
    const nextIndex = nextNonWhitespaceIndex(index)
    if (nextIndex === -1) return false

    const prev = prevIndex === -1 ? '' : chars.value[prevIndex].char
    const next = chars.value[nextIndex].char

    // Space between two identifiers/keywords/numbers is semantic, not formatting.
    // Examples: `if n`, `const doubled`, `let value`.
    return !(isWordChar(prev) && isWordChar(next))
  }

  function maybeSkipFormatterWhitespaceFor(key) {
    if (key.length !== 1) return false
    if (!isHorizontalWhitespace(chars.value[cursorIndex.value]?.char)) return false
    if (!canSkipFormatterWhitespace(cursorIndex.value)) return false

    const nextIndex = nextNonWhitespaceIndex(cursorIndex.value)
    if (nextIndex === -1 || chars.value[nextIndex].char !== key) return false

    for (let i = cursorIndex.value; i < nextIndex; i++) {
      chars.value[i].status = 'correct'
      chars.value[i].autoSkipped = true
    }
    cursorIndex.value = nextIndex
    return true
  }

  function handleKey(key) {
    if (key === 'Backspace') {
      if (cursorIndex.value > 0) {
        cursorIndex.value--
        if (!chars.value[cursorIndex.value].autoSkipped && typedCharCount.value > 0) {
          typedCharCount.value--
        }
        chars.value[cursorIndex.value].status = 'pending'
        chars.value[cursorIndex.value].autoSkipped = false
        return 'backspace'
      }
      return 'ignore'
    }

    if (cursorIndex.value >= chars.value.length) return 'ignore'

    maybeSkipFormatterWhitespaceFor(key)
    if (cursorIndex.value >= chars.value.length) return 'ignore'

    const expected = chars.value[cursorIndex.value].char

    if (key === 'Enter') {
      chars.value[cursorIndex.value].status = expected === '\n' ? 'correct' : 'wrong'
      chars.value[cursorIndex.value].autoSkipped = false
      cursorIndex.value++
      typedCharCount.value++
      return 'advance'
    }

    if (key === 'Tab') {
      if (expected !== '\t') return 'ignore'
      chars.value[cursorIndex.value].status = 'correct'
      chars.value[cursorIndex.value].autoSkipped = false
      cursorIndex.value++
      typedCharCount.value++
      return 'advance'
    }

    if (key.length === 1) {
      chars.value[cursorIndex.value].status = key === expected ? 'correct' : 'wrong'
      chars.value[cursorIndex.value].autoSkipped = false
      cursorIndex.value++
      typedCharCount.value++
      return 'advance'
    }

    return 'ignore'
  }

  return { cursorIndex, typedCharCount, handleKey, resetCursor }
}
