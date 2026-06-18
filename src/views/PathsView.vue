<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PathDetail from '@/components/Paths/PathDetail.vue'
import PathList from '@/components/Paths/PathList.vue'
import { listPaths, listUserResults } from '@/lib/adapters/db'
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
        completedRefs.add(r.lesson_id)
      }
    }
  }

  paths.value = (data ?? []).map((path) => ({
    ...path,
    _completedCount: (path.items ?? []).filter((item) => completedRefs.has(item.lesson_ref)).length,
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
  <div class="mx-auto max-w-3xl px-6 py-10">
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

      <h1 class="text-mt-fg font-bold text-sm tracking-[0.2em] uppercase">
        {{ selectedPath ? selectedPath.name : '学习路径' }}
      </h1>
      <p v-if="!selectedPath" class="text-mt-sub text-xs mt-1">
        按序练习，系统掌握算法与数据结构
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-mt-sub text-xs">加载中…</div>

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
