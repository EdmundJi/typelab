<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listLessons } from '@/lib/application/lessons'
import { toLessonRef } from '@/lib/domain/lessonRef'

const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
})

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(secs) {
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m${secs % 60 > 0 ? ` ${secs % 60}s` : ''}`
}

const lessonTitles = ref(new Map<string, string>())

onMounted(async () => {
  const lessons = await listLessons()
  lessonTitles.value = new Map(lessons.map((lesson) => [toLessonRef(lesson.id), lesson.title]))
})

function getLessonTitle(lessonId) {
  return lessonTitles.value.get(toLessonRef(lessonId)) ?? lessonId
}

const stats = computed(() => {
  if (props.results.length === 0) return null
  const wpms = props.results.map((r) => r.wpm)
  return {
    best: Math.max(...wpms),
    avg: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
    total: props.results.length,
  }
})
</script>

<template>
  <div>
    <div v-if="stats" class="grid grid-cols-3 gap-4 mb-8">
      <div class="bg-mt-surface border border-mt-border rounded-lg p-4">
        <p class="text-xs text-mt-sub mb-1">最佳 WPM</p>
        <p class="text-2xl font-bold text-mt-accent">{{ stats.best }}</p>
      </div>
      <div class="bg-mt-surface border border-mt-border rounded-lg p-4">
        <p class="text-xs text-mt-sub mb-1">平均 WPM</p>
        <p class="text-2xl font-bold text-mt-text">{{ stats.avg }}</p>
      </div>
      <div class="bg-mt-surface border border-mt-border rounded-lg p-4">
        <p class="text-xs text-mt-sub mb-1">练习次数</p>
        <p class="text-2xl font-bold text-mt-text">{{ stats.total }}</p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-mt-border text-left">
            <th class="pb-3 pr-4 text-xs text-mt-sub font-medium">课程</th>
            <th class="pb-3 pr-4 text-xs text-mt-sub font-medium text-right">wpm</th>
            <th class="pb-3 pr-4 text-xs text-mt-sub font-medium text-right">accuracy</th>
            <th class="pb-3 pr-4 text-xs text-mt-sub font-medium text-right">time</th>
            <th class="pb-3 text-xs text-mt-sub font-medium text-right">date</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in results"
            :key="r.id"
            class="border-b border-mt-border last:border-0"
          >
            <td class="py-3 pr-4 text-mt-sub text-xs max-w-40 truncate">{{ getLessonTitle(r.lesson_id) }}</td>
            <td class="py-3 pr-4 text-right font-bold text-mt-accent">{{ r.wpm }}</td>
            <td class="py-3 pr-4 text-right text-mt-text">{{ r.accuracy }}%</td>
            <td class="py-3 pr-4 text-right text-mt-sub">{{ formatDuration(r.duration) }}</td>
            <td class="py-3 text-right text-mt-sub text-xs">{{ formatDate(r.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
