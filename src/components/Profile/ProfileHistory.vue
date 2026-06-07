<script setup>
const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
  getLessonTitle: {
    type: Function,
    required: true,
  },
})

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function formatAccuracy(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  return `${num.toFixed(1)}%`
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <h2 class="border-b border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900">历史成绩</h2>

    <div v-if="results.length === 0" class="flex h-32 items-center justify-center text-sm text-slate-500">
      还没有练习记录，去课程页挑一节开始吧。
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-2 font-medium">课程名</th>
            <th class="px-4 py-2 font-medium">WPM</th>
            <th class="px-4 py-2 font-medium">准确率</th>
            <th class="px-4 py-2 font-medium">时间</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="result in results" :key="result.id" class="hover:bg-slate-50">
            <td class="px-4 py-2 font-medium text-slate-900">
              {{ getLessonTitle(result.lesson_id) }}
            </td>
            <td class="px-4 py-2 tabular-nums">{{ result.wpm }}</td>
            <td class="px-4 py-2 tabular-nums">{{ formatAccuracy(result.accuracy) }}</td>
            <td class="px-4 py-2 text-slate-500">{{ formatDateTime(result.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
