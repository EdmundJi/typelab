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
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="panel p-5">
        <p class="stat-label">wpm</p>
        <p class="stat-big text-mt-accent">{{ wpm }}</p>
      </div>
      <div class="panel p-5">
        <p class="stat-label">accuracy</p>
        <p class="stat-big">{{ accuracy }}<span class="text-base text-mt-sub">%</span></p>
      </div>
      <div class="panel p-5">
        <p class="stat-label">time</p>
        <p class="stat-big">{{ formattedDuration }}</p>
      </div>
      <div class="panel p-5">
        <p class="stat-label">errors</p>
        <p class="stat-big" :class="errors > 0 ? 'text-mt-wrong' : 'text-mt-text'">{{ errors }}</p>
      </div>
    </div>

    <div v-if="bestWpm !== null" class="mt-4 flex items-center gap-3 px-1">
      <span class="text-xs text-mt-sub tracking-wide">历史最佳 {{ bestWpm }} wpm</span>
      <span v-if="isNewRecord" class="text-xs text-mt-accent font-semibold tracking-wider uppercase">新纪录 ↑</span>
      <span v-else-if="wpm === bestWpm" class="text-xs text-mt-sub">持平</span>
      <span v-else class="text-xs text-mt-sub">差 {{ bestWpm - wpm }} wpm</span>
    </div>
  </div>
</template>

<style scoped>
.stat-label {
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgb(var(--mt-sub));
  margin-bottom: 6px;
}

.stat-big {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--mt-text));
  line-height: 1;
}
</style>
