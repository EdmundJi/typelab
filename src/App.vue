<script setup>
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
themeStore.apply()
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>