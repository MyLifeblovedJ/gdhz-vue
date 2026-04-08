<template>
  <div class="data-dock">
    <!-- ===== 左栏：站点列表 ===== -->
    <section class="dock-left">
      <div class="dock-title"><i class="fa-solid fa-list"></i> 站点列表</div>
      <div class="station-list">
        <div
          v-for="station in allStations"
          :key="station.name"
          class="station-card"
          :class="[
            'warning-' + station.warningColor,
            { active: selected?.name === station.name }
          ]"
          @click="selectStation(station)"
        >
          <div class="card-head">
            <span class="station-name">{{ station.name }}</span>
            <span class="warning-badge" :class="station.warningColor">{{ getWarningText(station.warningColor) }}</span>
          </div>
          <div class="card-metrics">
            <div class="metric-item">
              <span class="metric-label">{{ station.isTide ? '实测潮位' : '实测浪高' }}</span>
              <span class="metric-value">{{ (station.currentLevel ?? station.currentHeight ?? 0).toFixed(1) }}m</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">预测峰值</span>
              <span class="metric-value peak">{{ (station.maxLevel ?? station.maxHeight ?? 0).toFixed(1) }}m</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">达峰时间</span>
              <span class="metric-value">{{ station.time }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ station.isTide ? '增水' : '波向' }}</span>
              <span class="metric-value" :class="{ highlight: station.surgeHeight > 0.5 }">
                {{ station.isTide ? '+' + (station.surgeHeight || 0).toFixed(2) + 'm' : (station.direction || '--') }}
              </span>
            </div>
          </div>
          <div class="card-footer">
            <span v-if="station.forecastWarning && station.observedWarning" class="dual-badge">预报+实测超警</span>
            <span v-else-if="station.observedWarning" class="obs-badge-sm">实测超警</span>
            <span v-else-if="station.forecastWarning" class="forecast-badge-sm">预报超警</span>
            <span class="over-value" v-if="overWarning(station)">超警 {{ overWarning(station) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 中栏：站点详细数据图表 ===== -->
    <section class="dock-center">
      <div class="center-content" v-if="selected">
        <!-- 站点信息条 -->
        <div class="station-info-bar">
          <div class="info-left">
            <i class="fa-solid fa-location-dot"></i>
            <span class="info-name">{{ selected.name }}</span>
            <span class="warning-badge" :class="selected.warningColor">{{ getWarningText(selected.warningColor) }}</span>
          </div>
          <div class="info-metrics">
            <div class="info-metric">
              <span class="info-label">{{ selected.isTide ? '实测潮位' : '实测浪高' }}</span>
              <span class="info-value">{{ (selected.currentLevel ?? selected.currentHeight ?? 0).toFixed(1) }}m</span>
            </div>
            <div class="info-metric">
              <span class="info-label">预测峰值</span>
              <span class="info-value accent">{{ (selected.maxLevel ?? selected.maxHeight ?? 0).toFixed(1) }}m</span>
            </div>
            <div class="info-metric">
              <span class="info-label">达峰时间</span>
              <span class="info-value">今日 {{ selected.time }}</span>
            </div>
            <div class="info-metric" v-if="selected.isTide">
              <span class="info-label">增水</span>
              <span class="info-value surge">+{{ (selected.surgeHeight || 0).toFixed(2) }}m</span>
            </div>
            <div class="info-metric" v-if="!selected.isTide && selected.direction">
              <span class="info-label">波向</span>
              <span class="info-value">{{ selected.direction }}</span>
            </div>
          </div>
        </div>

        <!-- ECharts 趋势图 -->
        <div class="chart-wrapper">
          <div class="chart-container" ref="chartRef"></div>
        </div>

        <!-- 底部标签 -->
        <div class="chart-tags">
          <div class="mini-tag peak">
            <i class="fa-solid fa-arrow-trend-up"></i>
            <span>峰值 {{ (selected.maxLevel ?? selected.maxHeight ?? 0).toFixed(1) }}m</span>
          </div>
          <div class="mini-tag warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>警戒 {{ (selected.warningLevel || 0).toFixed(1) }}m</span>
          </div>
          <div class="mini-tag surge" v-if="selected.isTide && selected.surgeHeight">
            <i class="fa-solid fa-wave-square"></i>
            <span>增水 +{{ selected.surgeHeight.toFixed(2) }}m</span>
          </div>
          <div class="mini-tag direction" v-if="!selected.isTide && selected.direction">
            <i class="fa-solid fa-compass"></i>
            <span>波向 {{ selected.direction }}</span>
          </div>
        </div>
      </div>
      <div class="center-empty" v-else>
        <i class="fa-solid fa-chart-area"></i>
        <span>请在左侧选择站点查看详细数据</span>
      </div>
    </section>

    <!-- ===== 右栏：设备与数据 ===== -->
    <section class="dock-right">
      <div class="dock-title"><i class="fa-solid fa-chart-pie"></i> 设备与数据</div>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">全域在线率</span>
          <span class="value online">{{ onlineRate }}%</span>
        </div>
        <div class="summary-item">
          <span class="label">站点总数</span>
          <span class="value">{{ store.devices.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">异常设备</span>
          <span class="value warn">{{ store.alertDevices.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">24H告警频次</span>
          <span class="value">{{ warningCount24h }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useAppStore } from '../../stores/app'
import { mockTideForecastStations, mockWaveForecastStations } from '../../data/seaConditionData'

const store = useAppStore()

// ===== 预警级别排序 =====
const severityOrder = { red: 0, orange: 1, yellow: 2, blue: 3 }

// ===== 合并潮位 + 浪高站点，标记类型 =====
const allStations = computed(() => {
  const tideStations = mockTideForecastStations.map(s => ({ ...s, isTide: true }))
  const waveStations = mockWaveForecastStations.map(s => ({ ...s, isTide: false }))
  return [...tideStations, ...waveStations].sort((a, b) => {
    const levelDiff = (severityOrder[a.warningColor] ?? 99) - (severityOrder[b.warningColor] ?? 99)
    if (levelDiff !== 0) return levelDiff
    return (b.currentHeight ?? b.currentLevel ?? 0) - (a.currentHeight ?? a.currentLevel ?? 0)
  })
})

const selected = ref(allStations.value[0] || null)

function selectStation(station) {
  selected.value = station
}

// ===== 辅助函数 =====
function getWarningText(color) {
  const map = { red: '红色预警', orange: '橙色预警', yellow: '黄色预警', blue: '蓝色预警' }
  return map[color] || '关注'
}

function overWarning(station) {
  const current = station.currentLevel ?? station.currentHeight ?? 0
  const warning = station.warningLevel ?? 0
  const diff = current - warning
  if (diff > 0) return `+${diff.toFixed(2)}m`
  return null
}

// ===== 右栏统计 =====
const onlineRate = computed(() => {
  if (!store.devices.length) return 0
  return Math.round((store.onlineDevices.length / store.devices.length) * 100)
})

const warningCount24h = computed(() => allStations.value.filter(s => s.forecastWarning || s.observedWarning).length)

// ===== ECharts =====
const chartRef = ref(null)
let chartInstance = null

function renderChart() {
  if (!chartRef.value || !selected.value) return

  const station = selected.value
  const data = station.trendData
  if (!data || !data.length) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const isTide = station.isTide
  const warningLevel = station.warningLevel || 0
  const surgeHeight = station.surgeHeight || 0

  // 时间标签
  const hours = data.map((_, i) => `${String(i).padStart(2, '0')}:00`)

  // 拆分观测 / 预测
  const obsData = hours.map((_, i) => i <= 14 ? data[i] : null)
  const predData = hours.map((_, i) => i >= 14 ? data[i] : null)

  // 增水（模拟）
  const surgeData = hours.map((_, i) => {
    if (i < 10 || i > 20) return null
    const peak = 15
    const dist = Math.abs(i - peak)
    return dist <= 5 ? +(surgeHeight * (1 - dist / 6)).toFixed(2) : null
  })

  // 四色警戒线阈值
  const wl = {
    blue: +(warningLevel * 0.7).toFixed(1),
    yellow: +(warningLevel * 0.85).toFixed(1),
    orange: warningLevel,
    red: +(warningLevel * 1.15).toFixed(1)
  }

  const series = [
    // 四色警戒线
    {
      name: '红色警戒', type: 'line',
      data: hours.map(() => wl.red),
      lineStyle: { color: 'rgba(220, 38, 38, 0.5)', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '橙色警戒', type: 'line',
      data: hours.map(() => wl.orange),
      lineStyle: { color: 'rgba(217, 151, 58, 0.5)', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '黄色警戒', type: 'line',
      data: hours.map(() => wl.yellow),
      lineStyle: { color: 'rgba(202, 168, 87, 0.5)', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '蓝色警戒', type: 'line',
      data: hours.map(() => wl.blue),
      lineStyle: { color: 'rgba(90, 145, 216, 0.5)', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    // 增水柱状图
    {
      name: '风暴潮增水', type: 'bar',
      data: surgeData, barWidth: 6,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(217, 151, 58, 0.58)' },
          { offset: 1, color: 'rgba(217, 151, 58, 0.12)' }
        ]),
        borderRadius: [2, 2, 0, 0]
      },
      yAxisIndex: 1, z: 2
    },
    // 观测曲线
    {
      name: isTide ? '总潮位(观测)' : '浪高(观测)', type: 'line',
      data: obsData,
      lineStyle: { color: '#53b07e', width: 2 },
      symbol: 'circle', symbolSize: 4,
      itemStyle: { color: '#53b07e' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(83, 176, 126, 0.2)' },
          { offset: 1, color: 'rgba(83, 176, 126, 0.02)' }
        ])
      },
      z: 4
    },
    // 预测曲线
    {
      name: isTide ? '总潮位(预测)' : '浪高(预测)', type: 'line',
      data: predData,
      lineStyle: { color: '#5a91d8', width: 2, type: 'dashed' },
      symbol: 'circle', symbolSize: 4,
      itemStyle: { color: '#5a91d8' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(90, 145, 216, 0.14)' },
          { offset: 1, color: 'rgba(90, 145, 216, 0.02)' }
        ])
      },
      z: 3
    }
  ]

  const obsLabel = isTide ? '总潮位(观测)' : '浪高(观测)'
  const predLabel = isTide ? '总潮位(预测)' : '浪高(预测)'
  const legendAlias = {
    [obsLabel]: '观测',
    [predLabel]: '预测',
    '风暴潮增水': '增水'
  }

  const option = {
    grid: { left: 54, right: 54, top: 42, bottom: 24 },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: 'rgba(14, 116, 144, 0.15)' } },
      axisLabel: {
        color: 'rgba(26, 58, 92, 0.5)', fontSize: 12,
        interval: 5, formatter: v => v.slice(0, 2) + 'h'
      },
      splitLine: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: isTide ? '潮位(m)' : '浪高(m)',
        nameTextStyle: { color: 'rgba(26, 58, 92, 0.45)', fontSize: 12 },
        nameLocation: 'middle', nameGap: 40,
        min: val => Math.floor(val.min * 10) / 10,
        axisLine: { show: false },
        axisLabel: { color: 'rgba(26, 58, 92, 0.5)', fontSize: 12, margin: 10, formatter: '{value}' },
        splitLine: { lineStyle: { color: 'rgba(14, 116, 144, 0.08)' } }
      },
      {
        type: 'value',
        name: '增水(m)',
        nameTextStyle: { color: 'rgba(217, 151, 58, 0.7)', fontSize: 12 },
        nameLocation: 'middle', nameGap: 36,
        min: 0,
        max: Math.max(surgeHeight * 2, 1),
        axisLine: { show: false },
        axisLabel: { color: 'rgba(217, 151, 58, 0.7)', fontSize: 12, margin: 8, formatter: '{value}' },
        splitLine: { show: false }
      }
    ],
    series,
    legend: {
      data: [obsLabel, predLabel, '风暴潮增水'],
      type: 'plain', top: 4, left: 'center', right: 'auto',
      itemGap: 14,
      formatter: name => legendAlias[name] || name,
      textStyle: { color: 'rgba(26, 58, 92, 0.55)', fontSize: 12 },
      itemWidth: 10, itemHeight: 6
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(14, 116, 144, 0.15)',
      textStyle: { color: '#3d6a8e', fontSize: 12 },
      formatter: params => {
        const time = params[0].axisValue
        let html = `<div style="font-weight:600;margin-bottom:4px">${time}</div>`
        params.forEach(p => {
          if (!p.seriesName.includes('警戒') && p.value !== undefined && p.value !== null) {
            html += `<div>${p.marker} ${p.seriesName}: <strong>${p.value}m</strong></div>`
          }
        })
        return html
      }
    }
  }

  chartInstance.setOption(option, true)
}

// watch + lifecycle
watch(selected, () => {
  nextTick(() => renderChart())
})

onMounted(() => {
  nextTick(() => renderChart())
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

function handleResize() {
  chartInstance?.resize()
}
</script>

<style scoped>
/* ===== 根容器 ===== */
.data-dock {
  position: relative;
  width: 100%;
  min-height: var(--dock-height, 220px);
  z-index: 10;
  border-radius: 14px;
  border: 1px solid rgba(14, 116, 144, 0.18);
  background: rgba(225, 240, 252, 0.78);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  box-shadow: 0 8px 24px rgba(14, 116, 144, 0.08);
  padding: 10px;
  display: grid;
  grid-template-columns: var(--home-column-width, 420px) 1fr var(--home-column-width, 420px);
  gap: 10px;
  pointer-events: auto;
}

.dock-left,
.dock-center,
.dock-right {
  border-radius: 10px;
  border: 1px solid rgba(14, 116, 144, 0.12);
  background: rgba(220, 238, 248, 0.65);
  padding: 8px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dock-title {
  font-size: 13px;
  font-weight: 700;
  color: #0e7490;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dock-title i {
  font-size: 12px;
  opacity: 0.7;
}

/* ===== 左栏：站点列表 ===== */
.station-list {
  margin-top: 6px;
  flex: 1;
  max-height: 260px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 180, 240, 0.3) transparent;
}

.station-card {
  border-radius: 8px;
  border: 1px solid rgba(14, 116, 144, 0.1);
  background: rgba(220, 238, 248, 0.65);
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.station-card:hover {
  background: rgba(8, 145, 178, 0.06);
  border-color: rgba(8, 145, 178, 0.22);
}

.station-card.active {
  border-color: rgba(8, 145, 178, 0.45);
  background: rgba(8, 145, 178, 0.08);
  box-shadow: 0 0 0 1px rgba(8, 145, 178, 0.12);
}

.station-card.warning-red { border-left: 3px solid rgba(239, 68, 68, 0.7); }
.station-card.warning-orange { border-left: 3px solid rgba(249, 115, 22, 0.7); }
.station-card.warning-yellow { border-left: 3px solid rgba(234, 179, 8, 0.7); }
.station-card.warning-blue { border-left: 3px solid rgba(59, 130, 246, 0.7); }

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.station-name {
  font-size: 12px;
  font-weight: 700;
  color: #1a3a5c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.warning-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.warning-badge.red { color: #fecaca; background: rgba(220, 38, 38, 0.24); }
.warning-badge.orange { color: #fed7aa; background: rgba(249, 115, 22, 0.24); }
.warning-badge.yellow { color: #fef08a; background: rgba(234, 179, 8, 0.24); }
.warning-badge.blue { color: #bfdbfe; background: rgba(59, 130, 246, 0.24); }

.card-metrics {
  margin-top: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 8px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.metric-label {
  font-size: 10px;
  color: rgba(26, 58, 92, 0.55);
}

.metric-value {
  font-size: 11px;
  font-weight: 700;
  color: #1a3a5c;
}

.metric-value.peak {
  color: #fca5a5;
}

.metric-value.highlight {
  color: #fcd34d;
}

.card-footer {
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.dual-badge,
.obs-badge-sm,
.forecast-badge-sm {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 999px;
  border: 1px solid;
}

.dual-badge { color: #fecaca; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.35); }
.obs-badge-sm { color: #fed7aa; background: rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.35); }
.forecast-badge-sm { color: #bfdbfe; background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.35); }

.over-value {
  font-size: 10px;
  color: #fca5a5;
  font-weight: 600;
}

/* ===== 中栏：图表区 ===== */
.center-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.station-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(14, 116, 144, 0.12);
  flex-shrink: 0;
}

.info-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-left i {
  color: #0891b2;
  font-size: 12px;
}

.info-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a3a5c;
}

.info-metrics {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.info-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.info-label {
  font-size: 10px;
  color: rgba(26, 58, 92, 0.5);
}

.info-value {
  font-size: 12px;
  font-weight: 700;
  color: #1a3a5c;
}

.info-value.accent {
  color: #fca5a5;
}

.info-value.surge {
  color: #fcd34d;
}

.chart-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
}

.chart-container {
  width: 100%;
  height: 180px;
  min-height: 100px;
}

.chart-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
  flex-shrink: 0;
}

.mini-tag {
  font-size: 11px;
  border-radius: 999px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mini-tag.peak { color: #fca5a5; background: rgba(239, 68, 68, 0.15); }
.mini-tag.warning { color: #fcd34d; background: rgba(234, 179, 8, 0.15); }
.mini-tag.surge { color: #fed7aa; background: rgba(249, 115, 22, 0.15); }
.mini-tag.direction { color: #93c5fd; background: rgba(59, 130, 246, 0.15); }

.center-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(26, 58, 92, 0.5);
  font-size: 13px;
}

.center-empty i {
  font-size: 28px;
  opacity: 0.4;
}

/* ===== 右栏：设备与数据 ===== */
.summary-grid {
  margin-top: 8px;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-item {
  border-radius: 8px;
  border: 1px solid rgba(14, 116, 144, 0.1);
  background: rgba(220, 238, 248, 0.65);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-item .label {
  font-size: 11px;
  color: rgba(26, 58, 92, 0.55);
}

.summary-item .value {
  font-size: 20px;
  font-weight: 800;
  color: #1a3a5c;
}

.summary-item .value.online { color: #16a34a; }
.summary-item .value.warn { color: #ef4444; }

/* ===== 响应式 ===== */
@media (max-width: 1700px) {
  .data-dock {
    grid-template-columns: 360px 1fr 360px;
  }
}

@media (max-width: 1400px) {
  .data-dock {
    grid-template-columns: 300px 1fr 300px;
  }
  .card-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
