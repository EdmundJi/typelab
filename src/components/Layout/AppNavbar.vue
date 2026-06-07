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
  <nav class="border-b border-mt-border bg-mt-bg">
    <div class="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
      <RouterLink
        class="flex items-center gap-2 text-mt-accent hover:opacity-80 transition-opacity"
        :to="{ name: 'home' }"
        aria-label="KeyLab 首页"
      >
        <span class="text-lg font-bold tracking-tight">keylab</span>
      </RouterLink>

      <div class="flex items-center gap-6 text-sm">
        <RouterLink class="nav-link" :to="{ name: 'home' }">练习</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'leaderboard' }">排行榜</RouterLink>
        <RouterLink v-if="isLoggedIn" class="nav-link" :to="{ name: 'profile' }">我的</RouterLink>

        <template v-if="isLoggedIn">
          <span class="max-w-40 truncate text-mt-sub text-xs" :title="userEmail">{{ userEmail }}</span>
          <button
            class="text-mt-sub hover:text-mt-text transition-colors text-sm"
            type="button"
            @click="handleLogout"
          >
            退出
          </button>
        </template>
        <RouterLink v-else class="text-mt-sub hover:text-mt-text transition-colors" :to="{ name: 'login' }">
          登录
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  color: #646669;
  transition: color 0.15s;
  font-weight: 500;
}

.nav-link:hover {
  color: #d1d0c5;
}

.router-link-active.nav-link {
  color: #e2b714;
}
</style>
