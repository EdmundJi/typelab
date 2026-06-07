<script setup>
import { computed } from 'vue'

const props = defineProps({
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  duration: { type: Number, required: true },
  errors: { type: Number, required: true },
  bestWpm: { type: Number, default: null },
})

const formattedDuration = computed(() => {
  const secs = props.duration
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
})

const isNewRecord = computed(() => props.bestWpm !== null && props.wpm > props.bestWpm)
</script>

<template>
  <div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-mt-surface border border-mt-border rounded-lg p-5">
        <p class="text-xs text-mt-sub mb-1">wpm</p>
        <p class="text-3xl font-bold text-mt-accent">{{ wpm }}</p>
      </div>
      <div class="bg-mt-surface border border-mt-border rounded-lg p-5">
        <p class="text-xs text-mt-sub mb-1">accuracy</p>
        <p class="text-3xl font-bold text-mt-text">{{ accuracy }}<span class="text-lg text-mt-sub">%</span></p>
      </div>
      <div class="bg-mt-surface border border-mt-border rounded-lg p-5">
        <p class="text-xs text-mt-sub mb-1">time</p>
        <p class="text-3xl font-bold text-mt-text">{{ formattedDuration }}</p>
      </div>
      <div class="bg-mt-surface border border-mt-border rounded-lg p-5">
        <p class="text-xs text-mt-sub mb-1">errors</p>
        <p class="text-3xl font-bold" :class="errors > 0 ? 'text-mt-wrong' : 'text-mt-text'">{{ errors }}</p>
      </div>
    </div>

    <div v-if="bestWpm !== null" class="mt-4 flex items-center gap-3 px-1">
      <span class="text-xs text-mt-sub">历史最佳 {{ bestWpm }} wpm</span>
      <span v-if="isNewRecord" class="text-xs text-mt-accent font-semibold">新纪录 ↑</span>
      <span v-else-if="wpm === bestWpm" class="text-xs text-mt-sub">持平</span>
      <span v-else class="text-xs text-mt-sub">差 {{ bestWpm - wpm }} wpm</span>
    </div>
  </div>
</template>
