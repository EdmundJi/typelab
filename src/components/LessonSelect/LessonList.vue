<script setup lang="ts">
import type { LessonMeta } from '@/types'
import LessonCard from './LessonCard.vue'

defineProps<{ lessons: LessonMeta[]; bestWpmByLesson?: Map<string, number> }>()
</script>

<template>
  <div v-if="lessons.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <LessonCard v-for="lesson in lessons" :key="lesson.id" :lesson="lesson" :best-wpm="bestWpmByLesson?.get(String(lesson.id).replace(/^builtin:/, ''))" />
  </div>
  <p v-else class="py-16 text-center text-sm text-mt-sub">暂无符合条件的课程</p>
</template>
