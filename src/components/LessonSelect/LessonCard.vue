<script setup>
defineProps({
  lesson: {
    type: Object,
    required: true,
  },
})

const categoryLabel = {
  warmup: '热身',
  sorting: '排序',
  trees: '树',
  dp: 'DP',
  graph: '图',
  js: 'JS',
  concepts: '概念',
}

const difficultyLabel = ['', '入门', '简单', '中等', '困难', '专家']

function getLabel(category) {
  return categoryLabel[category] ?? category
}
</script>

<template>
  <RouterLink
    :to="{ name: 'lesson', params: { id: lesson.id } }"
    class="group block rounded-lg border border-mt-border bg-mt-surface p-5 transition-colors hover:border-mt-accent"
  >
    <div class="flex items-start justify-between gap-2 mb-3">
      <h3 class="text-sm font-semibold text-mt-text group-hover:text-mt-accent transition-colors leading-snug">
        {{ lesson.title }}
      </h3>
      <span class="shrink-0 text-xs text-mt-sub border border-mt-border rounded px-1.5 py-0.5">
        {{ getLabel(lesson.category) }}
      </span>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1" :title="`难度 ${lesson.difficulty}/5`">
        <span
          v-for="n in 5"
          :key="n"
          class="inline-block w-1.5 h-1.5 rounded-full"
          :class="n <= lesson.difficulty ? 'bg-mt-accent' : 'bg-mt-border'"
        />
      </div>
      <span class="text-xs text-mt-sub">{{ difficultyLabel[lesson.difficulty] }}</span>
    </div>
  </RouterLink>
</template>
