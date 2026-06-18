<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { listLeaderboard } from '@/lib/db'
import { useUserStore } from '@/stores/user'
import LeaderboardTable from './LeaderboardTable.vue'

const userStore = useUserStore()
const entries = ref([])
const loading = ref(true)
const error = ref(null)

let refreshTimer = null
let mounted = false

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await listLeaderboard()
    if (!mounted) return
    if (err) {
      error.value = '加载失败'
    } else {
      entries.value = data ?? []
    }
  } catch (e) {
    if (!mounted) return
    error.value = '加载失败'
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
    <div v-if="loading" class="py-16 text-center text-sm text-mt-sub">加载中...</div>
    <div v-else-if="error" class="py-16 text-center text-sm text-mt-wrong">{{ error }}</div>
    <div v-else-if="entries.length === 0" class="py-16 text-center text-sm text-mt-sub">
      暂无数据，完成练习后成绩将出现在此
    </div>
    <LeaderboardTable v-else :entries="entries" :current-user-id="userStore.user?.id ?? null" />

    <button
      class="mt-6 text-xs text-mt-sub hover:text-mt-text transition-colors"
      type="button"
      @click="load"
    >
      刷新
    </button>
  </div>
</template>
