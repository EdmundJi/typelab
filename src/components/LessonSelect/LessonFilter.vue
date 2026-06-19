<script setup lang="ts">
defineProps<{
  categories: string[]
  activeCategory?: string
  search?: string
  languages?: string[]
  language?: string
}>()
defineEmits<{
  'update:activeCategory': [value: string]
  'update:search': [value: string]
  'update:language': [value: string]
}>()

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    all: '全部',
    warmup: '热身',
    sorting: '排序',
    trees: '树',
    dp: 'DP',
    graph: '图',
    js: 'JS',
    concepts: '概念',
  }
  return map[cat] ?? cat
}
function languageLabel(lang: string) {
  const map: Record<string, string> = {
    all: '全部',
    python: 'Python',
    javascript: 'JavaScript',
    js: 'JavaScript',
    go: 'Go',
    text: '其他',
  }
  return map[lang] ?? lang
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <input
      :value="search"
      class="bg-transparent border border-mt-border px-3 py-1.5 text-xs text-mt-text placeholder-mt-sub/50 focus:outline-none focus:border-mt-accent"
      placeholder="搜索课程…"
      @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
    />
    <div class="flex flex-wrap gap-1.5">
      <button v-for="cat in categories" :key="cat" type="button" class="filter-btn" :class="activeCategory === cat ? 'active' : ''" @click="$emit('update:activeCategory', cat)">{{ categoryLabel(cat) }}</button>
    </div>
    <select
      :value="language"
      class="bg-mt-bg border border-mt-border px-2 py-1.5 text-xs text-mt-sub focus:outline-none focus:border-mt-accent"
      @change="$emit('update:language', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="lang in languages" :key="lang" :value="lang">{{ languageLabel(lang) }}</option>
    </select>
  </div>
</template>

<style scoped>
.filter-btn { padding: 4px 10px; font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500; border: 1px solid rgb(var(--mt-border)); color: rgb(var(--mt-sub)); background: transparent; transition: color 0.12s, border-color 0.12s, background 0.12s; cursor: pointer; }
.filter-btn:hover { color: rgb(var(--mt-text)); border-color: rgb(var(--mt-sub)); }
.filter-btn.active { background: rgb(var(--mt-accent)); color: rgb(var(--mt-bg)); border-color: rgb(var(--mt-accent)); }
</style>
