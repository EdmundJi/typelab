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
  <div class="filter-bar panel p-3 sm:p-4">
    <div class="filter-top-row">
      <label class="search-field">
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span class="sr-only">搜索课程</span>
        <input
          :value="search"
          placeholder="搜索课程名称…"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="language-field">
        <span>语言</span>
        <select
          :value="language"
          aria-label="按语言筛选"
          @change="$emit('update:language', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="lang in languages" :key="lang" :value="lang">{{ languageLabel(lang) }}</option>
        </select>
      </label>
    </div>

    <div class="category-row" aria-label="课程分类">
      <button
        v-for="cat in categories"
        :key="cat"
        type="button"
        class="filter-btn"
        :class="activeCategory === cat ? 'active' : ''"
        :aria-pressed="activeCategory === cat"
        @click="$emit('update:activeCategory', cat)"
      >
        {{ categoryLabel(cat) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: grid;
  gap: 0.75rem;
}

.filter-top-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.search-field {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0 0.75rem;
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-bg) / 0.58);
  color: rgb(var(--mt-sub));
}

.search-field:focus-within {
  border-color: rgb(var(--mt-accent));
  color: rgb(var(--mt-accent));
}

.search-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgb(var(--mt-text));
  font-size: 0.8125rem;
}

.search-field input::placeholder {
  color: rgb(var(--mt-sub) / 0.72);
}

.language-field {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0 0.75rem;
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-bg) / 0.58);
  color: rgb(var(--mt-sub));
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.language-field select {
  border: 0;
  outline: 0;
  background: transparent;
  color: rgb(var(--mt-text));
  font-size: 0.72rem;
}

.category-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filter-btn { min-height: 2rem; padding: 4px 11px; font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; border: 1px solid transparent; color: rgb(var(--mt-sub)); background: transparent; transition: color 0.12s, border-color 0.12s, background 0.12s; cursor: pointer; }
.filter-btn:hover { color: rgb(var(--mt-text)); border-color: rgb(var(--mt-sub)); }
.filter-btn.active { background: rgb(var(--mt-accent)); color: rgb(var(--mt-bg)); border-color: rgb(var(--mt-accent)); }

@media (max-width: 639px) {
  .filter-top-row {
    grid-template-columns: 1fr;
  }

  .language-field {
    justify-content: space-between;
  }

  .category-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin: 0 -0.75rem -0.25rem;
    padding: 0 0.75rem 0.35rem;
    scrollbar-width: none;
  }

  .category-row::-webkit-scrollbar {
    display: none;
  }

  .filter-btn {
    flex: 0 0 auto;
  }
}
</style>
