<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SkeletonRow from '@/components/ui/SkeletonRow.vue'
import { listLeaderboard } from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'
import LeaderboardTable from './LeaderboardTable.vue'

const userStore = useUserStore()
const entries = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentRank = computed(
  () => entries.value.findIndex((e) => e.user_id === userStore.user?.id) + 1,
)
let refreshTimer: ReturnType<typeof setInterval> | null = null
let mounted = false
async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await listLeaderboard()
    if (!mounted) return
    if (err) error.value = '加载失败'
    else entries.value = data ?? []
  } catch {
    if (mounted) error.value = '加载失败'
  } finally {
    if (mounted) loading.value = false
  }
}
onMounted(() => {
  mounted = true
  load()
  refreshTimer = setInterval(load, 30000)
})
onUnmounted(() => {
  mounted = false
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-2"><SkeletonRow v-for="n in 5" :key="n" /></div>
    <div v-else-if="error" class="py-16 text-center text-sm text-mt-wrong">{{ error }}</div>
    <div v-else-if="entries.length === 0" class="py-16 text-center text-sm text-mt-sub">
      <p class="mb-4">还没有人上榜，成为第一个吧</p>
      <RouterLink to="/#lessons" class="text-mt-accent">去练习 →</RouterLink>
    </div>
    <template v-else>
      <p v-if="userStore.user && currentRank > 0" class="mb-3 text-xs text-mt-accent">你的排名：第 {{ currentRank }} 名</p>
      <LeaderboardTable :entries="entries" :current-user-id="userStore.user?.id ?? null" />
    </template>
    <button class="control-surface mt-6 px-4 font-mono text-xs text-mt-sub hover:text-mt-text" type="button" @click="load">刷新数据</button>
  </div>
</template>
