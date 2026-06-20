<script setup lang="ts">
import Leaderboard from '@/components/Leaderboard/index.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div>
    <div class="mb-8">
      <p class="eyebrow mb-2">// leaderboard</p>
      <h1 class="text-2xl font-bold text-mt-text mb-2 tracking-tight">排行榜</h1>
      <p class="text-sm text-mt-sub">按历史最佳 WPM 排名，看看谁的代码敲得最快。</p>
      <p v-if="!userStore.session" class="mt-3 text-xs text-mt-sub">
        <RouterLink :to="{ name: 'login' }" class="text-mt-accent hover:opacity-80">登录</RouterLink>
        后可参与排名
      </p>
    </div>
    <Leaderboard />
  </div>
</template>
