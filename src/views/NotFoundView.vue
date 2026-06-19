<template>
  <div class="py-16">
    <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-4">// 404</p>
    <h1 class="text-2xl font-bold text-mt-text mb-6">页面不存在</h1>
    <RouterLink :to="{ name: 'home' }" class="text-sm text-mt-accent hover:opacity-80">← 返回首页</RouterLink>
  </div>
</template>
