<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listUserResults } from '@/lib/adapters/db'
import { getLessonById } from '@/lib/application/lessons'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  path: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const userStore = useUserStore()

const resolvedItems = ref([])
const loading = ref(true)

onMounted(async () => {
  const userId = userStore.user?.id ?? null

  // Load user results to determine completion status
  let completedRefs = new Set()
  if (userId) {
    const { data: results } = await listUserResults(userId)
    if (results) {
      for (const r of results) {
        completedRefs.add(r.lesson_id)
      }
    }
  }

  // Resolve each path item
  const items = await Promise.all(
    (props.path.items ?? []).map(async (item) => {
      const lesson = await getLessonById(item.lesson_ref)
      return {
        ...item,
        lesson,
        completed: completedRefs.has(item.lesson_ref),
      }
    }),
  )
  resolvedItems.value = items
  loading.value = false
})

function getLessonId(lessonRef) {
  // Extract the id part from 'builtin:<id>' or 'community:<uuid>'
  const colonIdx = lessonRef.indexOf(':')
  return colonIdx !== -1 ? lessonRef.slice(colonIdx + 1) : lessonRef
}

function goToLesson(item) {
  if (!item.lesson) return
  router.push({ name: 'lesson', params: { id: getLessonId(item.lesson_ref) } })
}
</script>

<template>
  <div class="path-detail">
    <div class="mb-6">
      <h2 class="text-mt-fg font-bold text-sm tracking-widest uppercase mb-1">{{ path.name }}</h2>
      <p class="text-mt-sub text-xs">{{ path.description }}</p>
    </div>

    <div v-if="loading" class="space-y-2" aria-label="正在加载路径详情">
      <div v-for="i in 4" :key="i" class="h-12 border border-mt-border bg-mt-bg animate-pulse rounded" />
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="item in resolvedItems"
        :key="item.id"
        class="flex items-center gap-3 p-3 border border-mt-border bg-mt-bg hover:border-mt-accent/50 transition-colors"
        :class="item.lesson ? 'cursor-pointer' : 'opacity-60 cursor-default'"
        @click="item.lesson && goToLesson(item)"
      >
        <!-- Position badge -->
        <span class="text-mt-sub text-xs font-mono w-5 shrink-0 text-center">{{ item.position }}</span>

        <!-- Completion indicator -->
        <span
          class="w-4 h-4 shrink-0 flex items-center justify-center border text-xs font-bold"
          :class="item.completed
            ? 'border-mt-accent text-mt-accent'
            : 'border-mt-border text-mt-border'"
        >
          <template v-if="item.completed">✓</template>
        </span>

        <!-- Lesson info -->
        <div class="flex-1 min-w-0">
          <template v-if="item.lesson">
            <span class="text-mt-fg text-xs truncate block">{{ item.lesson.title }}</span>
          </template>
          <template v-else>
            <span class="text-mt-sub text-xs italic">题目已下架</span>
          </template>
        </div>

        <!-- Arrow indicator -->
        <span v-if="item.lesson" class="text-mt-sub text-xs shrink-0">›</span>
      </li>
    </ul>
  </div>
</template>
