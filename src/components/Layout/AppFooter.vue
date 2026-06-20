<template>
  <footer class="app-footer border-t border-mt-border text-xs text-mt-sub">
    <div class="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
      <div class="flex items-center gap-3">
        <span class="text-mt-text font-mono font-bold tracking-wider">KEYLAB</span>
        <span class="hidden md:inline">为程序员设计的打字练习</span>
        <span>© 2026</span>
      </div>
      <nav class="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px]">
        <RouterLink class="footer-link" to="/#lessons">练习</RouterLink>
        <RouterLink class="footer-link" to="/paths">路径</RouterLink>
        <RouterLink class="footer-link" to="/leaderboard">排行榜</RouterLink>
        <a class="footer-link" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        <span class="text-mt-sub/70">v1.1.0</span>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  transition: color 0.15s;
}

.footer-link:hover {
  color: rgb(var(--mt-accent));
}
</style>
