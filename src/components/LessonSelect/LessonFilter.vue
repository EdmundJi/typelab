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
  <div class="flex flex-wrap gap-2">
    <button
      v-for="cat in categories"
      :key="cat"
      type="button"
      class="px-3 py-1 text-xs font-medium rounded transition-colors"
      :class="
        activeCategory === cat
          ? 'bg-mt-accent text-mt-bg'
          : 'bg-mt-surface text-mt-sub hover:text-mt-text border border-mt-border'
      "
      @click="$emit('update:activeCategory', cat)"
    >
      {{ categoryLabel(cat) }}
    </button>
  </div>
</template>
