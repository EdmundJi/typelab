<script setup>
import Profile from '@/components/Profile/index.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div>
    <div class="mb-8">
      <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 个人</p>
      <h1 class="text-2xl font-bold text-mt-text mb-1">个人主页</h1>
      <p class="text-xs text-mt-sub tracking-wide">{{ userStore.user?.email }}</p>
    </div>
    <Profile />
  </div>
</template>
