<template>
  <div class="device-chart" ref="chartRef"></div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { deviceTypeConfig, ALERT_LEVEL_COLORS } from '../../data/deviceConfig'

const props = defineProps({
  deviceType: {
    type: String,
    required: true,
  },
  elementKey: {
    type: String,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
  showThresholds: {
    type: Boolean,
    default: true,
  },
})

const chartRef = ref(null)
let chartInstance = null
let currentTimes = []
let currentDates = []

const deviceConfig = computed(() => deviceTypeConfig[props.deviceType] || {})
const elementConfig = computed(() => deviceConfig.value.elements?.find((e) => e.key === props.elementKey) || {})
const thresholds = computed(() => deviceConfig.value.thresholds?.[props.elementKey] || {})

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  chartInstance.on('datazoom', handleDataZoom)
  updateChart()
  window.addEventListener('resize', handleResize)
}

function updateChart() {
  if (!chartInstance || !props.data.length) return

  const times = props.data.map((item) => {
    const date = new Date(item.time)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  currentTimes = times
  currentDates = props.data.map((item) => new Date(item.time))
  const values = props.data.map((item) => Number(item.value).toFixed(2))
  const accent = deviceConfig.value.color || '#0284c7'
  const thresholdKeys = ['blue', 'yellow', 'orange', 'red']

  const markLines = []
  if (props.showThresholds && Object.keys(thresholds.value).length > 0) {
    thresholdKeys.forEach((level) => {
      const value = thresholds.value[level]
      if (value === undefined) return

      const levelConfig = ALERT_LEVEL_COLORS[level]
      markLines.push({
        yAxis: value,
        lineStyle: {
          color: levelConfig.color,
          type: 'dashed',
          width: 2,
        },
        label: {
          show: false,
        },
      })
    })
  }

  const startTime = formatLabel(currentDates[0])
  const endTime = formatLabel(currentDates[currentDates.length - 1])
  const chartType = elementConfig.value.chartType || 'line'

  chartInstance.setOption({
    animationDuration: 220,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12, fontWeight: 600 },
      padding: 10,
      formatter: (params) => {
        const point = params[0]
        return `<strong>${point.axisValue}</strong><br/>${elementConfig.value.name}: ${point.value} ${elementConfig.value.unit || ''}`
      },
    },
    graphic: [
      {
        id: 'time-start',
        type: 'text',
        left: 6,
        bottom: 4,
        style: {
          text: startTime,
          fill: '#334155',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
        },
      },
      {
        id: 'time-end',
        type: 'text',
        right: 6,
        bottom: 4,
        style: {
          text: endTime,
          fill: '#334155',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
        },
      },
    ],
    grid: {
      top: 38,
      right: 18,
      bottom: 28,
      left: 54,
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        start: 0,
        end: 100,
        left: 54,
        right: 54,
        height: 6,
        bottom: 8,
        borderColor: 'transparent',
        backgroundColor: 'rgba(203, 213, 225, 0.3)',
        fillerColor: 'rgba(14, 165, 233, 0.3)',
        borderRadius: 3,
        handleIcon: 'circle',
        handleSize: 12,
        handleStyle: {
          color: '#0ea5e9',
          borderWidth: 0,
          shadowBlur: 0,
        },
        moveHandleSize: 0,
        emphasis: {
          handleStyle: {
            color: '#0284c7',
            shadowBlur: 4,
            shadowColor: 'rgba(14, 165, 233, 0.3)',
          },
        },
        dataBackground: {
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
        },
        selectedDataBackground: {
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
        },
        showDetail: false,
        brushSelect: false,
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: false,
        moveOnMouseWheel: false,
      },
    ],
    xAxis: {
      type: 'category',
      data: times,
      boundaryGap: chartType === 'bar',
      axisLine: { show: false },
      axisLabel: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: `${elementConfig.value.name || ''}${elementConfig.value.unit ? ` (${elementConfig.value.unit})` : ''}`,
      nameTextStyle: { color: '#475569', fontSize: 11, fontWeight: 700, padding: [0, 0, 8, 0] },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#334155', fontSize: 11, fontWeight: 600 },
    },
    series: [{
      name: elementConfig.value.name,
      data: values,
      type: chartType === 'area' ? 'line' : chartType,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: {
        color: accent,
        width: 3,
      },
      itemStyle: {
        color: accent,
      },
      barWidth: chartType === 'bar' ? 18 : undefined,
      areaStyle: chartType === 'area' || chartType === 'line' ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${accent}55` },
          { offset: 1, color: `${accent}06` },
        ]),
      } : undefined,
      markLine: markLines.length > 0 ? {
        silent: true,
        symbol: 'none',
        data: markLines,
      } : undefined,
    }],
  })
}

function handleResize() {
  chartInstance?.resize()
}

function formatLabel(date) {
  if (!date || Number.isNaN(date.getTime())) return '--'
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function handleDataZoom() {
  if (!chartInstance || !currentDates.length) return
  const option = chartInstance.getOption()
  const zoom = option.dataZoom[0]
  const total = currentDates.length
  const startIdx = Math.max(0, Math.round(zoom.start / 100 * (total - 1)))
  const endIdx = Math.min(total - 1, Math.round(zoom.end / 100 * (total - 1)))
  chartInstance.setOption({
    graphic: [
      { id: 'time-start', style: { text: formatLabel(currentDates[startIdx]) } },
      { id: 'time-end', style: { text: formatLabel(currentDates[endIdx]) } },
    ],
  })
}

watch(() => props.data, () => updateChart())
watch(() => props.elementKey, () => updateChart())

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.device-chart {
  width: 100%;
  height: 100%;
  min-height: 120px;
}
</style>
