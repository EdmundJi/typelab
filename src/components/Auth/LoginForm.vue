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
      <label class="block text-xs text-mt-sub mb-1.5" for="login-email">邮箱</label>
      <input
        id="login-email"
        v-model.trim="email"
        class="w-full bg-mt-bg border border-mt-border rounded px-3 py-2 text-sm text-mt-text outline-none transition focus:border-mt-accent placeholder:text-mt-sub"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />
    </div>

    <div>
      <label class="block text-xs text-mt-sub mb-1.5" for="login-password">密码</label>
      <input
        id="login-password"
        v-model="password"
        class="w-full bg-mt-bg border border-mt-border rounded px-3 py-2 text-sm text-mt-text outline-none transition focus:border-mt-accent"
        type="password"
        autocomplete="current-password"
        required
      />
    </div>

    <p v-if="errorMessage" class="text-xs text-mt-wrong">{{ errorMessage }}</p>

    <button
      class="w-full rounded px-4 py-2 text-sm font-semibold transition-opacity bg-mt-accent text-mt-bg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      type="submit"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? '登录中...' : '登录' }}
    </button>
  </form>
</template>
