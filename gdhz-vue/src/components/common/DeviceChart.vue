<template>
  <div class="device-chart" ref="chartRef"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
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

// 获取设备配置
const deviceConfig = computed(() => deviceTypeConfig[props.deviceType] || {})
const elementConfig = computed(() => {
  return deviceConfig.value.elements?.find(e => e.key === props.elementKey) || {}
})
const thresholds = computed(() => {
  return deviceConfig.value.thresholds?.[props.elementKey] || {}
})

function initChart() {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
  
  window.addEventListener('resize', handleResize)
}

function updateChart() {
  if (!chartInstance || !props.data.length) return
  
  const times = props.data.map(d => {
    const date = new Date(d.time)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  const values = props.data.map(d => d.value.toFixed(2))
  
  // 构建阈值参考线
  const markLines = []
  if (props.showThresholds && Object.keys(thresholds.value).length > 0) {
    Object.entries(thresholds.value).forEach(([level, value]) => {
      const levelConfig = ALERT_LEVEL_COLORS[level]
      markLines.push({
        yAxis: value,
        lineStyle: {
          color: levelConfig.color,
          type: 'dashed',
          width: 2,
        },
        label: {
          formatter: `${levelConfig.name}: ${value}${elementConfig.value.unit}`,
          color: levelConfig.color,
          fontSize: 10,
        },
      })
    })
  }
  
  const chartType = elementConfig.value.chartType || 'line'
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(8, 25, 50, 0.9)',
      borderColor: 'var(--border-normal)',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (params) => {
        const p = params[0]
        return `<strong>${p.axisValue}</strong><br/>
                ${elementConfig.value.name}: ${p.value} ${elementConfig.value.unit}`
      }
    },
    grid: {
      top: 30,
      right: 15,
      bottom: 30,
      left: 45,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: 'rgba(0, 180, 230, 0.3)' } },
      axisLabel: { 
        color: '#5a7a9a', 
        fontSize: 9,
        interval: Math.floor(times.length / 6),
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: `${elementConfig.value.name} (${elementConfig.value.unit})`,
      nameTextStyle: { color: '#5a7a9a', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      axisLabel: { color: '#5a7a9a', fontSize: 9 },
    },
    series: [{
      name: elementConfig.value.name,
      data: values,
      type: chartType === 'area' ? 'line' : chartType,
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      showSymbol: false,
      lineStyle: {
        color: deviceConfig.value.color || '#00e5ff',
        width: 2,
      },
      itemStyle: {
        color: deviceConfig.value.color || '#00e5ff',
      },
      areaStyle: chartType === 'area' || chartType === 'line' ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${deviceConfig.value.color || '#00e5ff'}66` },
          { offset: 1, color: `${deviceConfig.value.color || '#00e5ff'}00` },
        ]),
      } : undefined,
      markLine: markLines.length > 0 ? {
        silent: true,
        symbol: 'none',
        data: markLines,
      } : undefined,
    }],
  }
  
  chartInstance.setOption(option)
}

function handleResize() {
  chartInstance?.resize()
}

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

watch(() => props.elementKey, () => {
  updateChart()
})

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
  min-height: 150px;
}
</style>
