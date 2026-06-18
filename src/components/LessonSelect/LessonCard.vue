<script setup>
import { ref } from 'vue'
import {
  addToCollection,
  createCollection,
  getCollectionStatus,
  listCollections,
  removeFromCollection,
} from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  lesson: {
    type: Object,
    required: true,
  },
})

const userStore = useUserStore()

const categoryLabel = {
  warmup: '热身',
  sorting: '排序',
  trees: '树',
  dp: 'DP',
  graph: '图',
  js: 'JS',
  concepts: '概念',
}

function getLabel(category) {
  return categoryLabel[category] ?? category
}

// ——— 收藏逻辑 ———
const lessonRef = `builtin:${props.lesson.id}`

const showDropdown = ref(false)
const collections = ref([])
const collectedIds = ref([]) // 已收藏该课程的收藏夹 id 列表
const dropdownLoading = ref(false)
const newColName = ref('')
const creatingCol = ref(false)

async function openDropdown(e) {
  e.preventDefault()
  e.stopPropagation()
  if (!userStore.user?.id) return
  showDropdown.value = true
  dropdownLoading.value = true
  const [colsRes, statusRes] = await Promise.all([
    listCollections(userStore.user.id),
    getCollectionStatus(userStore.user.id, lessonRef),
  ])
  collections.value = colsRes.data ?? []
  collectedIds.value = statusRes.data ?? []
  dropdownLoading.value = false
}

function closeDropdown() {
  showDropdown.value = false
  newColName.value = ''
}

async function toggleCollection(collectionId) {
  if (collectedIds.value.includes(collectionId)) {
    await removeFromCollection(collectionId, lessonRef)
    collectedIds.value = collectedIds.value.filter((id) => id !== collectionId)
  } else {
    await addToCollection(collectionId, lessonRef)
    collectedIds.value = [...collectedIds.value, collectionId]
  }
}

async function handleCreateCol(e) {
  e.preventDefault()
  const name = newColName.value.trim()
  if (!name || creatingCol.value) return
  creatingCol.value = true
  const { data } = await createCollection(userStore.user.id, name)
  if (data) {
    collections.value = [...collections.value, { ...data, item_count: 0 }]
    // 创建后自动添加当前课程
    await addToCollection(data.id, lessonRef)
    collectedIds.value = [...collectedIds.value, data.id]
  }
  newColName.value = ''
  creatingCol.value = false
}

const isBookmarked = () => collectedIds.value.length > 0
</script>

<template>
  <div class="relative">
    <RouterLink
      :to="{ name: 'lesson', params: { id: lesson.id } }"
      class="lesson-card group panel block p-4 transition-colors hover:border-mt-accent/50"
    >
      <div class="flex items-start justify-between gap-2 mb-5">
        <span class="text-xs text-mt-sub uppercase tracking-widest">
          {{ getLabel(lesson.category) }}
        </span>
        <div class="flex items-center gap-2">
          <!-- 收藏按钮（已登录才显示） -->
          <button
            v-if="userStore.user"
            class="text-sm leading-none transition-colors"
            :class="collectedIds.length > 0 ? 'text-mt-accent' : 'text-mt-border hover:text-mt-sub'"
            title="收藏"
            @click="openDropdown"
          >
            ★
          </button>
          <!-- 难度条 -->
          <div class="flex items-center gap-0.5" :title="`难度 ${lesson.difficulty}/5`">
            <span
              v-for="n in 5"
              :key="n"
              class="inline-block w-1 h-3"
              :class="n <= lesson.difficulty ? 'bg-mt-accent' : 'bg-mt-border'"
            />
          </div>
        </div>
      </div>

      <h3 class="text-sm text-mt-text group-hover:text-mt-accent transition-colors leading-snug">
        {{ lesson.title }}
      </h3>

      <div class="mt-4 flex items-center justify-between">
        <span class="text-xs text-mt-sub/60 group-hover:text-mt-accent/60 transition-colors">→ 开始练习</span>
      </div>
    </RouterLink>

    <!-- 收藏夹 Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute right-0 top-0 z-50 w-56 bg-mt-panel border border-mt-border shadow-lg"
      style="min-width: 200px"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-mt-border">
        <span class="text-xs text-mt-sub uppercase tracking-widest">收藏到</span>
        <button class="text-xs text-mt-sub hover:text-mt-text" @click="closeDropdown">✕</button>
      </div>

      <!-- 加载中 -->
      <div v-if="dropdownLoading" class="px-3 py-3 text-xs text-mt-sub/60">加载中…</div>

      <template v-else>
        <!-- 收藏夹列表 -->
        <ul class="max-h-48 overflow-y-auto">
          <li v-if="collections.length === 0" class="px-3 py-2 text-xs text-mt-sub/60">
            暂无收藏夹
          </li>
          <li
            v-for="col in collections"
            :key="col.id"
            class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-mt-border/20 transition-colors"
            @click="toggleCollection(col.id)"
          >
            <span
              class="text-sm leading-none"
              :class="collectedIds.includes(col.id) ? 'text-mt-accent' : 'text-mt-border'"
            >
              {{ collectedIds.includes(col.id) ? '★' : '☆' }}
            </span>
            <span class="text-xs text-mt-text truncate flex-1">{{ col.name }}</span>
            <span class="text-xs text-mt-sub/40">{{ col.item_count }}</span>
          </li>
        </ul>

        <!-- 新建收藏夹 -->
        <form
          class="border-t border-mt-border px-3 py-2 flex gap-1"
          @submit="handleCreateCol"
        >
          <input
            v-model="newColName"
            type="text"
            placeholder="新建收藏夹…"
            maxlength="40"
            class="flex-1 bg-transparent text-xs text-mt-text placeholder-mt-sub/40 focus:outline-none"
          />
          <button
            type="submit"
            :disabled="creatingCol || !newColName.trim()"
            class="text-xs text-mt-sub hover:text-mt-accent transition-colors disabled:opacity-40"
          >
            +
          </button>
        </form>
      </template>
    </div>

    <!-- 点击外部关闭 -->
    <div
      v-if="showDropdown"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </div>
</template>

<style scoped>
.lesson-card {
  display: block;
}
</style>
