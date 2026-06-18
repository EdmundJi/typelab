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
  <nav class="border-b border-mt-border bg-mt-bg/95 backdrop-blur-sm sticky top-0 z-10">
    <div class="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-6">

      <RouterLink
        class="flex items-center gap-1.5 group"
        :to="{ name: 'home' }"
        aria-label="KeyLab 首页"
      >
        <span class="text-mt-sub text-xs group-hover:text-mt-accent transition-colors select-none">&gt;</span>
        <span class="text-mt-accent font-bold text-xs tracking-[0.2em] uppercase">KEYLAB</span>
      </RouterLink>

      <div class="flex items-center gap-5">
        <RouterLink class="nav-link" :to="{ name: 'home' }">练习</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'leaderboard' }">排行榜</RouterLink>
        <RouterLink v-if="isLoggedIn" class="nav-link" :to="{ name: 'profile' }">我的</RouterLink>

        <div class="w-px h-3 bg-mt-border mx-1" />

        <button
          class="theme-toggle"
          type="button"
          :aria-label="themeStore.isDark ? '切换到日间模式' : '切换到夜间模式'"
          @click="toggleTheme"
        >
          <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <template v-if="isLoggedIn">
          <span
            class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold shrink-0 border border-mt-border"
            :style="{ backgroundColor: avatar.color + '22', color: avatar.color }"
          >{{ avatar.letter }}</span>
          <span class="max-w-36 truncate text-mt-sub text-xs" :title="userEmail">{{ userEmail }}</span>
          <button
            class="text-xs uppercase tracking-widest text-mt-sub hover:text-mt-accent transition-colors"
            type="button"
            @click="handleLogout"
          >
            退出
          </button>
        </template>
        <RouterLink
          v-else
          class="text-xs uppercase tracking-widest text-mt-sub hover:text-mt-accent transition-colors"
          :to="{ name: 'login' }"
        >
          登录
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  color: rgb(var(--mt-nav-link));
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 500;
  transition: color 0.15s;
  position: relative;
  padding-bottom: 2px;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 1px;
  background: rgb(var(--mt-accent));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.15s;
}

.nav-link:hover {
  color: rgb(var(--mt-nav-link-hover));
}

.router-link-active.nav-link {
  color: rgb(var(--mt-nav-link-active));
}

.router-link-active.nav-link::after {
  transform: scaleX(1);
}

.theme-toggle {
  color: rgb(var(--mt-nav-link));
  transition: color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  color: rgb(var(--mt-accent));
}
</style>
