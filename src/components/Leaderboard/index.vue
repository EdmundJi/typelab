<script setup>
import { onMounted, ref } from 'vue'
import { listLeaderboard } from '@/lib/db'
import LeaderboardTable from './LeaderboardTable.vue'

const entries = ref([])
const loading = ref(true)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  const { data, error: err } = await listLeaderboard()
  if (err) {
    error.value = '加载失败'
  } else {
    entries.value = data ?? []
  }
  loading.value = false
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="loading" class="py-16 text-center text-sm text-mt-sub">加载中...</div>
    <div v-else-if="error" class="py-16 text-center text-sm text-mt-wrong">{{ error }}</div>
    <div v-else-if="entries.length === 0" class="py-16 text-center text-sm text-mt-sub">
      暂无数据，完成练习后成绩将出现在此
    </div>
    <LeaderboardTable v-else :entries="entries" />

    <button
      class="mt-6 text-xs text-mt-sub hover:text-mt-text transition-colors"
      type="button"
      @click="load"
    >
      刷新
    </button>
  </div>
</template>
