<script setup lang="ts">
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

const medalColor = ['rank-1', 'rank-2', 'rank-3']
const medalSymbol = ['1st', '2nd', '3rd']
</script>

<template>
  <div class="panel overflow-x-auto">
    <table class="w-full min-w-[34rem] text-xs">
      <thead>
        <tr class="border-b border-mt-border">
          <th class="px-5 py-3.5 text-left font-mono text-mt-sub uppercase tracking-widest font-medium w-14">#</th>
          <th class="px-5 py-3.5 text-left font-mono text-mt-sub uppercase tracking-widest font-medium">用户</th>
          <th class="px-5 py-3.5 text-right font-mono text-mt-sub uppercase tracking-widest font-medium">WPM</th>
          <th class="px-5 py-3.5 text-right font-mono text-mt-sub uppercase tracking-widest font-medium">accuracy</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, i) in entries"
          :key="entry.user_id"
          class="border-b border-mt-border last:border-0 transition-colors"
          :class="entry.user_id === currentUserId ? 'bg-mt-accent/5' : 'hover:bg-mt-surface/50'"
        >
          <td class="px-5 py-4">
            <span
              class="text-xs font-bold font-mono"
              :class="i < 3 ? medalColor[i] : 'text-mt-sub'"
            >
              {{ i < 3 ? medalSymbol[i] : String(i + 1).padStart(2, '0') }}
            </span>
          </td>
          <td class="px-5 py-4 text-mt-text">{{ getEmailPrefix(entry.email) }}</td>
          <td class="px-5 py-4 text-right font-bold text-mt-accent font-mono text-sm">
            {{ entry.best_wpm ?? entry.wpm }}
          </td>
          <td class="px-5 py-4 text-right text-mt-sub font-mono">
            {{ entry.accuracy != null ? entry.accuracy + '%' : '—' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.rank-1 { color: rgb(var(--mt-accent)); }
.rank-2 { color: rgb(var(--mt-sub)); }
.rank-3 { color: #a07040; }
</style>
