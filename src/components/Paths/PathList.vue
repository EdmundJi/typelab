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
      class="border border-mt-border bg-mt-bg p-4 cursor-pointer hover:border-mt-accent/60 transition-colors"
      :class="selectedPathId === path.id ? 'border-mt-accent' : ''"
      @click="emit('select', path)"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h3 class="text-mt-fg text-xs font-bold tracking-wider uppercase mb-1 truncate">
            {{ path.name }}
          </h3>
          <p class="text-mt-sub text-xs leading-relaxed">{{ path.description }}</p>
        </div>

        <!-- Progress badge -->
        <div class="shrink-0 text-right">
          <span class="text-mt-accent font-mono text-xs font-bold">
            {{ completedCount(path) }}<span class="text-mt-sub font-normal">/{{ totalCount(path) }}</span>
          </span>
          <p class="text-mt-sub text-xs mt-0.5">已完成</p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-3 h-0.5 bg-mt-border overflow-hidden">
        <div
          class="h-full bg-mt-accent transition-all duration-300"
          :style="{ width: totalCount(path) > 0 ? `${(completedCount(path) / totalCount(path)) * 100}%` : '0%' }"
        />
      </div>
    </li>
  </ul>
</template>
