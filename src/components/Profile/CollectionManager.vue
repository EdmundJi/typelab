<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createCollection, deleteCollection, listCollections } from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const collections = ref([])
const loading = ref(false)
const error = ref(null)
const expandedIds = ref(new Set())
const newName = ref('')
const creating = ref(false)
const createError = ref(null)

async function refresh() {
  if (!userStore.user?.id) return
  loading.value = true
  error.value = null
  const { data, error: err } = await listCollections(userStore.user.id)
  loading.value = false
  if (err) {
    error.value = '加载收藏夹失败'
    return
  }
  collections.value = data ?? []
}

async function handleCreate() {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  createError.value = null
  const { error: err } = await createCollection(userStore.user.id, name)
  creating.value = false
  if (err) {
    createError.value = '创建失败，请重试'
    return
  }
  newName.value = ''
  await refresh()
}

async function handleDelete(collectionId) {
  const { error: err } = await deleteCollection(collectionId)
  if (err) return
  await refresh()
}

function toggleExpand(id) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

onMounted(refresh)
</script>

<template>
  <section class="mt-8">
    <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 我的收藏</p>

    <div v-if="!userStore.user" class="panel p-4 text-xs text-mt-sub">
      登录后可使用收藏夹功能
    </div>

    <template v-else>
      <!-- 新建收藏夹 -->
      <form class="flex gap-2 mb-4" @submit.prevent="handleCreate">
        <input
          v-model="newName"
          type="text"
          placeholder="新收藏夹名称"
          maxlength="40"
          class="flex-1 bg-mt-panel border border-mt-border text-mt-text text-xs px-3 py-1.5 rounded focus:outline-none focus:border-mt-accent"
        />
        <button
          type="submit"
          :disabled="creating || !newName.trim()"
          class="text-xs px-3 py-1.5 border border-mt-border text-mt-sub hover:border-mt-accent hover:text-mt-accent transition-colors disabled:opacity-40"
        >
          {{ creating ? '创建中…' : '+ 新建' }}
        </button>
      </form>
      <p v-if="createError" class="text-xs text-red-400 mb-3">{{ createError }}</p>

      <!-- 加载 / 错误 -->
      <div v-if="loading" class="space-y-2" aria-label="正在加载收藏夹">
        <div v-for="i in 2" :key="i" class="h-10 border border-mt-border bg-mt-card animate-pulse rounded" />
      </div>
      <p v-else-if="error" class="text-xs text-red-400">{{ error }}</p>

      <!-- 收藏夹列表 -->
      <ul v-else class="space-y-2">
        <li
          v-for="col in collections"
          :key="col.id"
          class="panel border border-mt-border"
        >
          <!-- 收藏夹头部 -->
          <div
            class="flex items-center justify-between px-4 py-2 cursor-pointer select-none"
            @click="toggleExpand(col.id)"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs text-mt-text">{{ col.name }}</span>
              <span class="text-xs text-mt-sub/60">({{ col.item_count }} 课)</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-mt-sub">
                {{ expandedIds.has(col.id) ? '▲' : '▼' }}
              </span>
              <button
                class="text-xs text-mt-sub hover:text-red-400 transition-colors"
                title="删除收藏夹"
                @click.stop="handleDelete(col.id)"
              >
                删除
              </button>
            </div>
          </div>

          <!-- 展开区域：显示收藏的课程（目前只展示数量提示，后续可接 lesson_ref 解析） -->
          <div
            v-if="expandedIds.has(col.id)"
            class="border-t border-mt-border px-4 py-3"
          >
            <p v-if="col.item_count === 0" class="text-xs text-mt-sub/60">
              暂无收藏课程，在题目列表页点击 ★ 添加
            </p>
            <p v-else class="text-xs text-mt-sub/60">
              共 {{ col.item_count }} 道课程（在题目列表页管理）
            </p>
          </div>
        </li>

        <li v-if="collections.length === 0" class="text-xs text-mt-sub/60 py-2">
          暂无收藏夹，点击「+ 新建」创建
        </li>
      </ul>
    </template>
  </section>
</template>
