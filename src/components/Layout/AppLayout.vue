<script setup>
import AppNavbar from './AppNavbar.vue'
</script>

<template>
  <div class="min-h-screen bg-mt-bg text-mt-text font-mono">
    <AppNavbar />
    <main class="mx-auto w-full max-w-5xl px-6 py-10">
      <slot />
    </main>
  </div>
</template>
