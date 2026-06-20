<script setup lang="ts">
defineProps({
  paths: {
    type: Array,
    required: true,
  },
  selectedPathId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select'])

function completedCount(path) {
  // paths from db.js already include items; progress is computed in PathsView
  return path._completedCount ?? 0
}

function totalCount(path) {
  return (path.items ?? []).length
}
</script>

<template>
  <ul class="space-y-3">
    <li
      v-for="path in paths"
      :key="path.id"
    >
      <button
        class="panel w-full p-5 text-left transition-all hover:-translate-y-0.5 hover:border-mt-accent/60 hover:shadow-[var(--card-hover-shadow)]"
        :class="selectedPathId === path.id ? 'border-mt-accent' : ''"
        type="button"
        @click="emit('select', path)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h3 class="text-mt-text text-sm font-semibold mb-1.5 truncate">
              {{ path.name }}
            </h3>
            <p class="text-mt-sub text-xs leading-relaxed">{{ path.description }}</p>
          </div>

          <div class="shrink-0 text-right">
            <span class="text-mt-accent font-mono text-sm font-bold">
              {{ completedCount(path) }}<span class="text-mt-sub font-normal">/{{ totalCount(path) }}</span>
            </span>
            <p class="text-mt-sub text-[11px] mt-0.5">已完成</p>
          </div>
        </div>

        <div class="mt-4 h-1 bg-mt-border overflow-hidden">
          <div
            class="h-full bg-mt-accent transition-all duration-300"
            :style="{ width: totalCount(path) > 0 ? `${(completedCount(path) / totalCount(path)) * 100}%` : '0%' }"
          />
        </div>
      </button>
    </li>
  </ul>
</template>
