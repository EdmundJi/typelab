<script setup>
import LessonCard from './LessonCard.vue'

defineProps({
  lessons: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div v-if="lessons.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <LessonCard v-for="lesson in lessons" :key="lesson.id" :lesson="lesson" />
  </div>
  <p v-else class="py-16 text-center text-sm text-mt-sub">暂无该分类的课程</p>
</template>
