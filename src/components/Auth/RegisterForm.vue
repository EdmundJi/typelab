<script setup>
import { ref } from 'vue'

import { signUp } from '@/lib/db'

const emit = defineEmits(['success', 'registered'])

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  isSubmitting.value = true

  const { data, error } = await signUp({
    email: email.value,
    password: password.value,
  })

  isSubmitting.value = false

  if (error) {
    if (error.message?.toLowerCase().includes('already registered')) {
      errorMessage.value = '该邮箱已注册，请直接登录'
    } else if (error.message?.toLowerCase().includes('password')) {
      errorMessage.value = '密码不符合要求（至少 6 位）'
    } else {
      errorMessage.value = '注册失败，请稍后重试'
    }
    return
  }

  if (data.session) {
    emit('success', data.session)
    return
  }

  emit('registered')
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium text-slate-700" for="register-email">邮箱</label>
      <input
        id="register-email"
        v-model.trim="email"
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        type="email"
        autocomplete="email"
        required
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700" for="register-password">密码</label>
      <input
        id="register-password"
        v-model="password"
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        type="password"
        autocomplete="new-password"
        minlength="6"
        required
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700" for="register-confirm-password">
        确认密码
      </label>
      <input
        id="register-confirm-password"
        v-model="confirmPassword"
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        type="password"
        autocomplete="new-password"
        minlength="6"
        required
      />
    </div>

    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    <button
      class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      type="submit"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? '注册中...' : '注册' }}
    </button>
  </form>
</template>
