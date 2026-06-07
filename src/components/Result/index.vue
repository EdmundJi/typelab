<script setup>
import ResultSummary from './ResultSummary.vue'

defineProps({
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  duration: { type: Number, required: true },
  errors: { type: Number, required: true },
  bestWpm: { type: Number, default: null },
})
</script>

<template>
  <ResultSummary
    :wpm="wpm"
    :accuracy="accuracy"
    :duration="duration"
    :errors="errors"
    :best-wpm="bestWpm"
  />
</template>
