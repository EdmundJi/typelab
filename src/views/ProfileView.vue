<script setup>
import { onMounted, ref } from 'vue'

import ProfilePanel from '@/components/Profile/index.vue'
import { listUserResults } from '@/lib/db'
import { getLessonMetaById } from '@/lessons'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const results = ref([])
const loading = ref(false)
const errorMessage = ref('')

function resolveLessonTitle(lessonId) {
  const meta = getLessonMetaById(lessonId)
  return meta?.title ?? lessonId
}

async function loadResults() {
  if (!userStore.user?.id) {
    results.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''

  const { data, error } = await listUserResults(userStore.user.id)

  if (error) {
    errorMessage.value = error.message ?? '加载历史成绩失败'
    results.value = []
  } else {
    results.value = data ?? []
  }

  loading.value = false
}

onMounted(loadResults)
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900">个人主页</h1>
      <p v-if="userStore.user?.email" class="mt-1 text-sm text-slate-500">
        当前账号：{{ userStore.user.email }}
      </p>
    </header>

    <div v-if="loading" class="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
      正在加载历史成绩...
    </div>

    <div v-else-if="errorMessage" class="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
      {{ errorMessage }}
    </div>

    <ProfilePanel v-else :results="results" :get-lesson-title="resolveLessonTitle" />
  </section>
</template>
