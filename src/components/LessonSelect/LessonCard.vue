<script setup lang="ts">
import { ref } from 'vue'
import {
  addToCollection,
  createCollection,
  getCollectionStatus,
  listCollections,
  removeFromCollection,
} from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'
import type { LessonMeta } from '@/types'

const props = defineProps<{ lesson: LessonMeta; bestWpm?: number | null }>()

const userStore = useUserStore()

const categoryLabel = {
  warmup: '热身',
  basics: '基础',
  arrays: '数组',
  strings: '字符串',
  searching: '查找',
  'stack-queue': '栈与队列',
  recursion: '递归回溯',
  sorting: '排序',
  trees: '树',
  dp: 'DP',
  graph: '图',
  js: 'JS',
  concepts: '概念',
}

function getLabel(category: string) {
  return categoryLabel[category] ?? category
}

function getDifficulty(lesson: LessonMeta) {
  return lesson.difficulty
}

function getDifficultyLabel(lesson: LessonMeta) {
  return ['', '入门', '基础', '进阶', '困难', '挑战'][lesson.difficulty]
}

// ——— 收藏逻辑 ———
const lessonRef = String(props.lesson.id).startsWith('community:')
  ? props.lesson.id
  : `builtin:${props.lesson.id}`

const showDropdown = ref(false)
const collections = ref([])
const collectedIds = ref([]) // 已收藏该课程的收藏夹 id 列表
const dropdownLoading = ref(false)
const newColName = ref('')
const creatingCol = ref(false)

async function openDropdown(e: Event) {
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

async function toggleCollection(collectionId: string) {
  if (collectedIds.value.includes(collectionId)) {
    await removeFromCollection(collectionId, lessonRef)
    collectedIds.value = collectedIds.value.filter((id) => id !== collectionId)
  } else {
    await addToCollection(collectionId, lessonRef)
    collectedIds.value = [...collectedIds.value, collectionId]
  }
}

async function handleCreateCol(e: Event) {
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
    <button
      v-if="userStore.user"
      class="bookmark-button"
      :class="collectedIds.length > 0 ? 'is-active' : ''"
      type="button"
      title="收藏"
      aria-label="收藏课程"
      @click="openDropdown"
    >
      {{ collectedIds.length > 0 ? '★' : '☆' }}
    </button>

    <RouterLink
      :to="{ name: 'lesson', params: { id: lesson.id } }"
      class="lesson-card group panel block p-5 transition-all duration-200 hover:border-mt-accent/60 hover:bg-mt-accent/[0.04] hover:-translate-y-0.5 hover:shadow-[var(--card-hover-shadow)]"
    >
      <div class="flex items-start justify-between gap-2 mb-5" :class="userStore.user ? 'pr-7' : ''">
        <span class="font-mono text-[10px] text-mt-sub uppercase tracking-widest">
          {{ getLabel(lesson.topic) }}
        </span>
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] text-mt-sub/80">{{ getDifficultyLabel(lesson) }}</span>
          <div class="flex items-center gap-0.5" :title="`难度 ${getDifficultyLabel(lesson)}`">
            <span
              v-for="n in 5"
              :key="n"
              class="inline-block w-1 h-3"
              :class="n <= getDifficulty(lesson) ? 'bg-mt-accent' : 'bg-mt-border'"
            />
          </div>
        </div>
      </div>

      <h3 class="lesson-title text-[15px] font-semibold text-mt-text group-hover:text-mt-accent transition-colors leading-snug">
        {{ lesson.title }}
      </h3>

      <div class="mt-3 flex flex-wrap gap-1">
        <span v-for="lang in [...new Set(lesson.variants.map((v) => v.language))]" :key="lang" class="font-mono text-[10px] border border-mt-border px-1.5 py-0.5 text-mt-sub">{{ lang }}</span>
      </div>
      <div class="mt-4 flex items-center justify-between">
        <span class="font-mono text-xs text-mt-sub group-hover:text-mt-accent transition-colors">开始练习 →</span>
        <span v-if="bestWpm" class="font-mono text-xs text-mt-accent">PB {{ bestWpm }} WPM</span>
      </div>
    </RouterLink>

    <!-- 收藏夹 Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute right-0 top-12 z-50 w-56 bg-mt-panel border border-mt-border shadow-lg"
      style="min-width: 200px"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-mt-border">
        <span class="text-xs text-mt-sub uppercase tracking-widest">收藏到</span>
        <button class="text-xs text-mt-sub hover:text-mt-text" @click="closeDropdown">✕</button>
      </div>

      <!-- loading skeleton -->
      <div v-if="dropdownLoading" class="px-3 py-3 space-y-2" aria-label="正在加载收藏夹">
        <div v-for="i in 3" :key="i" class="h-4 bg-mt-border/50 animate-pulse rounded" />
      </div>

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
  min-height: 11rem;
}

.lesson-title {
  min-height: 2.6rem;
}

.bookmark-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 20;
  width: 2rem;
  height: 2rem;
  color: rgb(var(--mt-sub));
  transition: color 0.15s, background-color 0.15s;
}

.bookmark-button:hover,
.bookmark-button.is-active {
  color: rgb(var(--mt-accent));
  background: rgb(var(--mt-accent) / 0.08);
}
</style>
