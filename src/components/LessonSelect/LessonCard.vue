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

const categoryColor = {
  warmup: 'bg-green-100 text-green-700',
  sorting: 'bg-blue-100 text-blue-700',
  trees: 'bg-emerald-100 text-emerald-700',
  dp: 'bg-purple-100 text-purple-700',
  graph: 'bg-orange-100 text-orange-700',
  js: 'bg-yellow-100 text-yellow-700',
  concepts: 'bg-pink-100 text-pink-700',
}

function getCategoryLabel(category) {
  return categoryLabel[category] ?? category
}

function getCategoryColor(category) {
  return categoryColor[category] ?? 'bg-slate-100 text-slate-700'
}
</script>

<template>
  <RouterLink
    :to="{ name: 'lesson', params: { id: lesson.id } }"
    class="group block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
  >
    <h3 class="mb-2 text-base font-semibold text-slate-900 group-hover:text-blue-700">
      {{ lesson.title }}
    </h3>

    <div class="mb-3 flex items-center gap-2">
      <span
        class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
        :class="getCategoryColor(lesson.category)"
      >
        {{ getCategoryLabel(lesson.category) }}
      </span>
    </div>

    <div class="flex items-center gap-0.5" :title="`难度 ${lesson.difficulty} / 5`">
      <svg
        v-for="n in 5"
        :key="n"
        class="h-4 w-4"
        :class="n <= lesson.difficulty ? 'text-amber-400' : 'text-slate-200'"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.284-3.957z"
        />
      </svg>
    </div>
  </RouterLink>
</template>
