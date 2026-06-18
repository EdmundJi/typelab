<script setup>
import { computed, onMounted } from 'vue'
import { useStreakStore } from '@/stores/streak'
import { useUserStore } from '@/stores/user'

const streakStore = useStreakStore()
const userStore = useUserStore()

onMounted(async () => {
  const userId = userStore.user?.id
  if (userId) {
    await streakStore.refresh(userId)
  }
})

// Build 52-week (364-day) grid ending today (UTC+8)
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000

function toUTC8DateKey(date) {
  const utc8Date = new Date(date.getTime() + UTC8_OFFSET_MS)
  const y = utc8Date.getUTCFullYear()
  const m = String(utc8Date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(utc8Date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// weeks: array of 52+ columns, each is array of 7 days (Mon=0..Sun=6)
// day = { key: 'YYYY-MM-DD', count: number }
const weeks = computed(() => {
  // Today in UTC+8
  const nowUtc8Ms = Date.now() + UTC8_OFFSET_MS
  const todayUtc8 = new Date(nowUtc8Ms)
  // Normalize to start-of-day UTC+8 (i.e. midnight UTC+8 = 16:00 previous UTC)
  const todayDayIndex = Math.floor(nowUtc8Ms / (24 * 60 * 60 * 1000))

  // We want 364 days ending today
  const totalDays = 364
  const startDayIndex = todayDayIndex - totalDays + 1

  // Arrange into weeks: first day is the Monday of the week containing startDayIndex
  // Day of week: 0=Sun,1=Mon,...,6=Sat — we want Mon=0..Sun=6
  // JavaScript getUTCDay(): 0=Sun, 1=Mon,...,6=Sat
  // Convert to Mon-based: (getUTCDay() + 6) % 7
  const startDate = new Date(startDayIndex * 24 * 60 * 60 * 1000 - UTC8_OFFSET_MS)
  const startDow = (startDate.getUTCDay() + 6) % 7 // Mon-based day of week

  // Pad the beginning so the first column starts on a Monday
  const paddedStart = startDayIndex - startDow

  // Build all day entries from paddedStart to todayDayIndex
  const allDays = []
  for (let di = paddedStart; di <= todayDayIndex; di++) {
    const dateMs = di * 24 * 60 * 60 * 1000 - UTC8_OFFSET_MS
    const key = toUTC8DateKey(new Date(dateMs + UTC8_OFFSET_MS))
    const count = streakStore.calendarData[key] ?? 0
    const isFuture = di > todayDayIndex
    const isPadding = di < startDayIndex
    allDays.push({ key, count, isFuture, isPadding })
  }

  // Group into columns of 7 (weeks)
  const result = []
  for (let i = 0; i < allDays.length; i += 7) {
    result.push(allDays.slice(i, i + 7))
  }
  return result
})

function intensityClass(day) {
  if (day.isPadding || day.isFuture) return 'bg-mt-bg border border-mt-border opacity-0'
  if (day.count === 0) return 'bg-mt-border'
  if (day.count === 1) return 'bg-mt-accent opacity-40'
  if (day.count <= 3) return 'bg-mt-accent opacity-70'
  return 'bg-mt-accent'
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
</script>

<template>
  <div class="mb-8">
    <!-- Stats -->
    <div class="flex items-center gap-6 mb-4">
      <div>
        <span class="text-xs text-mt-sub tracking-[0.2em] uppercase">连续</span>
        <span class="ml-2 text-xl font-bold text-mt-text">{{ streakStore.currentStreak }}</span>
        <span class="ml-1 text-xs text-mt-sub">天</span>
      </div>
      <div class="w-px h-4 bg-mt-border" />
      <div>
        <span class="text-xs text-mt-sub tracking-[0.2em] uppercase">最长</span>
        <span class="ml-2 text-xl font-bold text-mt-text">{{ streakStore.bestStreak }}</span>
        <span class="ml-1 text-xs text-mt-sub">天</span>
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="flex gap-1">
      <!-- Day-of-week labels -->
      <div class="flex flex-col gap-1 mr-1">
        <div
          v-for="label in DAY_LABELS"
          :key="label"
          class="w-3 h-3 flex items-center justify-center text-[9px] text-mt-sub leading-none"
        >
          {{ label }}
        </div>
      </div>

      <!-- Week columns -->
      <div v-for="(week, wi) in weeks" :key="wi" class="flex flex-col gap-1">
        <div
          v-for="(day, di) in week"
          :key="di"
          class="w-3 h-3 rounded-[2px]"
          :class="intensityClass(day)"
          :title="day.isPadding ? '' : `${day.key}: ${day.count} 次`"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-1 mt-2">
      <span class="text-[10px] text-mt-sub mr-1">少</span>
      <div class="w-3 h-3 rounded-[2px] bg-mt-border" />
      <div class="w-3 h-3 rounded-[2px] bg-mt-accent opacity-40" />
      <div class="w-3 h-3 rounded-[2px] bg-mt-accent opacity-70" />
      <div class="w-3 h-3 rounded-[2px] bg-mt-accent" />
      <span class="text-[10px] text-mt-sub ml-1">多</span>
    </div>
  </div>
</template>
