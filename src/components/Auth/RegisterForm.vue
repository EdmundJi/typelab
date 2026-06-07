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
      errorMessage.value = '密码至少 6 位'
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
      <label class="block text-xs text-mt-sub mb-1.5" for="register-email">邮箱</label>
      <input
        id="register-email"
        v-model.trim="email"
        class="w-full bg-mt-bg border border-mt-border rounded px-3 py-2 text-sm text-mt-text outline-none transition focus:border-mt-accent placeholder:text-mt-sub"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />
    </div>

    <div>
      <label class="block text-xs text-mt-sub mb-1.5" for="register-password">密码</label>
      <input
        id="register-password"
        v-model="password"
        class="w-full bg-mt-bg border border-mt-border rounded px-3 py-2 text-sm text-mt-text outline-none transition focus:border-mt-accent"
        type="password"
        autocomplete="new-password"
        minlength="6"
        placeholder="至少 6 位"
        required
      />
    </div>

    <div>
      <label class="block text-xs text-mt-sub mb-1.5" for="register-confirm-password">确认密码</label>
      <input
        id="register-confirm-password"
        v-model="confirmPassword"
        class="w-full bg-mt-bg border border-mt-border rounded px-3 py-2 text-sm text-mt-text outline-none transition focus:border-mt-accent"
        type="password"
        autocomplete="new-password"
        minlength="6"
        required
      />
    </div>

    <p v-if="errorMessage" class="text-xs text-mt-wrong">{{ errorMessage }}</p>

    <button
      class="w-full rounded px-4 py-2 text-sm font-semibold transition-opacity bg-mt-accent text-mt-bg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      type="submit"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? '注册中...' : '注册' }}
    </button>
  </form>
</template>
