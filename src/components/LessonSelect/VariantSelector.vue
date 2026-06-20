<script setup lang="ts">
import type { Variant } from '@/types'

const props = defineProps<{ variants: Variant[]; modelValue: string }>()

const emit = defineEmits(['update:modelValue'])

function select(variantId: string) {
  if (variantId !== props.modelValue) {
    emit('update:modelValue', variantId)
  }
}

function variantLabel(variant: Variant) {
  return variant.label
}
</script>

<template>
  <div v-if="variants.length > 1" class="variant-selector mb-4 flex flex-wrap gap-2">
    <button
      v-for="variant in variants"
      :key="variant.variant_id"
      class="variant-btn"
      :class="{ active: variant.variant_id === modelValue }"
      type="button"
      @click="select(variant.variant_id)"
    >
      {{ variantLabel(variant) }}
    </button>
  </div>
</template>

<style scoped>
.variant-selector {
  border-bottom: 1px solid rgb(var(--mt-border));
  padding-bottom: 0.75rem;
}

.variant-btn {
  min-height: 2.25rem;
  padding: 0.35rem 0.8rem;
  font-size: 0.7rem;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgb(var(--mt-border));
  background: transparent;
  color: rgb(var(--mt-sub));
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.variant-btn:hover {
  border-color: rgb(var(--mt-accent));
  color: rgb(var(--mt-accent));
}

.variant-btn.active {
  border-color: rgb(var(--mt-accent));
  background: rgb(var(--mt-accent) / 0.1);
  color: rgb(var(--mt-accent));
}
</style>
