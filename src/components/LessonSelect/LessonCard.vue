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

function getLabel(category) {
  return categoryLabel[category] ?? category
}
</script>

<template>
  <RouterLink
    :to="{ name: 'lesson', params: { id: lesson.id } }"
    class="lesson-card group panel block p-4 transition-colors hover:border-mt-accent/50"
  >
    <div class="flex items-start justify-between gap-2 mb-5">
      <span class="text-xs text-mt-sub uppercase tracking-widest">
        {{ getLabel(lesson.category) }}
      </span>
      <div class="flex items-center gap-0.5" :title="`难度 ${lesson.difficulty}/5`">
        <span
          v-for="n in 5"
          :key="n"
          class="inline-block w-1 h-3"
          :class="n <= lesson.difficulty ? 'bg-mt-accent' : 'bg-mt-border'"
        />
      </div>
    </div>

    <h3 class="text-sm text-mt-text group-hover:text-mt-accent transition-colors leading-snug">
      {{ lesson.title }}
    </h3>

    <div class="mt-4 flex items-center justify-between">
      <span class="text-xs text-mt-sub/60 group-hover:text-mt-accent/60 transition-colors">→ 开始练习</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.lesson-card {
  display: block;
}
</style>
