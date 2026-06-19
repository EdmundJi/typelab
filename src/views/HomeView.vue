<script setup lang="ts">
import { computed, onMounted } from 'vue'
import LessonSelect from '@/components/LessonSelect/index.vue'
import { useStreakStore } from '@/stores/streak'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const streakStore = useStreakStore()
const isLoggedIn = computed(() => Boolean(userStore.session || userStore.user))
onMounted(() => {
  if (userStore.user?.id) streakStore.refresh(userStore.user.id)
})
</script>

<template>
  <div>
    <template v-if="!isLoggedIn">
      <section class="mb-10">
        <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// keylab</p>
        <h1 class="text-3xl sm:text-4xl font-bold text-mt-text tracking-tight mb-3">为程序员设计的打字练习</h1>
        <p class="text-mt-sub text-sm tracking-wide mb-6">通过打出真实算法代码，同时训练手速和算法记忆</p>
        <div class="flex gap-3 mb-8">
          <a href="#lessons" class="px-5 py-2 bg-mt-accent text-mt-bg text-xs font-bold uppercase tracking-widest">开始练习 →</a>
          <RouterLink :to="{ name: 'login' }" class="px-5 py-2 border border-mt-border text-xs text-mt-sub hover:text-mt-text">注册账号</RouterLink>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="panel p-4"><h2 class="text-sm text-mt-text mb-1">真实代码</h2><p class="text-xs text-mt-sub">不是随机单词，而是 BFS、快排、DP</p></div>
          <div class="panel p-4"><h2 class="text-sm text-mt-text mb-1">多语言变体</h2><p class="text-xs text-mt-sub">同一道题可选 Python / JavaScript / Go</p></div>
          <div class="panel p-4"><h2 class="text-sm text-mt-text mb-1">算法记忆</h2><p class="text-xs text-mt-sub">打完一道题等于过了一遍实现</p></div>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="mb-10">
        <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// dashboard</p>
        <div class="grid gap-3 sm:grid-cols-3 mb-5">
          <div class="panel p-4"><p class="text-xs text-mt-sub">Streak</p><p class="text-3xl font-bold text-mt-accent">{{ streakStore.currentStreak }}</p><p class="text-xs text-mt-sub">{{ streakStore.practicedToday ? '今天已练' : '今天去练习' }}</p></div>
          <div class="panel p-4"><p class="text-xs text-mt-sub">练习次数</p><p class="text-3xl font-bold text-mt-text">{{ streakStore.totalCount }}</p><p class="text-xs text-mt-sub">本周 {{ streakStore.weekCount }}</p></div>
          <div class="panel p-4"><p class="text-xs text-mt-sub">个人最佳</p><p class="text-3xl font-bold text-mt-text">{{ streakStore.bestWpm || '-' }}</p><p class="text-xs text-mt-sub">wpm</p></div>
        </div>
        <div class="panel p-4 flex items-center justify-between">
          <div><p class="text-sm text-mt-text">{{ streakStore.lastResult ? '继续上次练习' : '推荐入门课程' }}</p><p class="text-xs text-mt-sub">{{ streakStore.lastResult?.lesson_id ?? '从热身课程开始' }}</p></div>
          <div class="flex gap-3"><RouterLink :to="{ name: 'paths' }" class="text-xs text-mt-accent">学习路径 →</RouterLink><RouterLink :to="streakStore.lastResult ? { name: 'lesson', params: { id: String(streakStore.lastResult.lesson_id).replace(/^builtin:/, '') } } : { name: 'home', hash: '#lessons' }" class="text-xs text-mt-accent">继续</RouterLink></div>
        </div>
      </section>
    </template>
    <LessonSelect />
  </div>
</template>
