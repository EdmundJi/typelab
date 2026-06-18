<script setup>
import { getAvatar } from '@/lib/avatar'

defineProps({
  entries: {
    type: Array,
    required: true,
  },
  currentUserId: {
    type: String,
    default: null,
  },
})

function getEmailPrefix(email) {
  if (!email) return '—'
  return email.split('@')[0]
}

const medalStyle = [
  { bg: '#e2b714', label: '1' },
  { bg: '#9e9e9e', label: '2' },
  { bg: '#cd7f32', label: '3' },
]
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-mt-border text-left">
          <th class="pb-3 pr-4 text-xs text-mt-sub font-medium w-12">#</th>
          <th class="pb-3 pr-4 text-xs text-mt-sub font-medium">用户</th>
          <th class="pb-3 pr-4 text-xs text-mt-sub font-medium text-right">wpm</th>
          <th class="pb-3 text-xs text-mt-sub font-medium text-right">accuracy</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, i) in entries"
          :key="entry.user_id"
          class="border-b border-mt-border last:border-0 transition-colors"
          :class="entry.user_id === currentUserId ? 'bg-mt-surface/60' : ''"
        >
          <td class="py-3 pr-4">
            <span
              v-if="i < 3"
              class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              :style="{ backgroundColor: medalStyle[i].bg, color: '#111' }"
            >{{ medalStyle[i].label }}</span>
            <span v-else class="text-xs font-bold text-mt-sub">{{ i + 1 }}</span>
          </td>
          <td class="py-3 pr-4">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                :style="{ backgroundColor: getAvatar(entry.email).color }"
              >{{ getAvatar(entry.email).letter }}</span>
              <span class="text-mt-text">{{ getEmailPrefix(entry.email) }}</span>
            </div>
          </td>
          <td class="py-3 pr-4 text-right font-bold text-mt-accent">{{ entry.best_wpm ?? entry.wpm }}</td>
          <td class="py-3 text-right text-mt-sub">{{ entry.accuracy != null ? entry.accuracy + '%' : '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
