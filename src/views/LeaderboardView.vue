<script setup>
import Leaderboard from '@/components/Leaderboard/index.vue'
</script>

<template>
  <div>
    <div class="mb-8">
      <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 排名</p>
      <h1 class="text-2xl font-bold text-mt-text mb-1">排行榜</h1>
      <p class="text-xs text-mt-sub tracking-wide">各用户历史最佳 WPM</p>
    </div>
    <Leaderboard />
  </div>
</template>
