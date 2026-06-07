<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import LoginForm from '@/components/Auth/LoginForm.vue'
import RegisterForm from '@/components/Auth/RegisterForm.vue'
import { signOut } from '@/lib/db'
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
  <div class="mx-auto max-w-md">
    <div v-if="isLoggedIn" class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-sm text-slate-600">当前登录账号</p>
      <p class="mt-1 font-medium text-slate-900">{{ userStore.user?.email }}</p>

      <p v-if="errorMessage" class="mt-4 text-sm text-red-600">{{ errorMessage }}</p>

      <button
        class="mt-6 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
        type="button"
        :disabled="isSigningOut"
        @click="handleSignOut"
      >
        {{ isSigningOut ? '退出中...' : '退出登录' }}
      </button>
    </div>

    <div v-else class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6 grid grid-cols-2 rounded-md bg-slate-100 p-1">
        <button
          class="rounded px-3 py-2 text-sm font-medium transition"
          :class="
            activeTab === 'login'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          "
          type="button"
          @click="selectTab('login')"
        >
          登录
        </button>
        <button
          class="rounded px-3 py-2 text-sm font-medium transition"
          :class="
            activeTab === 'register'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          "
          type="button"
          @click="selectTab('register')"
        >
          注册
        </button>
      </div>

      <p v-if="successMessage" class="mb-4 text-sm text-emerald-700">{{ successMessage }}</p>
      <LoginForm v-if="activeTab === 'login'" @success="handleAuthSuccess" />
      <RegisterForm v-else @success="handleAuthSuccess" @registered="handleRegistered" />
    </div>
  </div>
</template>
