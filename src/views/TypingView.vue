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
watch(
  () => route.params.id,
  (id) => loadLesson(id),
)
onBeforeUnmount(() => clearTimer())
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-32">
      <span class="text-mt-sub text-xs tracking-widest uppercase">loading...</span>
    </div>

    <div v-else-if="notFound" class="flex flex-col items-center justify-center py-32 gap-4">
      <p class="text-mt-sub text-sm">课程未找到</p>
      <RouterLink :to="{ name: 'home' }" class="text-mt-accent text-xs uppercase tracking-widest hover:opacity-80">
        ← 返回课程列表
      </RouterLink>
    </div>

    <template v-else-if="lesson">
      <!-- breadcrumb -->
      <div class="mb-8 flex items-center gap-2 text-xs">
        <RouterLink :to="{ name: 'home' }" class="text-mt-sub hover:text-mt-accent transition-colors uppercase tracking-widest">
          练习
        </RouterLink>
        <span class="text-mt-border">/</span>
        <span class="text-mt-sub uppercase tracking-widest">{{ lesson.title }}</span>
      </div>

      <!-- stats bar: terminal-style -->
      <div class="panel mb-6 px-5 py-3 flex items-center gap-8">
        <div class="stat-item">
          <span class="stat-label">wpm</span>
          <span class="stat-value text-mt-accent">{{ started ? liveWpm : '—' }}</span>
        </div>
        <div class="divider" />
        <div class="stat-item">
          <span class="stat-label">acc</span>
          <span class="stat-value">{{ started ? liveAccuracy + '%' : '—' }}</span>
        </div>
        <div class="divider" />
        <div class="stat-item">
          <span class="stat-label">time</span>
          <span class="stat-value">{{ started ? formatTime(elapsed) : '—' }}</span>
        </div>
        <div class="flex-1 ml-4">
          <div class="relative h-px bg-mt-border overflow-visible">
            <div
              class="absolute inset-y-0 left-0 bg-mt-accent transition-all duration-200"
              :style="{ width: `${(progress * 100).toFixed(1)}%` }"
            />
            <!-- tick marks -->
            <div
              v-for="n in 4"
              :key="n"
              class="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-mt-border -mt-px"
              :style="{ left: `${n * 25}%` }"
            />
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-mt-sub/40 text-xs">0</span>
            <span class="text-mt-accent/60 text-xs">{{ (progress * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- typing area -->
      <div class="panel p-6">
        <TypingEngine
          :text="lesson.text"
          @update="handleUpdate"
          @complete="handleComplete"
        />
      </div>

      <p class="mt-4 text-center text-xs text-mt-sub/50 tracking-wide">
        点击文本区域开始 · Backspace 删除 · Tab/Enter 输入对应字符
      </p>
    </template>
  </div>
</template>

<style scoped>
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgb(var(--mt-sub));
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--mt-text));
  line-height: 1;
}

.divider {
  width: 1px;
  height: 2rem;
  background: rgb(var(--mt-border));
  flex-shrink: 0;
}
</style>
