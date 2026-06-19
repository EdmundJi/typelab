<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  currentLine: {
    type: Number,
    default: 1,
  },
})

const lineCount = computed(() => {
  if (!props.text) return 1
  // Count newlines; number of lines = newlines + 1
  const nl = (props.text.match(/\n/g) || []).length
  return nl + 1
})

const lines = computed(() => {
  return Array.from({ length: lineCount.value }, (_, i) => i + 1)
})
</script>

<template>
  <div class="line-numbers" aria-hidden="true">
    <div
      v-for="n in lines"
      :key="n"
      class="line-number"
      :class="{ 'line-number--active': n === currentLine }"
    >
      {{ n }}
    </div>
  </div>
</template>

<style scoped>
.line-numbers {
  display: flex;
  flex-direction: column;
  width: 3rem;
  flex-shrink: 0;
  text-align: right;
  padding-right: 0.75rem;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  user-select: none;
  color: rgb(var(--mt-sub) / 0.5);
}

.line-number {
  padding: 0 0.25rem;
  border-radius: 2px;
  white-space: nowrap;
}

.line-number--active {
  background-color: rgb(var(--mt-text) / 0.06);
  color: rgb(var(--mt-text) / 0.7);
}
</style>
