<template>
  <div class="ai-summary-panel">
    <!-- 综合研判（采用历史灾害匹配风格） -->
    <div class="section judgment-section" :class="{ collapsed: judgmentCollapsed }">
      <!-- 头部 -->
      <div class="judgment-header" @click="judgmentCollapsed = !judgmentCollapsed">
        <div class="header-top">
          <div class="header-left">
            <i class="fa-solid fa-brain"></i>
            <span class="title">综合研判</span>
          </div>
          <div class="header-right">
            <span class="data-meta">
              <i class="fa-solid fa-database"></i>
              {{ summaryData.meta.source }} · {{ formatTime(summaryData.meta.updateTime) }}
            </span>
            <button class="refresh-btn" @click.stop="handleRefresh" :class="{ spinning: isRefreshing }">
              <i class="fa-solid fa-rotate"></i>
            </button>
            <i class="fa-solid fa-chevron-down toggle-icon"></i>
          </div>
        </div>
        <div v-if="props.headerSummary" class="header-summary">{{ props.headerSummary }}</div>
      </div>
      
      <!-- 可折叠内容区 -->
      <div class="judgment-content-wrapper">
      
      <!-- 第一类：灾害因素卡片（台风影响+潮位+时间） -->
      <div class="factor-card">
        <div class="factor-header">
          <i class="fa-solid fa-hurricane"></i>
          <span class="factor-title">灾害因素</span>
          <span class="factor-subtitle">台风影响下的潮位预测</span>
        </div>
        <div class="factor-content">
          <!-- 台风信息 -->
          <div class="typhoon-row">
            <div class="typhoon-name">
              <span class="name">{{ summaryData.meta.typhoonName }}</span>
              <span class="code">编号 {{ summaryData.meta.typhoonCode }}</span>
            </div>
            <div class="typhoon-badge">台风</div>
          </div>
          
          <!-- 核心预测数据 -->
          <div class="prediction-grid">
            <div class="pred-item station">
              <i class="fa-solid fa-location-dot"></i>
              <div class="pred-info">
                <span class="pred-label">监测站点</span>
                <span class="pred-value">{{ currentStationData?.name }}</span>
              </div>
            </div>
            <div class="pred-item time">
              <i class="fa-solid fa-clock"></i>
              <div class="pred-info">
                <span class="pred-label">达峰时间</span>
                <span class="pred-value">今日 {{ currentPeakInfo?.time }}</span>
              </div>
            </div>
            <div class="pred-item tide" :class="{ danger: currentPeakInfo?.overWarning > 0.5 }">
              <i class="fa-solid fa-water"></i>
              <div class="pred-info">
                <span class="pred-label">峰值潮位</span>
                <span class="pred-value large">{{ currentPeakInfo?.value }}m</span>
              </div>
              <div class="pred-extra">
                超警戒 <strong>+{{ currentPeakInfo?.overWarning }}m</strong>
              </div>
            </div>
          </div>
          
          <!-- 影响区域 -->
          <div class="affected-areas">
            <span class="areas-label">影响区域</span>
            <div class="areas-list">
              <span v-for="district in currentAffectedDistricts" :key="district" class="area-tag">
                <i class="fa-solid fa-map-marker-alt"></i>
                {{ district }}
              </span>
            </div>
          </div>
          
          <!-- 历史相似台风参考（可展开） -->
          <div class="history-reference" :class="{ expanded: historyExpanded }">
            <div class="history-ref-header" @click="historyExpanded = !historyExpanded">
              <div class="header-left">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>历史相似台风</span>
              </div>
              <div class="header-right">
                <span class="similarity-badge">
                  相似度 {{ (summaryData.historicalComparison.similarity * 100).toFixed(0) }}%
                </span>
                <i class="fa-solid fa-chevron-down expand-icon"></i>
              </div>
            </div>
            
            <!-- 摘要信息（始终显示） -->
            <div class="history-ref-summary">
              <div class="ref-name">{{ summaryData.historicalComparison.matchName }}</div>
              <div class="ref-factors">
                <span v-for="(value, key) in summaryData.historicalComparison.matchFactors" :key="key" class="factor-tag">
                  {{ value }}
                </span>
              </div>
              <div class="ref-impacts">
                <div class="impact-item">
                  <span class="impact-value">{{ summaryData.historicalComparison.historicalImpact.economicLoss }}</span>
                  <span class="impact-label">亿元损失</span>
                </div>
                <div class="impact-item">
                  <span class="impact-value">{{ formatNumber(summaryData.historicalComparison.historicalImpact.affectedPopulation) }}</span>
                  <span class="impact-label">受灾人口</span>
                </div>
                <div class="impact-item">
                  <span class="impact-value">{{ summaryData.historicalComparison.historicalImpact.floodArea }}</span>
                  <span class="impact-label">km²淹没</span>
                </div>
              </div>
            </div>
            
            <!-- 展开的详细内容 -->
            <Transition name="slide">
              <div v-if="historyExpanded" class="history-expanded-content">
                <!-- 当前台风与历史对比提示 -->
                <div class="compare-hint">
                  <i class="fa-solid fa-circle-info"></i>
                  {{ summaryData.historicalComparison.comparisonNote }}
                </div>
                
                <!-- 更多相似台风列表 -->
                <div class="more-matches-header">
                  <span>其他相似历史台风</span>
                </div>
                
                <div class="historical-list">
                  <div 
                    v-for="(match, idx) in historicalMatches" 
                    :key="match.id"
                    class="match-card"
                    :class="{ 'high-match': match.similarity >= 0.9, 'card-expanded': expandedCards.includes(idx) }"
                  >
                    <!-- 标题栏 -->
                    <div class="match-header" @click="toggleCard(idx)">
                      <div class="match-title">
                        <span class="match-rank">{{ idx + 1 }}</span>
                        <span class="match-name">{{ match.year }} 台风"{{ match.name }}"</span>
                        <span class="similarity-tag" :class="getSimilarityClass(match.similarity)">
                          {{ (match.similarity * 100).toFixed(0) }}%
                        </span>
                      </div>
                      <i class="fa-solid fa-chevron-down toggle-icon" :class="{ rotated: expandedCards.includes(idx) }"></i>
                    </div>

                    <!-- 基本信息（始终显示） -->
                    <div class="match-brief">
                      <div class="brief-item">
                        <i class="fa-solid fa-location-dot"></i>
                        {{ match.landingLocation }}
                      </div>
                      <div class="brief-item">
                        <i class="fa-solid fa-wind"></i>
                        {{ match.maxWindSpeed }}m/s
                      </div>
                      <div class="brief-item loss">
                        <i class="fa-solid fa-sack-dollar"></i>
                        {{ match.economicLoss }}亿
                      </div>
                    </div>

                    <!-- 详细信息（可展开） -->
                    <Transition name="slide">
                      <div v-if="expandedCards.includes(idx)" class="match-details">
                        <!-- 影响区域 -->
                        <div class="detail-section">
                          <div class="section-label">
                            <i class="fa-solid fa-map-marked-alt"></i>
                            影响区域
                          </div>
                          <div class="area-tags">
                            <span v-for="area in match.affectedAreas" :key="area" class="area-tag">
                              {{ area }}
                            </span>
                          </div>
                        </div>

                        <!-- 伤亡与详情 -->
                        <div class="detail-section">
                          <div class="section-label">
                            <i class="fa-solid fa-chart-line"></i>
                            灾害详情
                          </div>
                          <div class="disaster-stats">
                            <div class="stat-row">
                              <span class="stat-name">死亡/失踪</span>
                              <span class="stat-value warn">{{ match.casualties.deaths }}/{{ match.casualties.missing }}人</span>
                            </div>
                            <div class="stat-row">
                              <span class="stat-name">最大风暴增水</span>
                              <span class="stat-value">{{ match.details.maxStormSurge }}m</span>
                            </div>
                            <div class="stat-row">
                              <span class="stat-name">最大浪高</span>
                              <span class="stat-value">{{ match.details.maxWaveHeight }}m</span>
                            </div>
                            <div class="stat-row">
                              <span class="stat-name">转移人口</span>
                              <span class="stat-value">{{ formatNumber(match.details.evacuation) }}人</span>
                            </div>
                          </div>
                        </div>

                        <div class="landing-time">
                          <i class="fa-solid fa-clock"></i>
                          登陆时间：{{ match.landingTime }}
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
      
      <!-- 风险高亮（可展开查看详情） -->
      <div class="risk-highlight-card" :class="{ expanded: riskExpanded }">
        <div class="risk-hl-header" @click="riskExpanded = !riskExpanded">
          <div class="header-left">
            <div class="risk-icon-wrap" :class="[riskLevelClass, { 'risk-pulse-active': riskPulseActive }]">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="header-text">
              <span class="title">风险评估</span>
              <span class="level-badge" :class="riskLevelClass">{{ summaryData.summary.riskLevel }}</span>
            </div>
          </div>
          <div class="header-right">
            <span class="hotspot-count">{{ summaryData.riskHotspots.length }}处热点</span>
            <i class="fa-solid fa-chevron-down expand-icon"></i>
          </div>
        </div>
        
        <!-- 摘要信息（始终显示） -->
        <div class="risk-hl-summary">
          <p class="risk-desc">{{ summaryData.summary.riskHighlight }}</p>
          <div class="risk-types">
            <span v-for="(type, idx) in uniqueRiskTypes" :key="idx" class="risk-type-tag">
              <i class="fa-solid fa-exclamation-circle"></i>
              {{ type }}
            </span>
          </div>
        </div>
        
        <!-- 展开的风险热点列表 -->
        <Transition name="slide">
          <div v-if="riskExpanded" class="risk-hotspots-expanded">
            <div class="hotspots-header">
              <i class="fa-solid fa-crosshairs"></i>
              <span>风险详情</span>
            </div>
            
            <div class="hotspot-list">
              <div 
                v-for="risk in summaryData.riskHotspots" 
                :key="risk.id"
                class="hotspot-item"
                :class="[risk.level, { 'item-expanded': expandedHotspots.includes(risk.id) }]"
              >
                <!-- 热点头部（可展开） -->
                <div class="hotspot-header" @click.stop="toggleHotspot(risk.id)">
                  <div class="hotspot-rank" :class="risk.level">{{ risk.rank }}</div>
                  <div class="hotspot-info">
                    <span class="hotspot-name">{{ risk.name }}</span>
                    <span class="hotspot-type">{{ risk.riskType }}</span>
                  </div>
                  <div class="hotspot-status">
                    <span class="over-design" v-if="risk.overDesign > 0">超设计+{{ risk.overDesign }}m</span>
                    <span class="over-design normal" v-else>设计内</span>
                  </div>
                  <i class="fa-solid fa-chevron-down toggle-icon" :class="{ rotated: expandedHotspots.includes(risk.id) }"></i>
                </div>
                
                <!-- 热点详情（可展开） -->
                <Transition name="slide">
                  <div v-if="expandedHotspots.includes(risk.id)" class="hotspot-details">
                    <!-- 关联站点 -->
                    <div class="detail-row">
                      <i class="fa-solid fa-link"></i>
                      <span>{{ risk.relatedStation.name }}</span>
                      <span class="station-peak">峰值{{ risk.relatedStation.peakLevel }}m @ {{ risk.relatedStation.peakTime }}</span>
                    </div>
                    
                    <!-- 漫滩模拟 -->
                    <div class="flood-tags">
                      <span class="flood-tag">
                        <i class="fa-solid fa-water"></i>
                        淹没{{ risk.floodSimulation.floodArea }}km²
                      </span>
                      <span class="flood-tag">
                        <i class="fa-solid fa-ruler-vertical"></i>
                        深{{ risk.floodSimulation.maxDepth }}m
                      </span>
                      <span class="flood-tag">
                        <i class="fa-solid fa-hourglass-half"></i>
                        {{ risk.floodSimulation.duration }}h
                      </span>
                      <span class="flood-tag people">
                        <i class="fa-solid fa-users"></i>
                        {{ formatNumber(risk.floodSimulation.affectedPopulation) }}人
                      </span>
                    </div>
                    
                    <!-- 区域和时间 -->
                    <div class="location-time">
                      <div class="districts">
                        <span v-for="district in risk.districts" :key="district" class="district-tag">
                          <i class="fa-solid fa-location-dot"></i>
                          {{ district }}
                        </span>
                      </div>
                      <span class="time-range">
                        <i class="fa-solid fa-clock"></i>
                        {{ risk.riskTimeRange.start }} - {{ risk.riskTimeRange.end }}
                      </span>
                    </div>
                    
                    <!-- 定位按钮 -->
                    <button class="locate-btn" @click.stop="handleRiskClick(risk)">
                      <i class="fa-solid fa-location-crosshairs"></i>
                      定位查看
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </Transition>
      </div>
      
      <!-- 态势描述 -->
      <div class="situation-desc">
        <div class="desc-label">
          <i class="fa-solid fa-circle-info"></i>
          态势描述
        </div>
        <p>{{ summaryData.summary.situationSummary }}</p>
        <p class="impact-text">{{ summaryData.summary.impactAreas }}</p>
      </div>
      
      <!-- AI标识 -->
      <div class="ai-badge">
        <i class="fa-solid fa-sparkles"></i>
        AI 基于多源数据综合生成
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { mockAISummaryData, formatUpdateTime } from '../../data/aiSummaryData'
import { mockHistoricalMatches } from '../../data/mockData'

const emit = defineEmits(['risk-click', 'refresh'])
const props = defineProps({
  headerSummary: {
    type: String,
    default: ''
  }
})

// 数据
const summaryData = ref(mockAISummaryData)
const isRefreshing = ref(false)
const historyExpanded = ref(false)  // 默认收起
const selectedStation = ref('zhuhai')
const chartContainer = ref(null)
let chartInstance = null

// 折叠状态
const judgmentCollapsed = ref(false)

// 风险热点展开状态
// riskExpanded: 控制风险列表是否展开（有风险时默认展开）
// expandedHotspots: 控制每个热点的详细内容是否展开（默认收起）
const hasRisk = computed(() => summaryData.value.riskHotspots.length > 0)
const riskExpanded = ref(true) // 风险列表默认展开
const expandedHotspots = ref([]) // 每个热点的详细内容默认收起

function toggleHotspot(id) {
  const index = expandedHotspots.value.indexOf(id)
  if (index > -1) {
    expandedHotspots.value.splice(index, 1)
  } else {
    expandedHotspots.value.push(id)
  }
}

// 历史台风匹配
const historicalMatches = computed(() => mockHistoricalMatches.matches)
const expandedCards = ref([])

function toggleCard(idx) {
  const index = expandedCards.value.indexOf(idx)
  if (index > -1) {
    expandedCards.value.splice(index, 1)
  } else {
    expandedCards.value.push(idx)
  }
}

function getSimilarityClass(similarity) {
  if (similarity >= 0.9) return 'very-high'
  if (similarity >= 0.8) return 'high'
  return 'medium'
}

// 当前选中站点的数据
const currentStationData = computed(() => {
  const station = summaryData.value.tideAnalysis.stations.find(s => s.id === selectedStation.value)
  return station
})

const currentTideData = computed(() => {
  return summaryData.value.tideAnalysis.stationData[selectedStation.value]
})

const currentPeakInfo = computed(() => {
  return currentTideData.value?.peakInfo
})

const currentAffectedDistricts = computed(() => {
  return currentTideData.value?.affectedDistricts
})

// 风险等级计算
const riskLevelClass = computed(() => {
  const count = summaryData.value.riskHotspots.length
  if (count >= 3) return 'level-high'
  if (count >= 2) return 'level-medium'
  return 'level-low'
})
const riskPulseActive = ref(false)
let riskPulseTimer = null

function clearRiskPulseTimer() {
  if (riskPulseTimer) {
    clearTimeout(riskPulseTimer)
    riskPulseTimer = null
  }
}

function triggerRiskPulse() {
  clearRiskPulseTimer()
  riskPulseActive.value = false
  requestAnimationFrame(() => {
    riskPulseActive.value = true
  })
  riskPulseTimer = setTimeout(() => {
    riskPulseActive.value = false
    riskPulseTimer = null
  }, 6200)
}

const riskLevelText = computed(() => {
  const count = summaryData.value.riskHotspots.length
  if (count >= 3) return '高风险'
  if (count >= 2) return '中风险'
  return '低风险'
})

// 获取唯一的风险类型
const uniqueRiskTypes = computed(() => {
  const types = summaryData.value.riskHotspots.map(r => r.riskType)
  return [...new Set(types)]
})

// 格式化时间
function formatTime(isoString) {
  return formatUpdateTime(isoString)
}

// 格式化数字
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 刷新数据
async function handleRefresh() {
  isRefreshing.value = true
  emit('refresh')
  
  // 模拟刷新
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 更新时间戳
  summaryData.value.meta.updateTime = new Date().toISOString()
  summaryData.value.meta.generatedAt = new Date().toISOString()
  
  isRefreshing.value = false
}

// 点击风险区域
function handleRiskClick(risk) {
  emit('risk-click', risk)
  console.log('定位到风险区域:', risk.name, risk.lat, risk.lng)
}

// 初始化ECharts图表
function initChart() {
  if (!chartContainer.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartContainer.value)
  updateChart()
}

// 更新图表
function updateChart() {
  if (!chartInstance || !currentTideData.value) return
  
  const data = currentTideData.value
  const station = currentStationData.value
  
  // 合并观测和预测数据的时间轴
  const observationTimes = data.observation.map(d => d.time)
  const predictionTimes = data.prediction.map(d => d.time)
  const allTimes = [...new Set([...observationTimes, ...predictionTimes])]
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      top: 30,
      right: 15,
      bottom: 25,
      left: 45
    },
    xAxis: {
      type: 'category',
      data: allTimes,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 2,
      max: 5,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, formatter: '{value}m' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
    },
    series: [
      // 警戒线
      {
        name: '警戒线',
        type: 'line',
        data: allTimes.map(() => station?.warningLevel || 3.5),
        lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
        symbol: 'none',
        z: 1
      },
      // 观测曲线
      {
        name: '观测值',
        type: 'line',
        data: allTimes.map(t => {
          const point = data.observation.find(d => d.time === t)
          return point ? point.value : null
        }),
        lineStyle: { color: '#10b981', width: 2.5 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ])
        },
        z: 3
      },
      // 预测曲线
      {
        name: '预测值',
        type: 'line',
        data: allTimes.map(t => {
          const point = data.prediction.find(d => d.time === t)
          return point ? point.value : null
        }),
        lineStyle: { color: '#8b5cf6', width: 2, type: 'dashed' },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.2)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
          ])
        },
        z: 2
      }
    ],
    legend: {
      data: ['观测值', '预测值', '警戒线'],
      top: 0,
      textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
      itemWidth: 15,
      itemHeight: 8
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 30, 50, 0.9)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: function(params) {
        let result = `<div style="font-weight:600;margin-bottom:4px">${params[0].name}</div>`
        params.forEach(p => {
          if (p.value !== null && p.value !== undefined) {
            result += `<div>${p.marker} ${p.seriesName}: ${p.value}m</div>`
          }
        })
        return result
      }
    }
  }
  
  chartInstance.setOption(option)
}

// 监听站点变化
watch(selectedStation, () => {
  nextTick(() => updateChart())
})

watch(riskLevelClass, (next, prev) => {
  if (next === 'level-high' && prev !== 'level-high') {
    triggerRiskPulse()
  }
  if (next !== 'level-high') {
    riskPulseActive.value = false
    clearRiskPulseTimer()
  }
})

// 挂载后初始化图表
onMounted(() => {
  nextTick(() => initChart())
})

onUnmounted(() => {
  clearRiskPulseTimer()
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.ai-summary-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 通用区块样式 */
.section {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: 10px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.section-header:hover {
  background: var(--bg-hover);
}

.risk-section.collapsed .section-header {
  border-bottom: none;
}

/* TOP风险热点折叠控制 */
.risk-section.collapsed .risk-list {
  max-height: 0;
  padding: 0;
  overflow: hidden;
}

.section-header i:first-child {
  color: #06b6d4;
}

.toggle-icon {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* AI研判区块 - 科技感设计 */
.judgment-section {
  background: linear-gradient(180deg, 
    rgba(6, 182, 212, 0.08) 0%, 
    rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

/* 顶部发光线条 */
.judgment-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    #06b6d4 20%, 
    #8b5cf6 50%, 
    #06b6d4 80%, 
    transparent);
}

.level-badge {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.level-badge.orange { background: rgba(249, 115, 22, 0.2); color: #f97316; }
.level-badge.red { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.level-badge.yellow { background: rgba(234, 179, 8, 0.2); color: #eab308; }
.level-badge.blue { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

/* 综合研判头部 */
.judgment-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.judgment-header:hover {
  background: rgba(6, 182, 212, 0.05);
}

/* 折叠图标 */
.judgment-header .toggle-icon,
.section-header .toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.2s;
  margin-left: 4px;
}

.judgment-section.collapsed .toggle-icon,
.risk-section.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

/* 综合研判可折叠内容区 */
.judgment-content-wrapper {
  max-height: 2000px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.judgment-section.collapsed .judgment-content-wrapper {
  max-height: 0;
}

.judgment-section.collapsed .judgment-header {
  border-bottom: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.header-left i { color: #06b6d4; font-size: 16px; margin-top: 1px; }
.header-left .title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.header-summary {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.08);
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.data-meta {
  font-size: 10px;
  color: var(--text-muted);
}

.data-meta i {
  margin-right: 4px;
  opacity: 0.7;
}

.refresh-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(6, 182, 212, 0.15);
  border-radius: 6px;
  color: #06b6d4;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover { background: rgba(6, 182, 212, 0.25); }
.refresh-btn.spinning i { animation: spin 1s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 核心指标标签区 - 科技网格设计 */
.key-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(6, 182, 212, 0.05));
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.metric-tag {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  transition: all 0.2s;
}

.metric-tag:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
  transform: translateY(-1px);
}

.metric-tag .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-tag i { 
  font-size: 16px; 
  color: #06b6d4;
  opacity: 0.8;
}

.metric-tag .label { 
  font-size: 10px; 
  color: var(--text-muted); 
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-tag .value { 
  font-size: 18px; 
  font-weight: 700; 
  color: var(--text-primary);
  text-align: right;
}

.metric-tag .sub { 
  font-size: 10px; 
  color: var(--text-muted); 
  text-align: right;
}

/* 不同类型的颜色主题 */
.metric-tag.typhoon { border-color: rgba(249, 115, 22, 0.3); }
.metric-tag.typhoon i { color: #f97316; }
.metric-tag.typhoon .value { color: #fb923c; }

.metric-tag.tide { border-color: rgba(59, 130, 246, 0.3); }
.metric-tag.tide i { color: #3b82f6; }
.metric-tag.tide .value { color: #60a5fa; }
.metric-tag.tide.danger { 
  border-color: rgba(239, 68, 68, 0.4); 
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
}
.metric-tag.tide.danger i, .metric-tag.tide.danger .value { color: #f87171; }

.metric-tag.time { border-color: rgba(139, 92, 246, 0.3); }
.metric-tag.time i { color: #8b5cf6; }
.metric-tag.time .value { color: #a78bfa; }

.metric-tag.risk { border-color: rgba(234, 179, 8, 0.3); }
.metric-tag.risk i { color: #eab308; }
.metric-tag.risk .value { color: #facc15; }
.metric-tag.risk.danger { 
  border-color: rgba(239, 68, 68, 0.4); 
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
}
.metric-tag.risk.danger i, .metric-tag.risk.danger .value { color: #f87171; }

/* 态势研判正文 */
.judgment-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-block {
  padding: 12px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.block-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 10px;
}

.content-block.cause .block-label { 
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.1)); 
  color: #fb923c; 
}
.content-block.impact .block-label { 
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1)); 
  color: #60a5fa; 
}
.content-block.risk-highlight .block-label { 
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1)); 
  color: #f87171; 
}

.content-block p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 影响区域标签 */
.area-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.area-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: #60a5fa;
}

.area-tag i { font-size: 10px; }

.impact-desc {
  font-size: 11px !important;
  color: var(--text-muted) !important;
}

/* AI标识 */
.ai-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: rgba(139, 92, 246, 0.08);
  font-size: 10px;
  color: #8b5cf6;
}

/* ========== 第一类：灾害因素卡片 ========== */
.factor-card {
  margin: 12px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.04));
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 10px;
  overflow: hidden;
}

.factor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(249, 115, 22, 0.1);
  border-bottom: 1px solid rgba(249, 115, 22, 0.2);
}

.factor-header i {
  color: #f97316;
  font-size: 16px;
}

.factor-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.factor-subtitle {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: auto;
}

.factor-content {
  padding: 12px;
}

/* 台风信息行 */
.typhoon-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.typhoon-name .name {
  font-size: 18px;
  font-weight: 700;
  color: #fb923c;
}

.typhoon-name .code {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 8px;
}

.typhoon-badge {
  padding: 4px 10px;
  background: rgba(249, 115, 22, 0.2);
  border: 1px solid rgba(249, 115, 22, 0.4);
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  color: #f97316;
}

/* 核心预测数据网格 */
.prediction-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.pred-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pred-item.tide {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.03));
  border-color: rgba(59, 130, 246, 0.3);
}

.pred-item.tide.danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border-color: rgba(239, 68, 68, 0.4);
}

.pred-item i {
  font-size: 14px;
  color: #8b5cf6;
  margin-top: 2px;
}

.pred-item.station i { color: #10b981; }
.pred-item.time i { color: #8b5cf6; }
.pred-item.tide i { color: #3b82f6; }
.pred-item.tide.danger i { color: #ef4444; }

.pred-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.pred-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pred-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.pred-value.large {
  font-size: 20px;
  font-weight: 700;
  color: #60a5fa;
}

.pred-item.tide.danger .pred-value.large {
  color: #f87171;
}

.pred-extra {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: auto;
  text-align: right;
}

.pred-extra strong {
  color: #ef4444;
  font-weight: 600;
}

/* 影响区域 */
.affected-areas {
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.areas-label {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.areas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.areas-list .area-tag {
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 12px;
  font-size: 10px;
  color: #60a5fa;
}

.areas-list .area-tag i {
  font-size: 10px;
  margin-right: 4px;
}

/* 历史相似台风参考 */
.history-reference {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(234, 179, 8, 0.3);
}

.history-ref-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(234, 179, 8, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-ref-header:hover {
  background: rgba(234, 179, 8, 0.15);
}

.history-ref-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-ref-header .header-left i {
  color: #eab308;
  font-size: 12px;
}

.history-ref-header .header-left span {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.history-ref-header .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-ref-header .similarity-badge {
  padding: 3px 8px;
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.history-ref-header .expand-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.3s;
}

.history-reference.expanded .history-ref-header .expand-icon {
  transform: rotate(180deg);
}

/* 摘要信息 */
.history-ref-summary {
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.2);
  border-radius: 8px;
  padding: 10px;
  margin-top: 8px;
}

.ref-name {
  font-size: 13px;
  font-weight: 600;
  color: #facc15;
  margin-bottom: 8px;
}

.ref-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.ref-factors .factor-tag {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-secondary);
}

.ref-impacts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.ref-impacts .impact-item {
  text-align: center;
  padding: 6px 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.ref-impacts .impact-value {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #eab308;
}

.ref-impacts .impact-label {
  font-size: 10px;
  color: var(--text-muted);
}

/* 展开区域 */
.history-expanded-content {
  margin-top: 10px;
}

.compare-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(59, 130, 246, 0.08);
  border-left: 2px solid #3b82f6;
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 10px;
}

.compare-hint i {
  color: #3b82f6;
  margin-top: 1px;
  flex-shrink: 0;
}

.more-matches-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* 历史台风列表 */
.historical-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.match-card {
  background: rgba(30, 40, 60, 0.4);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.match-card.high-match {
  border-color: rgba(234, 179, 8, 0.5);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(234, 179, 8, 0.02));
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.match-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.match-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.match-rank {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.match-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.similarity-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
  margin-left: auto;
}

.similarity-tag.very-high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.similarity-tag.high {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.similarity-tag.medium {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.match-card .toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.3s;
  margin-left: 6px;
}

.match-card .toggle-icon.rotated {
  transform: rotate(180deg);
}

/* 基本信息 */
.match-brief {
  display: flex;
  gap: 8px;
  padding: 0 10px 8px 10px;
}

.brief-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--text-secondary);
}

.brief-item i {
  color: #eab308;
  width: 10px;
  font-size: 10px;
}

.brief-item.loss {
  margin-left: auto;
  color: #f97316;
  font-weight: 600;
}

/* 详细信息 */
.match-details {
  padding: 8px 10px;
  border-top: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
}

.detail-section {
  margin-bottom: 8px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.section-label i {
  color: #eab308;
  width: 10px;
  font-size: 10px;
}

/* 灾害详情 */
.disaster-stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 6px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  font-size: 10px;
}

.stat-name {
  color: var(--text-muted);
}

.stat-value {
  color: var(--text-primary);
  font-weight: 600;
}

.stat-value.warn {
  color: #ef4444;
}

/* 登陆时间 */
.landing-time {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--border-subtle);
}

.landing-time i {
  color: #3b82f6;
  font-size: 10px;
}

/* 展开/折叠动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 800px;
}

/* ========== 风险评估卡片（可展开） ========== */
.risk-highlight-card {
  margin: 0 12px 12px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.03));
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;
}

.risk-hl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: background 0.2s;
}

.risk-hl-header:hover {
  background: rgba(0, 0, 0, 0.25);
}

.risk-hl-header .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.risk-hl-header .header-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-hl-header .title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.risk-hl-header .level-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.risk-hl-header .level-badge.level-low {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.risk-hl-header .level-badge.level-medium {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.risk-hl-header .level-badge.level-high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.risk-hl-header .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-hl-header .hotspot-count {
  font-size: 10px;
  color: #ef4444;
  font-weight: 600;
}

.risk-hl-header .expand-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.3s;
}

.risk-highlight-card.expanded .risk-hl-header .expand-icon {
  transform: rotate(180deg);
}

.risk-icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.risk-icon-wrap.level-low {
  background: rgba(34, 197, 94, 0.2);
}

.risk-icon-wrap.level-medium {
  background: rgba(234, 179, 8, 0.2);
}

.risk-icon-wrap.level-high {
  background: rgba(239, 68, 68, 0.25);
}

.risk-icon-wrap.level-high.risk-pulse-active {
  animation: pulse-risk 2s ease-in-out 3;
}

@keyframes pulse-risk {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.25);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    transform: scale(1.03);
  }
}

.risk-icon-wrap i {
  font-size: 16px;
}

.risk-icon-wrap.level-low i { color: #22c55e; }
.risk-icon-wrap.level-medium i { color: #eab308; }
.risk-icon-wrap.level-high i { color: #ef4444; }

/* 摘要区域 */
.risk-hl-summary {
  padding: 12px;
}

.risk-desc {
  margin: 0 0 10px 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.risk-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.risk-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  color: #f87171;
}

.risk-type-tag i {
  font-size: 10px;
}

/* 展开的热点区域 */
.risk-hotspots-expanded {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.15);
}

.hotspots-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 10px;
}

.hotspots-header i {
  font-size: 11px;
}

.hotspot-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hotspot-item {
  background: rgba(30, 40, 60, 0.4);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.hotspot-item.high {
  border-left: 3px solid #ef4444;
}

.hotspot-item.medium {
  border-left: 3px solid #f59e0b;
}

.hotspot-item.low {
  border-left: 3px solid #22c55e;
}

.hotspot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.hotspot-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.hotspot-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.hotspot-rank.high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.hotspot-rank.medium {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.hotspot-rank.low {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.hotspot-info {
  flex: 1;
  min-width: 0;
}

.hotspot-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hotspot-type {
  font-size: 10px;
  color: var(--text-muted);
}

.hotspot-status .over-design {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-weight: 600;
}

.hotspot-status .over-design.normal {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.hotspot-item .toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.3s;
}

.hotspot-item .toggle-icon.rotated {
  transform: rotate(180deg);
}

/* 热点详情 */
.hotspot-details {
  padding: 8px 10px;
  border-top: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.detail-row i {
  color: #3b82f6;
  width: 12px;
}

.detail-row .station-peak {
  margin-left: auto;
  color: #ef4444;
  font-weight: 600;
}

.flood-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.hotspot-details .flood-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
  font-size: 10px;
  color: #60a5fa;
}

.hotspot-details .flood-tag i {
  font-size: 10px;
}

.hotspot-details .flood-tag.people {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.location-time {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.location-time .districts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.location-time .district-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 4px;
  font-size: 10px;
  color: #a78bfa;
}

.location-time .district-tag i {
  font-size: 10px;
}

.location-time .time-range {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.location-time .time-range i {
  color: #3b82f6;
  font-size: 10px;
}

.hotspot-details .locate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 6px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #60a5fa;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.hotspot-details .locate-btn:hover {
  background: rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
}

/* ========== 态势描述 ========== */
.situation-desc {
  margin: 0 12px 12px;
  padding: 10px 12px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 8px;
}

.desc-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 8px;
}

.desc-label i {
  font-size: 12px;
}

.situation-desc p {
  margin: 0 0 6px 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.situation-desc p:last-child {
  margin-bottom: 0;
}

.situation-desc .impact-text {
  color: var(--text-muted);
  font-size: 10px;
}

/* 历史对比区块 */
.history-section .section-header {
  cursor: pointer;
}

.history-content {
  padding: 12px;
}

.match-card {
  background: rgba(234, 179, 8, 0.08);
  border-radius: 8px;
  padding: 12px;
}

.match-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.similarity-badge {
  padding: 3px 8px;
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.match-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.match-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.factor-tag {
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-secondary);
}

.impact-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.stat-item {
  text-align: center;
  padding: 8px 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #eab308;
  display: block;
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
}

.comparison-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.comparison-note i {
  color: #3b82f6;
  margin-top: 2px;
  flex-shrink: 0;
}

/* 潮位趋势区块 - 修复布局 */
.tide-section {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: 10px;
  overflow: hidden;
}

.station-select {
  margin-left: auto;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 11px;
  cursor: pointer;
}

.chart-container {
  height: 160px;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.tide-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(6, 182, 212, 0.05));
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.tide-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tide-info-item .label {
  font-size: 10px;
  color: var(--text-muted);
}

.tide-info-item .value {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.tide-info-item.peak .value { color: #8b5cf6; }
.tide-info-item.warning .value { color: #ef4444; }

/* TOP风险热点 */
.count-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
  transition: max-height 0.3s ease, padding 0.3s ease;
}

/* 滚动条样式 */
.risk-list::-webkit-scrollbar {
  width: 4px;
}

.risk-list::-webkit-scrollbar-track {
  background: transparent;
}

.risk-list::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.3);
  border-radius: 2px;
}

.risk-list::-webkit-scrollbar-thumb:hover {
  background: rgba(239, 68, 68, 0.5);
}

.risk-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border-left: 4px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.risk-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(4px);
}

.risk-item.high { border-left-color: #ef4444; }
.risk-item.medium { border-left-color: #f97316; }
.risk-item.low { border-left-color: #3b82f6; }

.risk-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.risk-rank.high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.risk-rank.medium { background: rgba(249, 115, 22, 0.2); color: #f97316; }
.risk-rank.low { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

.risk-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.risk-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.risk-type { color: var(--text-muted); }
.divider { color: var(--border-subtle); }
.over-design { color: #ef4444; font-weight: 600; }
.over-design.normal { color: #10b981; }

.related-station {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(6, 182, 212, 0.08);
  border-radius: 6px;
  font-size: 10px;
  color: #06b6d4;
}

.related-station i {
  font-size: 10px;
}

.station-peak {
  margin-left: auto;
  color: #8b5cf6;
  font-weight: 600;
}

.flood-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.flood-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
  font-size: 10px;
  color: #60a5fa;
}

.flood-tag i {
  font-size: 10px;
}

.flood-tag.people {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.risk-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 10px;
  color: var(--text-muted);
}

.risk-footer i {
  margin-right: 4px;
}

/* 行政区多标签行 */
.districts-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.district-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(251, 146, 60, 0.15);
  border: 1px solid rgba(251, 146, 60, 0.35);
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  color: #fb923c;
  transition: all 0.2s;
}

.district-tag:hover {
  background: rgba(251, 146, 60, 0.25);
}

.district-tag i {
  font-size: 10px;
  opacity: 0.8;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.locate-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.1);
  border-radius: 8px;
  color: #06b6d4;
  flex-shrink: 0;
  align-self: center;
  transition: all 0.2s;
}

.risk-item:hover .locate-btn {
  background: rgba(6, 182, 212, 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .risk-icon-wrap.level-high.risk-pulse-active {
    animation: none !important;
  }
}
</style>
