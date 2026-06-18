<script setup>
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
})

const chartEl = ref(null)
let chart = null

const themeStore = useThemeStore()

function getThemeColors() {
  const style = getComputedStyle(document.documentElement)
  return {
    surface: style.getPropertyValue('--mt-surface').trim(),
    border: style.getPropertyValue('--mt-border').trim(),
    text: style.getPropertyValue('--mt-text').trim(),
    sub: style.getPropertyValue('--mt-sub').trim(),
    accent: style.getPropertyValue('--mt-accent').trim(),
  }
}

function buildOption(results) {
  const sorted = [...results].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const dates = sorted.map((r) =>
    new Date(r.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
  )
  const wpms = sorted.map((r) => r.wpm)

  const c = getThemeColors()
  const accentRgb = c.accent
  const borderRgb = c.border
  const subRgb = c.sub

  return {
    backgroundColor: 'transparent',
    grid: { top: 16, right: 16, bottom: 32, left: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: `rgb(${c.surface})`,
      borderColor: `rgb(${c.border})`,
      textStyle: { color: `rgb(${c.text})`, fontFamily: 'JetBrains Mono', fontSize: 12 },
      formatter: (params) => `${params[0].name}<br/><b>${params[0].value} wpm</b>`,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: `rgb(${borderRgb})` } },
      axisTick: { show: false },
      axisLabel: { color: `rgb(${subRgb})`, fontSize: 11, fontFamily: 'JetBrains Mono' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: `rgb(${borderRgb})` } },
      axisLabel: { color: `rgb(${subRgb})`, fontSize: 11, fontFamily: 'JetBrains Mono' },
    },
    series: [
      {
        type: 'line',
        data: wpms,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: `rgb(${accentRgb})`, width: 2 },
        itemStyle: { color: `rgb(${accentRgb})` },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `rgba(${accentRgb}, 0.19)` },
            { offset: 1, color: `rgba(${accentRgb}, 0)` },
          ]),
        },
      },
    ],
  }
}

function render() {
  if (props.results.length < 2) {
    chart?.dispose()
    chart = null
    return
  }

  if (!chartEl.value) return

  if (!chart) {
    chart = echarts.init(chartEl.value)
  }

  chart.setOption(buildOption(props.results))
}

onMounted(render)

watch(() => props.results, render, { flush: 'post' })
watch(
  () => themeStore.mode,
  async () => {
    await nextTick()
    render()
    chart?.resize()
  },
)

onBeforeUnmount(() => {
  chart?.dispose()
  chart = null
})
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
