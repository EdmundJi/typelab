<script setup>
import { computed, ref } from 'vue'
import { lessonMetas } from '@/lessons/index.js'
import LessonFilter from './LessonFilter.vue'
import LessonList from './LessonList.vue'

const activeCategory = ref('all')

const categories = ['all', ...new Set(lessonMetas.map((l) => l.category))]

const filteredLessons = computed(() => {
  if (activeCategory.value === 'all') {
    return lessonMetas
  }
  return lessonMetas.filter((l) => l.category === activeCategory.value)
})
</script>

<template>
  <section>
    <LessonFilter
      :categories="categories"
      :active-category="activeCategory"
      @update:active-category="activeCategory = $event"
    />

    <div class="mt-6">
      <LessonList :lessons="filteredLessons" />
    </div>
  </section>
</template>
