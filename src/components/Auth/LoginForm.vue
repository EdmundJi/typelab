<script setup>
import { ref } from 'vue'

import { signInWithPassword } from '@/lib/db'

const emit = defineEmits(['success'])

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  const { data, error } = await signInWithPassword({
    email: email.value,
    password: password.value,
  })

  isSubmitting.value = false

  if (error) {
    errorMessage.value = '邮箱或密码错误'
    return
  }

  if (!data.session) {
    errorMessage.value = '登录失败，请稍后重试'
    return
  }

  emit('success', data.session)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium text-slate-700" for="login-email">邮箱</label>
      <input
        id="login-email"
        v-model.trim="email"
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        type="email"
        autocomplete="email"
        required
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700" for="login-password">密码</label>
      <input
        id="login-password"
        v-model="password"
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        type="password"
        autocomplete="current-password"
        required
      />
    </div>

    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

    <button
      class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      type="submit"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? '登录中...' : '登录' }}
    </button>
  </form>
</template>
