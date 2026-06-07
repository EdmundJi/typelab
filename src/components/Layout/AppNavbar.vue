<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const userEmail = computed(() => userStore.user?.email ?? '')
const isLoggedIn = computed(() => Boolean(userStore.session && userStore.user))

function handleLogout() {
  userStore.clearSession()
  router.push({ name: 'home' })
}
</script>

<template>
  <nav class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex min-h-16 w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
      <RouterLink
        class="inline-flex items-center gap-2 text-lg font-bold text-blue-600 transition hover:text-blue-700"
        :to="{ name: 'home' }"
        aria-label="TypeLab 首页"
      >
        <span class="rounded-md bg-blue-50 px-2 py-1 font-mono text-xl leading-none text-blue-600">&lt;/&gt;</span>
        <span class="text-slate-900">TypeLab</span>
      </RouterLink>

      <div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
        <RouterLink class="nav-link" :to="{ name: 'home' }">首页</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'leaderboard' }">排行榜</RouterLink>
        <RouterLink v-if="isLoggedIn" class="nav-link" :to="{ name: 'profile' }">个人主页</RouterLink>

        <template v-if="isLoggedIn">
          <span class="max-w-48 truncate text-slate-500" :title="userEmail">{{ userEmail }}</span>
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            type="button"
            @click="handleLogout"
          >
            退出
          </button>
        </template>
        <RouterLink v-else class="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white transition hover:bg-blue-700" :to="{ name: 'login' }">
          登录
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  @apply font-medium text-slate-600 transition hover:text-blue-700;
}

.router-link-active.nav-link {
  @apply text-blue-700;
}
</style>
