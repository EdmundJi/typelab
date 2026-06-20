<script setup lang="ts">
import AppFooter from './AppFooter.vue'
import AppNavbar from './AppNavbar.vue'
</script>

<template>
  <div class="min-h-screen bg-mt-bg text-mt-text flex flex-col">
    <!-- Aurora: 1px accent line at top -->
    <div
      class="fixed top-0 inset-x-0 h-px z-50 pointer-events-none"
      style="background: linear-gradient(90deg, transparent 0%, var(--aurora-edge) 35%, var(--aurora-line) 50%, var(--aurora-edge) 65%, transparent 100%)"
    />
    <!-- Aurora: soft downward glow below the line -->
    <div
      class="fixed top-0 inset-x-0 h-48 z-0 pointer-events-none"
      style="background: linear-gradient(180deg, var(--aurora-glow) 0%, transparent 100%)"
    />
    <AppNavbar />
    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10 relative z-10">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
