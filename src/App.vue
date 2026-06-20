<script setup lang="ts">
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
themeStore.apply()
themeStore.listenSystem()
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>