<script setup lang="ts">
import Auth from '@/components/Auth/index.vue'
</script>

<template>
  <div>
    <div class="mb-8">
      <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 账号</p>
      <h1 class="text-2xl font-bold text-mt-text mb-1">登录 / 注册</h1>
      <div class="space-y-1 text-xs text-mt-sub tracking-wide">
        <p>✓ 成绩自动保存，追踪个人进步</p>
        <p>✓ Streak 日历 — 保持每日练习习惯</p>
        <p>✓ 解锁成就，参与全球排行榜</p>
      </div>
    </div>
    <Auth />
  </div>
</template>
