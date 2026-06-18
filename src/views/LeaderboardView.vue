<script setup>
import Leaderboard from '@/components/Leaderboard/index.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div>
    <div class="mb-8">
      <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 排名</p>
      <h1 class="text-2xl font-bold text-mt-text mb-1">排行榜</h1>
      <p class="text-xs text-mt-sub tracking-wide">各用户历史最佳 WPM</p>
      <p v-if="!userStore.session" class="mt-2 text-xs text-mt-sub/60">
        <RouterLink :to="{ name: 'login' }" class="text-mt-accent hover:opacity-80">登录</RouterLink>
        后可参与排名
      </p>
    </div>
    <Leaderboard />
  </div>
</template>
