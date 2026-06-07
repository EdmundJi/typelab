<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TypingEngine from '@/components/TypingEngine/TypingEngine.vue'
import { findLessonById } from '@/lib/db'

const route = useRoute()
const router = useRouter()

const lesson = ref(null)
const loading = ref(true)
const notFound = ref(false)

const liveWpm = ref(0)
const liveAccuracy = ref(100)
const progress = ref(0)
const elapsed = ref(0)
const started = ref(false)

let timerInterval = null

async function loadLesson(id) {
  loading.value = true
  notFound.value = false
  clearTimer()
  resetStats()

  const data = await findLessonById(id)
  if (!data) {
    notFound.value = true
    loading.value = false
    return
  }
  lesson.value = data
  loading.value = false
}

function resetStats() {
  liveWpm.value = 0
  liveAccuracy.value = 100
  progress.value = 0
  elapsed.value = 0
  started.value = false
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function handleUpdate({ progress: p, liveWpm: wpm, liveAccuracy: acc }) {
  progress.value = p
  liveWpm.value = wpm
  liveAccuracy.value = acc

  if (!started.value && p > 0) {
    started.value = true
    timerInterval = setInterval(() => {
      elapsed.value++
    }, 1000)
  }
}

function handleComplete(result) {
  clearTimer()
  router.push({
    name: 'result',
    state: {
      result: {
        ...result,
        lessonId: lesson.value.id,
      },
    },
  })
}

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

onMounted(() => loadLesson(route.params.id))
watch(() => route.params.id, (id) => loadLesson(id))
onBeforeUnmount(() => clearTimer())
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-32">
      <span class="text-mt-sub text-sm">加载中...</span>
    </div>

    <div v-else-if="notFound" class="flex flex-col items-center justify-center py-32 gap-4">
      <p class="text-mt-sub">课程未找到</p>
      <RouterLink :to="{ name: 'home' }" class="text-mt-accent text-sm hover:opacity-80">← 返回课程列表</RouterLink>
    </div>

    <template v-else-if="lesson">
      <div class="mb-6 flex items-center gap-3">
        <RouterLink :to="{ name: 'home' }" class="text-mt-sub text-sm hover:text-mt-text transition-colors">
          ← 课程列表
        </RouterLink>
        <span class="text-mt-border">|</span>
        <span class="text-mt-text text-sm font-semibold">{{ lesson.title }}</span>
      </div>

      <!-- live stats bar -->
      <div class="mb-6 flex items-center gap-8 text-sm">
        <div>
          <span class="text-mt-sub text-xs block mb-0.5">wpm</span>
          <span class="text-mt-accent font-bold text-xl">{{ started ? liveWpm : '—' }}</span>
        </div>
        <div>
          <span class="text-mt-sub text-xs block mb-0.5">acc</span>
          <span class="text-mt-text font-bold text-xl">{{ started ? liveAccuracy + '%' : '—' }}</span>
        </div>
        <div>
          <span class="text-mt-sub text-xs block mb-0.5">time</span>
          <span class="text-mt-text font-bold text-xl">{{ started ? formatTime(elapsed) : '—' }}</span>
        </div>
        <div class="flex-1">
          <div class="h-0.5 bg-mt-border rounded overflow-hidden">
            <div
              class="h-full bg-mt-accent transition-all duration-200"
              :style="{ width: `${(progress * 100).toFixed(1)}%` }"
            />
          </div>
        </div>
      </div>

      <!-- typing area -->
      <div class="rounded-lg bg-mt-surface border border-mt-border p-6">
        <TypingEngine
          :text="lesson.text"
          @update="handleUpdate"
          @complete="handleComplete"
        />
      </div>

      <p class="mt-4 text-center text-xs text-mt-sub">
        点击文本区域开始 · Backspace 删除 · Tab/Enter 输入对应字符
      </p>
    </template>
  </div>
</template>
