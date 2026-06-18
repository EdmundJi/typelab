<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAvatar } from '@/lib/avatar'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const userEmail = computed(() => userStore.user?.email ?? '')
const avatar = computed(() => getAvatar(userStore.user?.email))
const isLoggedIn = computed(() => Boolean(userStore.session && userStore.user))

function handleLogout() {
  userStore.clearSession()
  router.push({ name: 'home' })
}

function toggleTheme() {
  themeStore.toggle()
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

        <button
          class="theme-toggle"
          type="button"
          :aria-label="themeStore.isDark ? '切换到日间模式' : '切换到夜间模式'"
          @click="toggleTheme"
        >
          <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <template v-if="isLoggedIn">
          <span
            class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
            :style="{ backgroundColor: avatar.color }"
          >{{ avatar.letter }}</span>
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
  color: rgb(var(--mt-nav-link));
  transition: color 0.15s;
  font-weight: 500;
}

.nav-link:hover {
  color: rgb(var(--mt-nav-link-hover));
}

.router-link-active.nav-link {
  color: rgb(var(--mt-nav-link-active));
}

.theme-toggle {
  color: rgb(var(--mt-nav-link));
  transition: color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.theme-toggle:hover {
  color: rgb(var(--mt-nav-link-hover));
}
</style>