<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import LineNumbers from './LineNumbers.vue'
import { useCursor } from './useCursor'
import { useTypingState } from './useTypingState'

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'text',
  },
})

const emit = defineEmits(['complete', 'update', 'reset'])

// ── Prism lazy-load ─────────────────────────────────────────────────────────
let Prism = null
// tokenClassMap: char-index → 'token keyword' etc.
const tokenClassMap = ref({})

async function loadLanguageAndTokenize(text, lang) {
  // Try to load Prism core
  if (!Prism) {
    try {
      Prism = (await import('prismjs')).default
    } catch {
      tokenClassMap.value = {}
      return
    }
  }

  if (!text || lang === 'text' || lang === 'plaintext') {
    tokenClassMap.value = {}
    return
  }

  // Try to load language component
  if (!Prism.languages[lang]) {
    try {
      await import(/* @vite-ignore */ `prismjs/components/prism-${lang}.js`)
    } catch {
      // Language not supported — fall through to plaintext
      tokenClassMap.value = {}
      return
    }
  }

  const grammar = Prism.languages[lang]
  if (!grammar) {
    tokenClassMap.value = {}
    return
  }

  const classMap = {}
  let charOffset = 0

  function flattenContent(content) {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) return content.map(flattenContent).join('')
    if (content && typeof content === 'object' && content.content)
      return flattenContent(content.content)
    return ''
  }

  function processTokens(tokens) {
    for (const token of tokens) {
      if (typeof token === 'string') {
        charOffset += token.length
      } else {
        const content =
          typeof token.content === 'string' ? token.content : flattenContent(token.content)
        const className = `token ${token.type}`
        for (let i = 0; i < content.length; i++) {
          classMap[charOffset + i] = className
        }
        charOffset += content.length
      }
    }
  }

  try {
    const tokens = Prism.tokenize(text, grammar)
    processTokens(tokens)
    tokenClassMap.value = classMap
  } catch {
    tokenClassMap.value = {}
  }
}

// ── chars ref shared between composables ───────────────────────────────────
const chars = ref([])
const container = ref(null)
const startTime = ref(null)
let isCompleted = false
let totalErrors = 0
let grossTypedCount = 0

// ── Composables ─────────────────────────────────────────────────────────────
const {
  cursorIndex,
  typedCharCount,
  handleKey: stateHandleKey,
  resetCursor,
} = useTypingState(chars)
const { cursorStyle } = useCursor(cursorIndex, chars, container)

// ── Current line calculation ───────────────────────────────────────────────
const totalLines = computed(() => Math.max(1, props.text.split('\n').length))
const currentLine = computed(() => {
  let line = 1
  for (let i = 0; i < cursorIndex.value && i < chars.value.length; i++) {
    if (chars.value[i].char === '\n') line++
  }
  return line
})

const currentLineRange = computed(() => {
  const cursor = Math.min(cursorIndex.value, props.text.length)
  const start = props.text.lastIndexOf('\n', Math.max(0, cursor - 1)) + 1
  const nextBreak = props.text.indexOf('\n', cursor)
  return { start, end: nextBreak === -1 ? props.text.length : nextBreak }
})

function isCurrentLineIndex(index: number) {
  return index >= currentLineRange.value.start && index <= currentLineRange.value.end
}

// ── Reset on text change ────────────────────────────────────────────────────
watch(
  () => props.text,
  async (newText) => {
    chars.value = newText.split('').map((char) => ({ char, status: 'pending' }))
    isCompleted = false
    startTime.value = null
    totalErrors = 0
    grossTypedCount = 0
    resetCursor()

    // Re-tokenize
    loadLanguageAndTokenize(newText, props.language)

    await nextTick()
    container.value?.focus()
  },
  { immediate: true },
)

watch(cursorIndex, async () => {
  await nextTick()
  const el = container.value
  const target = el?.querySelector(`[data-char-index="${cursorIndex.value}"]`) as HTMLElement | null
  if (!el || !target) return

  const safeEdge = 40
  const containerRect = el.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const left = targetRect.left - containerRect.left + el.scrollLeft
  const right = targetRect.right - containerRect.left + el.scrollLeft
  if (left < el.scrollLeft + safeEdge) {
    el.scrollLeft = Math.max(0, left - safeEdge)
  } else if (right > el.scrollLeft + el.clientWidth - safeEdge) {
    el.scrollLeft = right - el.clientWidth + safeEdge
  }
})

// Re-tokenize when language changes
watch(
  () => props.language,
  (lang) => {
    loadLanguageAndTokenize(props.text, lang)
  },
)

// ── Accuracy calculation ────────────────────────────────────────────────────
// Uses gross keystrokes (never decremented by backspace) so corrected errors still count.
function calculateAccuracy() {
  if (grossTypedCount === 0) return 100
  return parseFloat(
    (Math.max(0, (grossTypedCount - totalErrors) / grossTypedCount) * 100).toFixed(1),
  )
}

function emitUpdate() {
  const typed = cursorIndex.value
  const total = chars.value.length
  const correctCount = chars.value.filter((c) => c.status === 'correct').length
  let liveWpm: number | null = null
  if (startTime.value) {
    const elapsedMs = Date.now() - startTime.value
    const mins = elapsedMs / 60000
    liveWpm = elapsedMs >= 1000 && grossTypedCount >= 5 ? Math.round(correctCount / 5 / mins) : null
  }
  emit('update', {
    progress: total > 0 ? typed / total : 0,
    liveWpm,
    liveAccuracy:
      grossTypedCount > 0
        ? parseFloat(
            (Math.max(0, (grossTypedCount - totalErrors) / grossTypedCount) * 100).toFixed(1),
          )
        : 100,
  })
}

function resetState() {
  chars.value = props.text.split('').map((char) => ({ char, status: 'pending' }))
  isCompleted = false
  startTime.value = null
  totalErrors = 0
  grossTypedCount = 0
  resetCursor()
  emitUpdate()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    resetState()
    emit('reset')
    return
  }
  if (isCompleted) return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  if (e.key === 'Tab' || e.key === 'Enter') {
    e.preventDefault()
  }

  if (e.isComposing) return

  // Start timer on first meaningful key
  if (e.key !== 'Backspace' && !startTime.value && cursorIndex.value < chars.value.length) {
    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Tab') {
      startTime.value = Date.now()
    }
  }

  // Track errors before state change
  const prevIndex = cursorIndex.value
  const result = stateHandleKey(e.key)

  if (result === 'ignore') return

  // Track gross keystrokes and errors (never decremented by backspace)
  if (result === 'advance' && prevIndex < chars.value.length) {
    grossTypedCount++
    if (chars.value[prevIndex].status === 'wrong') {
      totalErrors++
    }
  }

  emitUpdate()

  if (cursorIndex.value >= chars.value.length && !isCompleted) {
    isCompleted = true
    const elapsed = startTime.value
      ? Math.max(1, Math.floor((Date.now() - startTime.value) / 1000))
      : 1
    const elapsedMinutes = elapsed / 60
    const finalWpm = elapsedMinutes > 0 ? Math.round(typedCharCount.value / 5 / elapsedMinutes) : 0
    emit('complete', {
      wpm: finalWpm,
      accuracy: calculateAccuracy(),
      duration: elapsed,
      errors: totalErrors,
    })
  }
}
</script>

<template>
  <div class="typing-engine-wrapper font-mono text-base sm:text-lg leading-relaxed">
    <div class="typing-content">
      <LineNumbers :text="props.text" :current-line="currentLine" />

      <div
        ref="container"
        class="typing-area whitespace-pre overflow-x-auto outline-none"
        tabindex="0"
        role="textbox"
        aria-label="代码打字练习区"
        aria-multiline="true"
        aria-readonly="true"
        style="position: relative"
        @keydown="handleKeyDown"
        @click="container?.focus()"
      >
        <span
          v-for="(item, index) in chars"
          :key="index"
          :data-char-index="index"
          class="relative"
          :class="[
            {
              'char-pending': item.status === 'pending',
              'char-correct': item.status === 'correct',
              'char-wrong': item.status === 'wrong',
              'char-wrong-space': item.status === 'wrong' && item.char === ' ',
              'char-current-line': item.status === 'pending' && isCurrentLineIndex(index),
            },
            tokenClassMap[index] || '',
          ]"
        >{{ item.char }}</span>

        <!-- Floating caret div (replaces ::before) -->
        <div
          v-if="chars.length > 0"
          class="caret-div"
          :style="cursorStyle"
        />
      </div>
    </div>
    <div class="typing-help mt-4 flex w-full items-start justify-between gap-3 font-sans text-xs text-mt-sub">
      <span class="desktop-help">Esc 重置 · Backspace 删除 · Tab/Enter 输入对应字符</span>
      <span class="mobile-help">建议横屏或连接实体键盘，输入时会自动跟随光标</span>
      <span class="font-mono whitespace-nowrap">行 {{ currentLine }}/{{ totalLines }}</span>
    </div>
  </div>
</template>

<style scoped>
.typing-engine-wrapper {
  display: flex;
  flex-direction: column;
}

.typing-content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.typing-area {
  cursor: text;
  user-select: none;
  flex: 1;
  min-width: 0;
}

.char-pending { color: rgb(var(--mt-sub) / 0.68); }
.char-pending.char-current-line { color: rgb(var(--mt-sub)); }
.char-correct { color: rgb(var(--mt-text)); }
.char-wrong   {
  color: rgb(var(--mt-wrong));
  background: rgb(var(--mt-wrong) / 0.1);
  text-decoration: underline;
  text-decoration-color: rgb(var(--mt-wrong) / 0.75);
  text-underline-offset: 3px;
}

.char-wrong-space {
  background-color: rgb(var(--mt-wrong) / 0.25);
  border-radius: 2px;
}

/* Floating caret */
.caret-div {
  pointer-events: none;
  background: rgb(var(--mt-caret));
  border-radius: 1px;
  animation: blink 1.1s step-start infinite;
  z-index: 10;
}

.mobile-help {
  display: none;
}

@media (max-width: 639px) {
  .line-numbers {
    width: 2.25rem;
  }

  .desktop-help {
    display: none;
  }

  .mobile-help {
    display: inline;
    line-height: 1.55;
  }
}

@keyframes blink {
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .caret-div {
    animation: none;
  }
}
</style>
