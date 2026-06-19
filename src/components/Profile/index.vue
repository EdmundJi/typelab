<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import { listUserResults } from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'
import ProfileHistory from './ProfileHistory.vue'
import ProgressChart from './ProgressChart.vue'

const userStore = useUserStore()
const results = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  if (!userStore.user) {
    loading.value = false
    return
  }

  const { data, error: err } = await listUserResults(userStore.user.id)
  if (err) {
    error.value = '加载失败'
  } else {
    results.value = data ?? []
  }
  loading.value = false
})
</script>

<template>
  <div>
    <div v-if="loading" class="py-4"><SkeletonCard class="min-h-40" /></div>
    <div v-else-if="error" class="py-16 text-center text-sm text-mt-wrong">{{ error }}</div>
    <div v-else-if="results.length === 0" class="py-16 text-center text-sm text-mt-sub">
      还没有练习记录，<RouterLink :to="{ name: 'home' }" class="text-mt-accent hover:opacity-80">去练习</RouterLink>
    </div>
    <div v-else class="space-y-10">
      <ProgressChart :results="results" />
      <ProfileHistory :results="results" />
    </div>
  </div>
</template>
