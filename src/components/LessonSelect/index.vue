<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import { listUserResults } from '@/lib/adapters/db'
import { listLessons } from '@/lib/application/lessons'
import { useUserStore } from '@/stores/user'
import type { LessonMeta } from '@/types'
import LessonFilter from './LessonFilter.vue'
import LessonList from './LessonList.vue'

const userStore = useUserStore()
const lessons = ref<LessonMeta[]>([])
const loading = ref(true)
const error = ref('')
const activeCategory = ref('all')
const search = ref('')
const language = ref('all')
const bestWpmByLesson = ref(new Map<string, number>())

const categories = computed(() => [
  'all',
  ...new Set(lessons.value.map((l) => l.topic).filter(Boolean)),
])
const languages = computed(() => [
  'all',
  ...new Set(lessons.value.flatMap((l) => l.variants.map((v) => v.language)).filter(Boolean)),
])

const filteredLessons = computed(() =>
  lessons.value.filter((lesson) => {
    const matchesCategory = activeCategory.value === 'all' || lesson.topic === activeCategory.value
    const matchesLanguage =
      language.value === 'all' || lesson.variants.some((v) => v.language === language.value)
    const matchesSearch =
      !search.value || lesson.title?.toLowerCase().includes(search.value.toLowerCase())
    return matchesCategory && matchesLanguage && matchesSearch
  }),
)

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    lessons.value = await listLessons()
    if (userStore.user?.id) {
      const { data } = await listUserResults(userStore.user.id)
      const map = new Map<string, number>()
      for (const result of data ?? []) {
        const key = String(result.lesson_id ?? result.lessonId ?? '').replace(/^builtin:/, '')
        if (key) map.set(key, Math.max(map.get(key) ?? 0, result.wpm))
      }
      bestWpmByLesson.value = map
    }
  } catch (err) {
    console.error(err)
    error.value = '课程加载失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section id="lessons">
    <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="eyebrow mb-2">// practice library</p>
        <h2 class="text-xl font-bold tracking-tight text-mt-text sm:text-2xl">选择一项练习</h2>
        <p class="mt-1 text-sm text-mt-sub">从热身到算法实现，按你的目标开始。</p>
      </div>
      <p v-if="!loading" class="font-mono text-xs text-mt-sub/80">
        {{ filteredLessons.length }} / {{ lessons.length }} lessons
      </p>
    </div>

    <LessonFilter
      :categories="categories"
      :active-category="activeCategory"
      :search="search"
      :languages="languages"
      :language="language"
      @update:active-category="activeCategory = $event"
      @update:search="search = $event"
      @update:language="language = $event"
    />

    <p v-if="error" class="mt-4 text-xs text-mt-wrong">{{ error }}</p>
    <div v-if="loading" class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <SkeletonCard v-for="n in 3" :key="n" />
    </div>
    <div v-else class="mt-5">
      <LessonList :lessons="filteredLessons" :best-wpm-by-lesson="bestWpmByLesson" />
    </div>
  </section>
</template>
