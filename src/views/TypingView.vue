<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VariantSelector from '@/components/LessonSelect/VariantSelector.vue'
import TypingEngine from '@/components/TypingEngine/TypingEngine.vue'
import { listUserResults } from '@/lib/adapters/db'
import { evaluateAndUnlock } from '@/lib/application/achievementEvaluator'
import { getLessonById } from '@/lib/application/lessons'
import { ACHIEVEMENTS } from '@/lib/domain/achievements'
import { toLessonRef } from '@/lib/domain/lessonRef'
import { useStreakStore } from '@/stores/streak'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const streakStore = useStreakStore()

// Toast state
const toasts = ref([])
let toastIdSeq = 0

function showToast(message) {
  const id = ++toastIdSeq
  toasts.value.push({ id, message })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3500)
}

const lesson = ref(null)
const loading = ref(true)
const notFound = ref(false)

const liveWpm = ref<number | null>(null)
const liveAccuracy = ref(100)
const progress = ref(0)
const elapsed = ref(0)
const started = ref(false)

const selectedVariantId = ref(null)
const resetKey = ref(0)

let timerInterval = null

const currentVariant = computed(() => {
  if (!lesson.value?.variants) return null
  return lesson.value.variants.find((v) => v.variant_id === selectedVariantId.value) ?? null
})

// Reset typing progress when variant changes
watch(selectedVariantId, () => {
  resetStats()
})

async function loadLesson(id: any) {
  loading.value = true
  notFound.value = false
  clearTimer()
  resetStats()

  const ref = toLessonRef(id)
  const data = await getLessonById(ref)
  if (!data) {
    notFound.value = true
    loading.value = false
    return
  }
  lesson.value = data

  // Set initial variant selection
  if (data.variants?.length) {
    selectedVariantId.value = data.variants[0].variant_id
  } else {
    selectedVariantId.value = null
  }

  loading.value = false
}

function resetStats() {
  liveWpm.value = null
  liveAccuracy.value = 100
  progress.value = 0
  elapsed.value = 0
  started.value = false
}

function handleReset() {
  clearTimer()
  resetStats()
  resetKey.value++
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function handleUpdate({ progress: p, liveWpm: wpm, liveAccuracy: acc }: any) {
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

watch(started, (isStarted) => {
  document.body.classList.toggle('typing-session-active', isStarted)
})

async function handleComplete(result: any) {
  clearTimer()

  const lessonRef = toLessonRef(lesson.value.id)

  // Achievement evaluation (non-blocking, skipped for guests)
  const userId = userStore.user?.id
  if (userId) {
    try {
      const { data: allResults } = await listUserResults(userId)
      const currentStreak = streakStore.currentStreak
      const latestResult = {
        user_id: userId,
        lesson_id: lessonRef,
        variant_id: selectedVariantId.value,
        wpm: result.wpm,
        accuracy: result.accuracy,
        duration: result.duration,
        errors: result.errors,
        language: currentVariant.value?.language ?? null,
        finishedAt: new Date().toISOString(),
      }
      const allResultsWithLatest = [...(allResults ?? []), latestResult]
      const newIds = await evaluateAndUnlock(
        userId,
        latestResult,
        allResultsWithLatest,
        currentStreak,
      )
      for (const id of newIds) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id)
        if (achievement) {
          showToast(`解锁成就：${achievement.name}`)
        }
      }
    } catch (err) {
      console.warn('[TypingView] 成就解锁失败', err)
    }
  }

  // Delay navigation slightly so toasts are visible (if any were shown)
  const delay = userId ? 1200 : 0
  setTimeout(() => {
    router.push({
      name: 'result',
      state: {
        result: {
          ...result,
          lessonId: lessonRef,
          variant_id: selectedVariantId.value,
          language: currentVariant.value?.language ?? null,
        },
      },
    })
  }, delay)
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

onMounted(() => loadLesson(route.params.id))
watch(
  () => route.params.id,
  (id) => loadLesson(id),
)
onBeforeUnmount(() => {
  clearTimer()
  document.body.classList.remove('typing-session-active')
})
</script>

<template>
  <div class="typing-session" :class="{ 'typing-session--active': started }">
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
      <div class="session-breadcrumb mb-6 flex items-center gap-2 font-mono text-xs transition-opacity">
        <RouterLink :to="{ name: 'home' }" class="text-mt-sub hover:text-mt-accent transition-colors uppercase tracking-widest">
          练习
        </RouterLink>
        <span class="text-mt-border">/</span>
        <span class="text-mt-sub uppercase tracking-widest">{{ lesson.title }}</span>
      </div>

      <!-- stats bar: terminal-style -->
      <div class="stats-panel panel mb-5 px-4 py-3 sm:px-5">
        <div class="stat-item">
          <span class="stat-label">wpm</span>
          <span class="stat-value text-mt-accent">{{ started && liveWpm !== null ? liveWpm : '—' }}</span>
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
        <div class="session-progress">
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
      <div class="typing-panel panel p-4 sm:p-6">
        <!-- variant selector: only shown when multiple variants exist -->
        <VariantSelector
          v-if="lesson.variants && lesson.variants.length > 1"
          v-model="selectedVariantId"
          :variants="lesson.variants"
        />

        <TypingEngine
          v-if="currentVariant"
          :key="`${selectedVariantId}-${resetKey}`"
          :text="currentVariant.code ?? currentVariant.text ?? ''"
          :language="currentVariant.language"
          @update="handleUpdate"
          @complete="handleComplete"
          @reset="handleReset"
        />
      </div>

    </template>

    <!-- Achievement Toasts -->
    <Teleport to="body">
      <div class="toast-container">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
        >
          ★ {{ toast.message }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stats-panel {
  display: grid;
  grid-template-columns: auto 1px auto 1px auto minmax(12rem, 1fr);
  align-items: center;
  gap: 1.5rem;
}

.stat-label {
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgb(var(--mt-sub) / 0.82);
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

.session-progress {
  min-width: 0;
  margin-left: 0.5rem;
}

.typing-session--active .session-breadcrumb {
  opacity: 0.52;
}

.typing-panel {
  overflow: hidden;
}

.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
  pointer-events: none;
}

.toast-item {
  background: rgb(var(--mt-panel, 24 24 27));
  border: 1px solid rgb(var(--mt-accent));
  color: rgb(var(--mt-accent));
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  animation: toast-in 0.25s ease, toast-out 0.3s ease 3.2s forwards;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@media (max-width: 767px) {
  .stats-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .stats-panel .divider {
    display: none;
  }

  .session-progress {
    grid-column: 1 / -1;
    margin: 0.35rem 0 0;
  }

  .stat-item {
    padding-right: 0.75rem;
    border-right: 1px solid rgb(var(--mt-border));
  }

  .stat-item:nth-of-type(5) {
    border-right: 0;
  }

  .toast-container {
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
  }
}
</style>
