<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResultSummary from '@/components/Result/ResultSummary.vue'
import { getBestLessonWpm, listUserResults, saveResult } from '@/lib/adapters/db'
import { getLessonById, listLessons } from '@/lib/application/lessons'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const result = ref<any>(null)
const bestWpm = ref<number | null>(null)
const saving = ref(false)
const lesson = ref<any>(null)
const recommendation = ref<any>(null)
const copied = ref(false)
const copyError = ref('')
const shouldPersist = ref(false)
const formattedDuration = computed(() => {
  const secs = result.value?.duration ?? 0
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
})

function parseQueryResult() {
  const lessonId = Array.isArray(route.query.lessonId)
    ? route.query.lessonId[0]
    : route.query.lessonId
  const wpm = Number(route.query.wpm)
  const accuracy = Number(route.query.accuracy)
  const duration = Number(route.query.duration)
  const errors = Number(route.query.errors)
  const valid =
    lessonId &&
    Number.isFinite(wpm) &&
    wpm >= 0 &&
    wpm <= 300 &&
    Number.isFinite(accuracy) &&
    accuracy >= 0 &&
    accuracy <= 100 &&
    Number.isFinite(duration) &&
    duration > 0 &&
    duration <= 24 * 60 * 60 &&
    Number.isInteger(errors) &&
    errors >= 0
  return valid ? { wpm, accuracy, duration, errors, lessonId } : null
}

onMounted(async () => {
  const state = history.state?.result
  const hasQueryParams = route.query.wpm
  if (!state && !hasQueryParams) {
    router.replace({ name: 'home' })
    return
  }
  result.value = state ?? parseQueryResult()
  shouldPersist.value = Boolean(state)
  if (!result.value) {
    router.replace({ name: 'home' })
    return
  }
  lesson.value = await getLessonById(
    String(result.value.lessonId).startsWith('community:')
      ? result.value.lessonId
      : `builtin:${result.value.lessonId}`,
  )
  if (userStore.user && shouldPersist.value) {
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
        variant_id: result.value.variant_id ?? null,
      })
    } finally {
      saving.value = false
    }
  }
  await loadRecommendation()
})

async function loadRecommendation() {
  try {
    const all = await listLessons()
    const category = lesson.value?.category
    if (!category) return
    let completed = new Set<string>()
    if (userStore.user?.id) {
      const { data } = await listUserResults(userStore.user.id)
      completed = new Set(
        (data ?? []).map((r: any) => String(r.lesson_id).replace(/^builtin:/, '')),
      )
    }
    const same = all.filter((l: any) => l.category === category && l.id !== lesson.value?.id)
    recommendation.value =
      same.find((l: any) => !completed.has(String(l.id).replace(/^builtin:/, ''))) ??
      same[Math.floor(Math.random() * same.length)] ??
      null
  } catch {
    recommendation.value = null
  }
}
function tryAgain() {
  router.push({ name: 'lesson', params: { id: result.value.lessonId } })
}
function goHome() {
  router.push({ name: 'home' })
}
async function copyResult() {
  if (!result.value) return
  const title = lesson.value?.title ?? result.value.lessonId
  try {
    await navigator.clipboard.writeText(
      `keylab — ${title}\nWPM: ${result.value.wpm} | 准确率: ${result.value.accuracy}% | 时间: ${formattedDuration.value}`,
    )
    copyError.value = ''
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copyError.value = '复制失败，请手动复制成绩'
  }
}
</script>

<template>
  <div><div v-if="result">
    <div class="mb-8"><p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 成绩</p><h1 class="text-2xl font-bold text-mt-text mb-1">完成</h1><p v-if="saving" class="text-xs text-mt-sub tracking-wide">保存中...</p><p v-else-if="!userStore.session" class="text-xs text-mt-sub tracking-wide"><RouterLink :to="{ name: 'login' }" class="text-mt-accent hover:opacity-80">登录</RouterLink>&nbsp;后成绩自动保存</p></div>
    <div class="relative"><button class="absolute right-2 top-2 z-10 text-xs text-mt-sub hover:text-mt-accent" @click="copyResult">{{ copied ? '✓' : '复制' }}</button><ResultSummary :wpm="result.wpm" :accuracy="result.accuracy" :duration="result.duration" :errors="result.errors" :best-wpm="bestWpm" /><p v-if="copyError" class="mt-2 text-xs text-mt-wrong">{{ copyError }}</p></div>
    <div class="mt-8 flex gap-3"><button class="px-5 py-2 bg-mt-accent text-mt-bg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity" @click="tryAgain">再来一次</button><button class="px-5 py-2 border border-mt-border text-mt-sub text-xs uppercase tracking-widest hover:text-mt-text hover:border-mt-sub transition-colors" @click="goHome">选其他课程</button></div>
    <div v-if="recommendation" class="panel mt-6 p-4"><p class="mb-2 text-xs text-mt-sub tracking-widest">推荐下一课</p><div class="flex items-center justify-between gap-4"><div><p class="text-sm text-mt-text">{{ recommendation.title }}</p><p class="text-xs text-mt-sub">{{ recommendation.variants?.[0]?.language }} · 难度 {{ recommendation.difficulty ?? recommendation.variants?.[0]?.difficulty ?? '★★☆' }}</p></div><RouterLink :to="{ name: 'lesson', params: { id: String(recommendation.id).replace(/^builtin:/, '') } }" class="text-xs text-mt-accent">→ 去练习</RouterLink></div></div>
  </div></div>
</template>
