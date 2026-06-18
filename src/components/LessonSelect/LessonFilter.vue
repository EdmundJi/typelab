<script setup>
defineProps({
  categories: {
    type: Array,
    required: true,
  },
  activeCategory: {
    type: String,
    default: 'all',
  },
})

defineEmits(['update:activeCategory'])

function categoryLabel(cat) {
  const map = {
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
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="cat in categories"
      :key="cat"
      type="button"
      class="filter-btn"
      :class="activeCategory === cat ? 'active' : ''"
      @click="$emit('update:activeCategory', cat)"
    >
      {{ categoryLabel(cat) }}
    </button>
  </div>
</template>

<style scoped>
.filter-btn {
  padding: 4px 10px;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 500;
  border: 1px solid rgb(var(--mt-border));
  color: rgb(var(--mt-sub));
  background: transparent;
  transition: color 0.12s, border-color 0.12s, background 0.12s;
  cursor: pointer;
}

.filter-btn:hover {
  color: rgb(var(--mt-text));
  border-color: rgb(var(--mt-sub));
}

.filter-btn.active {
  background: rgb(var(--mt-accent));
  color: rgb(var(--mt-bg));
  border-color: rgb(var(--mt-accent));
}
</style>
