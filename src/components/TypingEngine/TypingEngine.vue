<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['complete', 'update'])

const chars = ref([])
const currentIndex = ref(0)
const container = ref(null)
let isCompleted = false
let startTime = null
let totalErrors = 0

watch(
  () => props.text,
  async (newText) => {
    chars.value = newText.split('').map((char) => ({ char, status: 'pending' }))
    currentIndex.value = 0
    isCompleted = false
    startTime = null
    totalErrors = 0

    await nextTick()
    container.value?.focus()
  },
  { immediate: true },
)

function calculateWpm() {
  if (!startTime) return 0
  const elapsedMinutes = (Date.now() - startTime) / 60000
  if (elapsedMinutes === 0) return 0
  return Math.round(chars.value.length / 5 / elapsedMinutes)
}

function calculateAccuracy() {
  if (chars.value.length === 0) return 100
  const correctCount = chars.value.filter((c) => c.status === 'correct').length
  return parseFloat(((correctCount / chars.value.length) * 100).toFixed(1))
}

function emitUpdate() {
  const typed = currentIndex.value
  const total = chars.value.length
  const correctCount = chars.value.filter((c) => c.status === 'correct').length
  let liveWpm = 0
  if (startTime) {
    const mins = (Date.now() - startTime) / 60000
    liveWpm = mins > 0 ? Math.round(correctCount / 5 / mins) : 0
  }
  emit('update', {
    progress: total > 0 ? typed / total : 0,
    liveWpm,
    liveAccuracy: typed > 0 ? parseFloat(((correctCount / typed) * 100).toFixed(1)) : 100,
  })
}

function handleKeyDown(e) {
  if (isCompleted) return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  if (e.key === 'Backspace') {
    if (currentIndex.value > 0) {
      currentIndex.value--
      chars.value[currentIndex.value].status = 'pending'
    }
    emitUpdate()
    return
  }

  if (e.isComposing) return
  if (currentIndex.value >= chars.value.length) return

  if (!startTime) {
    startTime = Date.now()
  }

  const expected = chars.value[currentIndex.value].char

  switch (e.key) {
    case 'Tab':
      e.preventDefault()
      chars.value[currentIndex.value].status = expected === '\t' ? 'correct' : 'wrong'
      if (expected !== '\t') totalErrors++
      currentIndex.value++
      break
    case 'Enter':
      e.preventDefault()
      chars.value[currentIndex.value].status = expected === '\n' ? 'correct' : 'wrong'
      if (expected !== '\n') totalErrors++
      currentIndex.value++
      break
    case ' ':
      if (expected === '\t') {
        chars.value[currentIndex.value].status = 'correct'
      } else {
        chars.value[currentIndex.value].status = e.key === expected ? 'correct' : 'wrong'
        if (e.key !== expected) totalErrors++
      }
      currentIndex.value++
      break
    default:
      if (e.key.length === 1) {
        chars.value[currentIndex.value].status = e.key === expected ? 'correct' : 'wrong'
        if (e.key !== expected) totalErrors++
        currentIndex.value++
      }
  }

  emitUpdate()

  if (currentIndex.value >= chars.value.length) {
    isCompleted = true
    const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000))
    emit('complete', {
      wpm: calculateWpm(),
      accuracy: calculateAccuracy(),
      duration,
      errors: totalErrors,
    })
  }
}
</script>

<template>
  <div
    ref="container"
    class="typing-area font-mono text-lg leading-relaxed whitespace-pre-wrap break-words outline-none"
    tabindex="0"
    @keydown="handleKeyDown"
    @click="container?.focus()"
  >
    <span
      v-for="(item, index) in chars"
      :key="index"
      class="relative"
      :class="{
        'char-pending': item.status === 'pending',
        'char-correct': item.status === 'correct',
        'char-wrong': item.status === 'wrong',
        'char-wrong-space': item.status === 'wrong' && item.char === ' ',
        'caret': index === currentIndex,
      }"
    >{{ item.char }}</span>
    <span v-if="currentIndex >= chars.length && chars.length > 0" class="caret" />
  </div>
</template>

<style scoped>
.typing-area {
  cursor: text;
  user-select: none;
}

.char-pending { color: rgb(var(--mt-sub)); }
.char-correct { color: rgb(var(--mt-text)); }
.char-wrong   { color: rgb(var(--mt-wrong)); }

.char-wrong-space {
  background-color: rgb(var(--mt-wrong) / 0.25);
  border-radius: 2px;
}

.caret::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.1em;
  width: 2px;
  height: 0.85em;
  background: rgb(var(--mt-caret));
  border-radius: 1px;
  animation: blink 1.1s step-start infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
