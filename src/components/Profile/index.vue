<script setup>
import { computed } from 'vue'
import ProfileHistory from './ProfileHistory.vue'
import ProgressChart from './ProgressChart.vue'

const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
  getLessonTitle: {
    type: Function,
    required: true,
  },
})

const stats = computed(() => {
  const count = props.results.length
  if (count === 0) {
    return { count: 0, avgWpm: 0, maxWpm: 0 }
  }

  let wpmSum = 0
  let maxWpm = 0
  for (const result of props.results) {
    wpmSum += Number(result.wpm) || 0
    const wpm = Number(result.wpm) || 0
    if (wpm > maxWpm) maxWpm = wpm
  }

  return {
    count,
    avgWpm: Math.round(wpmSum / count),
    maxWpm,
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-slate-500">总练习次数</div>
        <div class="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">{{ stats.count }}</div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-slate-500">平均 WPM</div>
        <div class="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">{{ stats.avgWpm }}</div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-slate-500">最高 WPM</div>
        <div class="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">{{ stats.maxWpm }}</div>
      </div>
    </div>

    <ProgressChart :results="results" />

    <ProfileHistory :results="results" :get-lesson-title="getLessonTitle" />
  </div>
</template>
