<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['complete'])

const chars = ref([])
const currentIndex = ref(0)
const container = ref(null)
let isCompleted = false

watch(
  () => props.text,
  async (newText) => {
    chars.value = newText.split('').map((char) => ({
      char,
      status: 'pending',
    }))
    currentIndex.value = 0
    isCompleted = false

    await nextTick()
    container.value?.focus()
  },
  { immediate: true },
)

function handleKeyDown(e) {
  if (e.key === 'Backspace') {
    if (currentIndex.value > 0) {
      currentIndex.value--
      chars.value[currentIndex.value].status = 'pending'
      isCompleted = false
    }
    return
  }

  if (isCompleted) return
  if (e.isComposing) return
  if (currentIndex.value >= chars.value.length) return

  const expected = chars.value[currentIndex.value].char

  switch (e.key) {
    case 'Tab':
      e.preventDefault()
      chars.value[currentIndex.value].status = expected === '\t' ? 'correct' : 'wrong'
      currentIndex.value++
      break
    case 'Enter':
      chars.value[currentIndex.value].status = expected === '\n' ? 'correct' : 'wrong'
      currentIndex.value++
      break
    case ' ':
      chars.value[currentIndex.value].status =
        expected === '\t' || expected === ' ' ? 'correct' : 'wrong'
      currentIndex.value++
      break
    default:
      if (e.key.length === 1) {
        chars.value[currentIndex.value].status = e.key === expected ? 'correct' : 'wrong'
        currentIndex.value++
      }
  }

  if (currentIndex.value >= chars.value.length) {
    isCompleted = true
    emit('complete')
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
        'caret': index === currentIndex && item.status === 'pending',
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
