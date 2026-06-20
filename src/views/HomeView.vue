<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import LessonSelect from '@/components/LessonSelect/index.vue'
import { useStreakStore } from '@/stores/streak'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const streakStore = useStreakStore()
const isLoggedIn = computed(() => Boolean(userStore.session || userStore.user))

// 方案 C：打字机
const fullText = '通过打出真实算法代码，同时训练手速和算法记忆'
const displayedText = ref('')
const cursorOn = ref(true)
let typeTimer: ReturnType<typeof setInterval> | null = null
let blinkTimer: ReturnType<typeof setInterval> | null = null
let scrollObserver: IntersectionObserver | null = null

function startTypewriter() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayedText.value = fullText
    cursorOn.value = true
    return
  }
  // 等进场动画结束后再开始打字
  setTimeout(() => {
    let i = 0
    typeTimer = setInterval(() => {
      if (i < fullText.length) displayedText.value += fullText[i++]
      else if (typeTimer) clearInterval(typeTimer)
    }, 55)
  }, 350)
  blinkTimer = setInterval(() => {
    cursorOn.value = !cursorOn.value
  }, 530)
}

function setupScrollObserver() {
  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          scrollObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12 },
  )
  document.querySelectorAll('.fade-up').forEach((el) => {
    scrollObserver?.observe(el)
  })
}

onMounted(async () => {
  if (userStore.user?.id) streakStore.refresh(userStore.user.id)
  if (!isLoggedIn.value) {
    startTypewriter()
    await nextTick()
    setupScrollObserver()
  }
})

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer)
  if (blinkTimer) clearInterval(blinkTimer)
  scrollObserver?.disconnect()
})
</script>

<template>
  <div>
    <template v-if="!isLoggedIn">
      <!-- 方向二：hero 作为独立色块，顶部橙边 + 主题渐变背景 -->
      <section class="mb-5 hero-section relative overflow-hidden p-6 sm:p-8 lg:p-10">

        <!-- 天幕光锁在 hero 卡片内部 -->
        <div class="hero-spotlight" />

        <!-- 左右分栏 -->
        <div class="hero-content grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-center">

          <!-- 左：文字 -->
          <div>
            <p class="eyebrow mb-3 anim-1">// keylab</p>
            <h1 class="text-3xl sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12] font-bold text-mt-text tracking-tight mb-4 anim-2">
              为程序员设计的打字练习
            </h1>
            <p class="text-mt-sub text-sm sm:text-base leading-relaxed mb-7 min-h-[1.5rem] anim-3">
              {{ displayedText }}<span
                class="text-mt-accent transition-opacity duration-100"
                :class="cursorOn ? 'opacity-100' : 'opacity-0'"
              >▋</span>
            </p>
            <div class="flex flex-wrap gap-3 anim-4">
              <a
                href="#lessons"
                class="min-h-10 inline-flex items-center px-5 bg-mt-accent text-mt-bg font-mono text-xs font-bold uppercase tracking-widest hover:brightness-110 transition"
              >开始练习 →</a>
              <RouterLink
                :to="{ name: 'login' }"
                class="min-h-10 inline-flex items-center px-5 border border-mt-border font-mono text-xs text-mt-sub hover:text-mt-text hover:border-mt-accent/60 transition-colors"
              >注册账号</RouterLink>
            </div>
          </div>

          <!-- 右：终端预览 -->
          <div class="terminal-preview hidden md:flex flex-col anim-5">
            <div class="terminal-header">
              <span class="ln-label">// bfs.py</span>
              <div class="flex gap-1.5">
                <span class="dot" />
                <span class="dot" />
                <span class="dot dot-accent" />
              </div>
            </div>
            <div class="terminal-body">
              <div class="code-line"><span class="ln">1</span><span class="dim">from collections import deque</span></div>
              <div class="code-line"><span class="ln">2</span></div>
              <div class="code-line"><span class="ln">3</span><span class="dim">def bfs(graph, start):</span></div>
              <div class="code-line"><span class="ln">4</span><span class="dim">    visited = set()</span></div>
              <div class="code-line"><span class="ln">5</span><span class="dim">    queue = deque([start])</span></div>
              <div class="code-line active-line">
                <span class="ln">6</span><span class="bright">    visited.add(start)</span><span class="term-cursor">▋</span>
              </div>
              <div class="code-line"><span class="ln">7</span><span class="faint">    while queue:</span></div>
              <div class="code-line"><span class="ln">8</span><span class="faint">        node = queue.popleft()</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 分割线（页面背景层，连接两个色块区） -->
      <div class="flex items-center my-5 fade-up">
        <div class="flex-1 h-px" style="background: linear-gradient(90deg, transparent, var(--divider-line))" />
        <div class="mx-3 w-1 h-1 rounded-full bg-mt-accent" style="box-shadow: 0 0 8px 3px var(--divider-glow-color)" />
        <div class="flex-1 h-px" style="background: linear-gradient(270deg, transparent, var(--divider-line))" />
      </div>

      <!-- 方向一：特性卡片，在页面背景层（比 hero 低一层），各自带阴影浮起 -->
      <div class="grid gap-3 sm:grid-cols-3 mb-10">
        <div class="feature-card panel p-5 fade-up" style="transition-delay: 0ms">
          <span class="feature-index">01</span>
          <h2 class="text-sm font-semibold text-mt-text mb-1.5">真实代码</h2>
          <p class="text-xs leading-relaxed text-mt-sub">不是随机单词，而是 BFS、快排、DP</p>
        </div>
        <div class="feature-card panel p-5 fade-up" style="transition-delay: 100ms">
          <span class="feature-index">02</span>
          <h2 class="text-sm font-semibold text-mt-text mb-1.5">多语言变体</h2>
          <p class="text-xs leading-relaxed text-mt-sub">同一道题可选 Python / JavaScript / Go</p>
        </div>
        <div class="feature-card panel p-5 fade-up" style="transition-delay: 200ms">
          <span class="feature-index">03</span>
          <h2 class="text-sm font-semibold text-mt-text mb-1.5">算法记忆</h2>
          <p class="text-xs leading-relaxed text-mt-sub">打完一道题等于过了一遍实现</p>
        </div>
      </div>
    </template>

    <template v-else>
      <section class="mb-10">
        <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// dashboard</p>
        <div class="grid gap-3 sm:grid-cols-3 mb-5">
          <div class="panel p-4"><p class="text-xs text-mt-sub">Streak</p><p class="text-3xl font-bold text-mt-accent">{{ streakStore.currentStreak }}</p><p class="text-xs text-mt-sub">{{ streakStore.practicedToday ? '今天已练' : '今天去练习' }}</p></div>
          <div class="panel p-4"><p class="text-xs text-mt-sub">练习次数</p><p class="text-3xl font-bold text-mt-text">{{ streakStore.totalCount }}</p><p class="text-xs text-mt-sub">本周 {{ streakStore.weekCount }}</p></div>
          <div class="panel p-4"><p class="text-xs text-mt-sub">个人最佳</p><p class="text-3xl font-bold text-mt-text">{{ streakStore.bestWpm || '-' }}</p><p class="text-xs text-mt-sub">wpm</p></div>
        </div>
        <div class="panel p-4 flex items-center justify-between">
          <div><p class="text-sm text-mt-text">{{ streakStore.lastResult ? '继续上次练习' : '推荐入门课程' }}</p><p class="text-xs text-mt-sub">{{ streakStore.lastResult?.lesson_id ?? '从热身课程开始' }}</p></div>
          <div class="flex gap-3">
            <RouterLink :to="{ name: 'paths' }" class="text-xs text-mt-accent">学习路径 →</RouterLink>
            <RouterLink :to="streakStore.lastResult ? { name: 'lesson', params: { id: String(streakStore.lastResult.lesson_id).replace(/^builtin:/, '') } } : { name: 'home', hash: '#lessons' }" class="text-xs text-mt-accent">继续</RouterLink>
          </div>
        </div>
      </section>
    </template>

    <LessonSelect />
  </div>
</template>

<style scoped>
/* ── Hero 卡片：顶部橙边 + 主题背景 + 阴影 ── */
.hero-section {
  background: var(--hero-card-bg);
  border: 1px solid rgb(var(--mt-border));
  border-top: 2px solid rgb(var(--mt-accent));
  box-shadow: var(--hero-card-shadow);
  isolation: isolate;
}

/* ── 天幕光 ── */
.hero-spotlight {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 180%;
  height: 460px;
  background: radial-gradient(ellipse at 50% 0%, var(--hero-glow) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
}

/* ── 进场动画 ── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: none; }
}

.anim-1 { animation: fadeSlideUp 0.55s ease both; }
.anim-2 { animation: fadeSlideUp 0.55s ease both 0.08s; }
.anim-3 { animation: fadeSlideUp 0.55s ease both 0.16s; }
.anim-4 { animation: fadeSlideUp 0.55s ease both 0.24s; }
.anim-5 { animation: fadeSlideUp 0.55s ease both 0.16s; }

/* ── 滚动触发 fade-up ── */
.fade-up {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-up.is-visible {
  opacity: 1;
  transform: none;
}

/* ── 终端预览 ── */
.terminal-preview {
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-surface-raised));
  opacity: 1;
  transition: opacity 0.2s;
}
.terminal-preview:hover { opacity: 1; }

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  border-bottom: 1px solid rgb(var(--mt-border));
}

.ln-label {
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgb(var(--mt-sub) / 0.78);
}

.dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgb(var(--mt-border) / 0.65);
}
.dot-accent { background: rgb(var(--mt-accent) / 0.5); }

.terminal-body {
  padding: 10px 12px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  line-height: 1.75;
}

.code-line {
  display: flex;
  align-items: baseline;
  white-space: pre;
}

.active-line {
  background: rgb(var(--mt-accent) / 0.06);
  margin: 0 -12px;
  padding: 0 12px;
}

.ln {
  width: 1.4rem;
  font-size: 10px;
  color: rgb(var(--mt-sub) / 0.55);
  flex-shrink: 0;
  user-select: none;
}

.dim    { color: rgb(var(--mt-sub) / 0.9); }
.bright { color: rgb(var(--mt-text)); }
.faint  { color: rgb(var(--mt-sub) / 0.62); }

.term-cursor {
  color: rgb(var(--mt-accent));
  font-size: 10px;
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.feature-card {
  min-height: 8rem;
}

.feature-index {
  display: block;
  margin-bottom: 1rem;
  color: rgb(var(--mt-accent));
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.16em;
}

@media (prefers-reduced-motion: reduce) {
  .anim-1,
  .anim-2,
  .anim-3,
  .anim-4,
  .anim-5 {
    animation: none;
  }

  .fade-up {
    opacity: 1;
    transform: none;
  }

  .term-cursor {
    animation: none;
  }
}
</style>
