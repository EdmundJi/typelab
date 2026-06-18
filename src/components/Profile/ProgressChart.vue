<script setup>
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onMounted, ref, watch } from 'vue'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
})

const chartEl = ref(null)
let chart = null

function buildOption(results) {
  const sorted = [...results].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const dates = sorted.map((r) =>
    new Date(r.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
  )
  const wpms = sorted.map((r) => r.wpm)

  return {
    backgroundColor: 'transparent',
    grid: { top: 16, right: 16, bottom: 32, left: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e1e1e',
      borderColor: '#2a2a2a',
      textStyle: { color: '#d1d0c5', fontFamily: 'JetBrains Mono', fontSize: 12 },
      formatter: (params) => `${params[0].name}<br/><b>${params[0].value} wpm</b>`,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#2a2a2a' } },
      axisTick: { show: false },
      axisLabel: { color: '#646669', fontSize: 11, fontFamily: 'JetBrains Mono' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#2a2a2a' } },
      axisLabel: { color: '#646669', fontSize: 11, fontFamily: 'JetBrains Mono' },
    },
    series: [
      {
        type: 'line',
        data: wpms,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#e2b714', width: 2 },
        itemStyle: { color: '#e2b714' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#e2b71430' },
            { offset: 1, color: '#e2b71400' },
          ]),
        },
      },
    ],
  }
}

function render() {
  if (!chart || props.results.length < 2) return
  chart.setOption(buildOption(props.results))
}

onMounted(() => {
  chart = echarts.init(chartEl.value)
  render()
})

watch(() => props.results, render)
</script>

<template>
  <div>
    <p class="text-xs text-mt-sub mb-3">WPM 趋势</p>
    <div v-if="results.length < 2" class="py-8 text-center text-sm text-mt-sub">
      完成至少 2 次练习后显示趋势图
    </div>
    <div v-else ref="chartEl" class="w-full h-48" />
  </div>
</template>
