<script setup>
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
})

const chartEl = ref(null)
let chartInstance = null

function buildOption(results) {
  const points = [...results]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((result) => [result.created_at, result.wpm])

  return {
    grid: { left: 50, right: 20, top: 40, bottom: 50 },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const point = params[0]
        if (!point) return ''
        const date = new Date(point.value[0])
        return `${date.toLocaleString()}<br/>WPM: <strong>${point.value[1]}</strong>`
      },
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: (value) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'WPM',
      nameLocation: 'end',
    },
    series: [
      {
        type: 'line',
        name: 'WPM',
        data: points,
        smooth: true,
        showSymbol: points.length <= 1 ? false : true,
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { color: '#0ea5e9' },
        areaStyle: {
          color: 'rgba(14, 165, 233, 0.15)',
        },
      },
    ],
  }
}

function render() {
  if (!chartInstance) return
  if (props.results.length === 0) {
    chartInstance.clear()
    return
  }
  chartInstance.setOption(buildOption(props.results), true)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  chartInstance = echarts.init(chartEl.value)
  render()
  window.addEventListener('resize', handleResize)
})

watch(() => props.results, render, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="mb-3 text-lg font-semibold text-slate-900">进步趋势</h2>
    <div v-if="results.length === 0" class="flex h-64 items-center justify-center text-sm text-slate-500">
      暂无练习记录，完成一次练习后会在这里看到趋势曲线。
    </div>
    <div v-else ref="chartEl" class="h-64 w-full"></div>
  </div>
</template>
