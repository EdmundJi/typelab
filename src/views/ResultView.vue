<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getBestLessonWpm, saveResult } from '@/lib/db'
import ResultSummary from '@/components/Result/ResultSummary.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const result = ref(null)
const bestWpm = ref(null)
const saving = ref(false)

onMounted(async () => {
  const state = history.state?.result
  const hasQueryParams = route.query.wpm

  if (!state && !hasQueryParams) {
    router.replace({ name: 'home' })
    return
  }

  if (hasQueryParams) {
    result.value = {
      wpm: Number(route.query.wpm),
      accuracy: Number(route.query.accuracy),
      duration: Number(route.query.duration),
      errors: Number(route.query.errors),
      lessonId: route.query.lessonId,
    }
  } else {
    result.value = state
  }

  if (userStore.user) {
    const { data } = await getBestLessonWpm(userStore.user.id, result.value.lessonId)
    bestWpm.value = data ?? null

    saving.value = true
    try {
      await saveResult({
        user_id: userStore.user.id,
        lesson_id: result.value.lessonId,
        wpm: result.value.wpm,
        accuracy: result.value.accuracy,
        duration: result.value.duration,
        errors: result.value.errors,
      })
    } finally {
      saving.value = false
    }
  }
})

function tryAgain() {
  router.push({ name: 'lesson', params: { id: result.value.lessonId } })
}

function goHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div>
    <div v-if="result">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-mt-text mb-1">成绩</h1>
        <p v-if="saving" class="text-xs text-mt-sub">保存中...</p>
        <p v-else-if="!userStore.session" class="text-xs text-mt-sub">
          <RouterLink :to="{ name: 'login' }" class="text-mt-accent hover:opacity-80">登录</RouterLink>
          后成绩自动保存
        </p>
      </div>

      <ResultSummary
        :wpm="result.wpm"
        :accuracy="result.accuracy"
        :duration="result.duration"
        :errors="result.errors"
        :best-wpm="bestWpm"
      />

      <div class="mt-8 flex gap-3">
        <button
          class="px-5 py-2 bg-mt-accent text-mt-bg text-sm font-semibold rounded hover:opacity-90 transition-opacity"
          @click="tryAgain"
        >
          再来一次
        </button>
        <button
          class="px-5 py-2 bg-mt-surface border border-mt-border text-mt-sub text-sm font-medium rounded hover:text-mt-text transition-colors"
          @click="goHome"
        >
          选其他课程
        </button>
      </div>
    </div>
  </div>
</template>
