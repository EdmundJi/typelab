<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PathDetail from '@/components/Paths/PathDetail.vue'
import PathList from '@/components/Paths/PathList.vue'
import { listPaths, listUserResults } from '@/lib/adapters/db'
import { toLessonRef } from '@/lib/domain/lessonRef'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const paths = ref([])
const selectedPath = ref(null)
const loading = ref(true)
const error = ref(null)

async function loadPaths() {
  loading.value = true
  error.value = null

  const { data, error: err } = await listPaths()
  if (err) {
    error.value = '加载路径失败'
    loading.value = false
    return
  }

  // Compute completed count per path based on user results
  const userId = userStore.user?.id ?? null
  let completedRefs = new Set()

  if (userId) {
    const { data: results } = await listUserResults(userId)
    if (results) {
      for (const r of results) {
        completedRefs.add(toLessonRef(r.lesson_id))
      }
    }
  }

  paths.value = (data ?? []).map((path) => ({
    ...path,
    _completedCount: (path.items ?? []).filter((item) =>
      completedRefs.has(toLessonRef(item.lesson_ref)),
    ).length,
  }))

  // If a path id is in the route params, select it
  if (route.params.id) {
    selectedPath.value = paths.value.find((p) => p.id === route.params.id) ?? null
  }

  loading.value = false
}

onMounted(loadPaths)

// Re-compute completedCount when user logs in/out
watch(() => userStore.user, loadPaths)

function selectPath(path) {
  selectedPath.value = path
  router.replace({ name: 'path-detail', params: { id: path.id } })
}

function backToList() {
  selectedPath.value = null
  router.replace({ name: 'paths' })
}

// Sync selectedPath when route changes (e.g. back button)
watch(
  () => route.params.id,
  (id) => {
    if (!id) {
      selectedPath.value = null
    } else if (paths.value.length > 0) {
      selectedPath.value = paths.value.find((p) => p.id === id) ?? null
    }
  },
)
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Header -->
    <div class="mb-8">
      <button
        v-if="selectedPath"
        class="text-mt-sub text-xs uppercase tracking-widest hover:text-mt-accent transition-colors mb-4 flex items-center gap-1"
        type="button"
        @click="backToList"
      >
        ‹ 返回路径列表
      </button>

      <p class="eyebrow mb-2">// learning paths</p>
      <h1 class="text-mt-text text-2xl font-bold tracking-tight">
        {{ selectedPath ? selectedPath.name : '学习路径' }}
      </h1>
      <p v-if="!selectedPath" class="text-mt-sub text-sm mt-2">
        按序练习，系统掌握算法与数据结构
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3" aria-label="正在加载学习路径">
      <div v-for="i in 3" :key="i" class="h-24 border border-mt-border bg-mt-card animate-pulse" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-red-400 text-xs">{{ error }}</div>

    <!-- Path detail view -->
    <PathDetail
      v-else-if="selectedPath"
      :path="selectedPath"
    />

    <!-- Path list view -->
    <template v-else>
      <div v-if="paths.length === 0" class="text-mt-sub text-xs">暂无学习路径</div>
      <PathList
        v-else
        :paths="paths"
        :selected-path-id="selectedPath?.id ?? null"
        @select="selectPath"
      />
    </template>
  </div>
</template>
