<script setup>
import AppNavbar from './AppNavbar.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <AppNavbar />
    <main class="mx-auto w-full max-w-5xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
