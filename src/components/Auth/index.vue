<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import LoginForm from '@/components/Auth/LoginForm.vue'
import RegisterForm from '@/components/Auth/RegisterForm.vue'
import { signOut } from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const errorMessage = ref('')
const successMessage = ref('')
const isSigningOut = ref(false)

const isLoggedIn = computed(() => Boolean(userStore.session))

async function handleAuthSuccess(session) {
  successMessage.value = ''
  userStore.setSession(session)
  await router.push({ name: 'home' })
}

function handleRegistered() {
  successMessage.value = '注册成功，请登录'
  activeTab.value = 'login'
}

function selectTab(tab) {
  activeTab.value = tab
  successMessage.value = ''
}

async function handleSignOut() {
  errorMessage.value = ''
  successMessage.value = ''
  isSigningOut.value = true

  const { error } = await signOut()

  isSigningOut.value = false

  if (error) {
    errorMessage.value = error.message || '退出失败，请稍后重试'
    return
  }

  userStore.clearSession()
}
</script>

<template>
  <div class="mx-auto max-w-sm">
    <div v-if="isLoggedIn" class="panel p-6">
      <p class="text-xs text-mt-sub uppercase tracking-widest mb-1">当前登录</p>
      <p class="text-sm text-mt-text">{{ userStore.user?.email }}</p>

      <p v-if="errorMessage" class="mt-3 text-xs text-mt-wrong">{{ errorMessage }}</p>

      <button
        class="mt-6 w-full px-4 py-2 text-xs uppercase tracking-widest border border-mt-border text-mt-sub font-medium transition-colors hover:text-mt-text hover:border-mt-sub disabled:opacity-40 disabled:cursor-not-allowed"
        type="button"
        :disabled="isSigningOut"
        @click="handleSignOut"
      >
        {{ isSigningOut ? '退出中...' : '退出登录' }}
      </button>
    </div>

    <div v-else class="panel p-6">
      <div class="flex mb-6 border-b border-mt-border">
        <button
          class="flex-1 pb-3 text-xs font-medium uppercase tracking-widest transition-colors"
          :class="activeTab === 'login' ? 'text-mt-accent border-b border-mt-accent -mb-px' : 'text-mt-sub hover:text-mt-text'"
          type="button"
          @click="selectTab('login')"
        >
          登录
        </button>
        <button
          class="flex-1 pb-3 text-xs font-medium uppercase tracking-widest transition-colors"
          :class="activeTab === 'register' ? 'text-mt-accent border-b border-mt-accent -mb-px' : 'text-mt-sub hover:text-mt-text'"
          type="button"
          @click="selectTab('register')"
        >
          注册
        </button>
      </div>

      <p v-if="successMessage" class="mb-4 text-xs text-mt-accent">{{ successMessage }}</p>
      <LoginForm v-if="activeTab === 'login'" @success="handleAuthSuccess" />
      <RegisterForm v-else @success="handleAuthSuccess" @registered="handleRegistered" />
    </div>
  </div>
</template>
