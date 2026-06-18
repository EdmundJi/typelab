<script setup>
import { onMounted, ref } from 'vue'
import { listUserAchievements } from '@/lib/adapters/db'
import { ACHIEVEMENTS } from '@/lib/domain/achievements'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const unlockedIds = ref(new Set())

onMounted(async () => {
  const userId = userStore.user?.id
  if (!userId) return
  try {
    const ids = await listUserAchievements(userId)
    unlockedIds.value = new Set(ids)
  } catch (err) {
    console.warn('[AchievementBadges] 获取成就失败', err)
  }
})

function isUnlocked(id) {
  return unlockedIds.value.has(id)
}
</script>

<template>
  <div class="mb-8">
    <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-4">// 成就</p>
    <div class="grid grid-cols-4 gap-3 sm:grid-cols-7">
      <div
        v-for="achievement in ACHIEVEMENTS"
        :key="achievement.id"
        class="achievement-badge"
        :class="isUnlocked(achievement.id) ? 'unlocked' : 'locked'"
        :title="`${achievement.name}：${achievement.condition}`"
      >
        <div class="badge-icon">
          <span v-if="isUnlocked(achievement.id)" class="text-xl">★</span>
          <span v-else class="text-xl opacity-30">☆</span>
        </div>
        <div class="badge-name">{{ achievement.name }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievement-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 4px;
  border: 1px solid rgb(var(--mt-border));
  cursor: default;
  transition: opacity 0.2s, border-color 0.2s;
  text-align: center;
}

.achievement-badge.unlocked {
  border-color: rgb(var(--mt-accent) / 0.5);
  background: rgb(var(--mt-accent) / 0.06);
}

.achievement-badge.locked {
  opacity: 0.4;
}

.achievement-badge:hover {
  opacity: 1;
}

.badge-icon {
  line-height: 1;
  color: rgb(var(--mt-accent));
}

.badge-name {
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  color: rgb(var(--mt-sub));
  line-height: 1.2;
}

.achievement-badge.unlocked .badge-name {
  color: rgb(var(--mt-text));
}
</style>
