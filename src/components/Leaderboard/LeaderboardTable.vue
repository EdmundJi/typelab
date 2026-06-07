<script setup>
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

const medalColor = ['text-mt-accent', 'text-mt-sub', 'text-mt-sub']
const medalSymbol = ['1st', '2nd', '3rd']
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
          class="border-b border-mt-border last:border-0"
          :class="{ 'bg-mt-accent/10': entry.user_id === currentUserId }"
        >
          <td class="py-3 pr-4">
            <span
              class="text-xs font-bold"
              :class="i < 3 ? medalColor[i] : 'text-mt-sub'"
            >
              {{ i < 3 ? medalSymbol[i] : i + 1 }}
            </span>
          </td>
          <td class="py-3 pr-4 text-mt-text">{{ getEmailPrefix(entry.email) }}</td>
          <td class="py-3 pr-4 text-right font-bold text-mt-accent">{{ entry.best_wpm ?? entry.wpm }}</td>
          <td class="py-3 text-right text-mt-sub">{{ entry.accuracy != null ? entry.accuracy + '%' : '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
