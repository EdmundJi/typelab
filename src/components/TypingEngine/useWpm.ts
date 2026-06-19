import { computed } from 'vue'

/**
 * useWpm — WPM calculation based on typedCharCount (auto-skipped chars excluded).
 *
 * @param {import('vue').Ref<number>} typedCharCount — only user-typed chars (no auto-skip)
 * @param {import('vue').Ref<number|null>} startTime  — Date.now() timestamp or null
 * @returns {{ wpm: import('vue').ComputedRef<number> }}
 */
export function useWpm(typedCharCount, startTime) {
  const wpm = computed(() => {
    if (!startTime.value) return 0
    const elapsedMinutes = (Date.now() - startTime.value) / 60000
    if (elapsedMinutes <= 0) return 0
    return Math.round(typedCharCount.value / 5 / elapsedMinutes)
  })

  return { wpm }
}
