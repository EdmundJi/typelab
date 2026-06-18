import { ref } from 'vue'

/**
 * useTypingState — handles keystroke logic with auto-indent and tab-skip.
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

  // Auto-advance past whitespace (space and tab) — whitespace is never user-typed in code mode.
  // Called after every forward movement so the cursor always rests on a non-whitespace char.
  function skipSpaces() {
    while (
      cursorIndex.value < chars.value.length &&
      (chars.value[cursorIndex.value].char === ' ' || chars.value[cursorIndex.value].char === '\t')
    ) {
      chars.value[cursorIndex.value].status = 'correct'
      cursorIndex.value++
    }
  }

  // Call after text/cursor reset so initial leading spaces are also skipped.
  function resetCursor() {
    cursorIndex.value = 0
    typedCharCount.value = 0
    skipSpaces()
  }

  function handleKey(key) {
    if (key === 'Backspace') {
      if (cursorIndex.value > 0) {
        // Step back over any auto-skipped whitespace first (restoring them to pending)
        while (
          cursorIndex.value > 0 &&
          (chars.value[cursorIndex.value - 1].char === ' ' ||
            chars.value[cursorIndex.value - 1].char === '\t') &&
          chars.value[cursorIndex.value - 1].status === 'correct'
        ) {
          cursorIndex.value--
          chars.value[cursorIndex.value].status = 'pending'
        }
        // Then undo the real typed char
        if (cursorIndex.value > 0) {
          cursorIndex.value--
          if (typedCharCount.value > 0) typedCharCount.value--
          chars.value[cursorIndex.value].status = 'pending'
        }
        return 'backspace'
      }
      return 'ignore'
    }

    if (cursorIndex.value >= chars.value.length) return 'ignore'

    const expected = chars.value[cursorIndex.value].char

    if (key === 'Enter') {
      if (expected !== '\n') {
        chars.value[cursorIndex.value].status = 'wrong'
        cursorIndex.value++
        typedCharCount.value++
        skipSpaces()
        return 'advance'
      }
      chars.value[cursorIndex.value].status = 'correct'
      cursorIndex.value++
      typedCharCount.value++
      skipSpaces()
      return 'advance'
    }

    if (key === 'Tab') {
      // Tab skips up to 4 spaces; with auto-skip active this is mostly a no-op,
      // but kept for explicit indentation flow at the start of a line.
      skipSpaces()
      return cursorIndex.value > 0 ? 'advance' : 'ignore'
    }

    if (key.length === 1) {
      chars.value[cursorIndex.value].status = key === expected ? 'correct' : 'wrong'
      cursorIndex.value++
      typedCharCount.value++
      skipSpaces()
      return 'advance'
    }

    return 'ignore'
  }

  return { cursorIndex, typedCharCount, handleKey, resetCursor }
}
