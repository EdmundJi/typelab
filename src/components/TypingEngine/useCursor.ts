import { computed } from 'vue'

/**
 * useCursor — floating caret via getBoundingClientRect
 *
 * @param {import('vue').Ref<number>} currentIndex
 * @param {import('vue').Ref<Array>} chars
 * @param {import('vue').Ref<HTMLElement|null>} containerRef
 * @returns {{ cursorStyle: import('vue').ComputedRef<object> }}
 */
export function useCursor(currentIndex, chars, containerRef) {
  const cursorStyle = computed(() => {
    const container = containerRef.value
    if (!container) return { display: 'none' }

    // Find the target char span by data-index attribute
    const span = container.querySelector(`[data-char-index="${currentIndex.value}"]`)

    if (!span) {
      // Past the last char — try to position after the last span
      const lastIndex = chars.value.length - 1
      if (lastIndex < 0) return { display: 'none' }
      const lastSpan = container.querySelector(`[data-char-index="${lastIndex}"]`)
      if (!lastSpan) return { display: 'none' }

      const containerRect = container.getBoundingClientRect()
      const spanRect = lastSpan.getBoundingClientRect()
      return {
        position: 'absolute',
        top: `${spanRect.top - containerRect.top + container.scrollTop}px`,
        left: `${spanRect.right - containerRect.left}px`,
        width: '2px',
        height: `${spanRect.height}px`,
      }
    }

    const containerRect = container.getBoundingClientRect()
    const spanRect = span.getBoundingClientRect()

    return {
      position: 'absolute',
      top: `${spanRect.top - containerRect.top + container.scrollTop}px`,
      left: `${spanRect.left - containerRect.left}px`,
      width: '2px',
      height: `${spanRect.height}px`,
    }
  })

  return { cursorStyle }
}
