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
      class="rounded-full px-4 py-1.5 text-sm font-medium transition"
      :class="
        activeCategory === cat
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
      "
      @click="$emit('update:activeCategory', cat)"
    >
      {{ categoryLabel(cat) }}
    </button>
  </div>
</template>
