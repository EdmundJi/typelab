<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['complete'])

/* ==================== 状态初始化 ==================== */
const chars = ref([])
const currentIndex = ref(0)
const container = ref(null)
let isCompleted = false
let startTime = null
let totalErrors = 0

/* ==================== 监听 text 变化，重置状态 ==================== */
watch(
  () => props.text,
  async (newText) => {
    chars.value = newText.split('').map((char) => ({
      char,
      status: 'pending',
    }))
    currentIndex.value = 0
    isCompleted = false
    startTime = null
    totalErrors = 0

    await nextTick()
    container.value?.focus()
  },
  { immediate: true },
)

/* ==================== WPM 计算 ==================== */
function calculateWpm() {
  if (!startTime) return 0
  const elapsedMinutes = (Date.now() - startTime) / 60000
  if (elapsedMinutes === 0) return 0
  return Math.round(chars.value.length / 5 / elapsedMinutes)
}

/* ==================== 准确率计算 ==================== */
function calculateAccuracy() {
  if (chars.value.length === 0) return 100
  const correctCount = chars.value.filter((c) => c.status === 'correct').length
  return parseFloat(((correctCount / chars.value.length) * 100).toFixed(1))
}

/* ==================== 键盘事件处理 ==================== */
function handleKeyDown(e) {
  if (isCompleted) return

  if (e.ctrlKey || e.metaKey || e.altKey) return

  if (e.key === 'Backspace') {
    if (currentIndex.value > 0) {
      currentIndex.value--
      chars.value[currentIndex.value].status = 'pending'
    }
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
    class="font-mono text-lg leading-relaxed whitespace-pre-wrap break-words"
    tabindex="0"
    @keydown="handleKeyDown"
    @click="container?.focus()"
  >
    <span
      v-for="(item, index) in chars"
      :key="index"
      class="relative"
      :class="{
        'text-slate-400': item.status === 'pending',
        'text-green-600': item.status === 'correct',
        'text-red-500': item.status === 'wrong',
        'caret': index === currentIndex,
      }"
    >{{ item.char }}</span>
    <span
      v-if="currentIndex >= chars.length && chars.length > 0"
      class="caret"
    ></span>
  </div>
</template>

<style scoped>
.caret::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #3b82f6;
  margin-left: 1px;
  animation: blink 1s infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
