<template>
  <div class="data-panel-sidebar">
    <!-- 关键指标监测 - 灾害折叠面板 -->

    <!-- 1. 风浪潮（风暴潮/海浪/天文潮） -->
    <div class="disaster-panel" :class="{ collapsed: !expandedPanels.stormWave, 'has-warning': getOverallRisk('stormWave') !== 'normal' }">
      <div class="disaster-header" @click="togglePanel('stormWave')">
        <div class="disaster-title">
          <span class="disaster-icon storm-wave"><i class="fa-solid fa-water"></i></span>
          <span>风浪潮（风暴潮/海浪/天文潮）</span>
          <span class="risk-badge" :class="getOverallRisk('stormWave')">
            {{ getRiskText(getOverallRisk('stormWave')) }}
          </span>
        </div>
        <i class="fa-solid fa-chevron-down toggle-arrow"></i>
      </div>
      <div class="disaster-body">
        <div class="panel-summary summary-storm-wave" v-html="stormWaveSummary"></div>

        <!-- 摘要指标（潮位 + 浪高并排） -->
        <div class="summary-row">
          <div class="summary-item" :class="getCardStatus(realtimeData.overview.tideLevel)">
            <span class="summary-label"><i class="fa-solid fa-water"></i> 总潮位</span>
            <span class="summary-value">{{ realtimeData.overview.tideLevel.value }}<span class="unit">m</span></span>
            <span class="summary-sub">增水 +{{ realtimeData.overview.tideLevel.surgeHeight }}m · {{ realtimeData.overview.tideLevel.station }}</span>
          </div>
          <div class="summary-item" :class="getCardStatus(realtimeData.overview.waveHeight)">
            <span class="summary-label"><i class="fa-solid fa-wind"></i> 最大浪高</span>
            <span class="summary-value">{{ realtimeData.overview.waveHeight.value }}<span class="unit">m</span></span>
            <span class="summary-sub">{{ realtimeData.overview.waveHeight.station }}</span>
          </div>
        </div>

        <!-- 统一滚动区 -->
        <div class="station-scroll-area">

          <!-- ===== 潮位预警站点 ===== -->
          <div v-if="warningStations.length > 0" class="warning-section">
            <div class="section-header-bar tide">
              <i class="fa-solid fa-water"></i>
              <span>潮位预警站点</span>
              <span class="station-count">{{ warningStations.length }}</span>
            </div>
            <div class="section-cards">
            <div
              v-for="station in warningStations"
              :key="'tide-' + station.name"
              class="station-card-v2"
              :class="'warning-' + station.warningColor"
            >
              <div class="prediction-grid">
                <div class="pred-item station">
                  <i class="fa-solid fa-location-dot"></i>
                  <div class="pred-info">
                    <span class="pred-label">监测站点</span>
                    <span class="pred-value">{{ station.name }}</span>
                  </div>
                </div>
                <div class="pred-item time">
                  <i class="fa-solid fa-clock"></i>
                  <div class="pred-info">
                    <span class="pred-label">预测达峰</span>
                    <span class="pred-value">今日 {{ station.time }}</span>
                  </div>
                </div>
              </div>
              <div class="pred-item tide-peak" :class="'border-' + station.warningColor">
                <i class="fa-solid fa-water"></i>
                <div class="pred-info">
                  <span class="pred-label">预测峰值</span>
                  <span class="pred-value large">{{ station.maxLevel }}m</span>
                </div>
                <div class="pred-extra">
                  <span class="color-badge" :class="station.warningColor">{{ getWarningColorText(station.warningColor) }}</span>
                  <span class="over-text">增水 <strong>+{{ station.surgeHeight }}m</strong></span>
                </div>
              </div>
              <div class="observed-row">
                <div class="obs-item">
                  <i class="fa-solid fa-chart-line"></i>
                  <span class="obs-label">实测潮位</span>
                  <span class="obs-value">{{ station.currentLevel }}m</span>
                </div>
                <div class="obs-item">
                  <i class="fa-solid fa-clock"></i>
                  <span class="obs-label">实测时间</span>
                  <span class="obs-value">{{ station.observedTime }}</span>
                </div>
                <div class="obs-item" v-if="station.forecastWarning && station.observedWarning">
                  <span class="dual-badge">预报+实测超警</span>
                </div>
                <div class="obs-item" v-else-if="station.observedWarning">
                  <span class="obs-badge">实测超警</span>
                </div>
                <div class="obs-item" v-else>
                  <span class="forecast-badge">预报超警</span>
                </div>
              </div>
              <!-- 迷你趋势线 -->
              <div class="sparkline-row" v-if="station.trendData && !expandedStations[station.name]">
                <svg class="sparkline-svg" viewBox="0 0 200 36" preserveAspectRatio="none">
                  <line v-if="getWarningLineY(station.trendData, station.warningLevel) !== null"
                    x1="0" :y1="getWarningLineY(station.trendData, station.warningLevel)"
                    x2="200" :y2="getWarningLineY(station.trendData, station.warningLevel)"
                    class="sparkline-warning" />
                  <polyline
                    :points="getSparklinePath(station.trendData)"
                    class="sparkline-line"
                    :class="'sparkline-' + station.warningColor" />
                  <circle v-if="getSparklinePeak(station.trendData)"
                    :cx="getSparklinePeak(station.trendData).x"
                    :cy="getSparklinePeak(station.trendData).y"
                    r="3" class="sparkline-peak" :class="'peak-' + station.warningColor" />
                </svg>
                <span class="sparkline-hint">24h趋势</span>
              </div>
              <!-- 卡片内展开/收起按钮 -->
              <div class="card-detail-toggle" @click.stop="toggleStationDetail(station.name)">
                <i class="fa-solid" :class="expandedStations[station.name] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                <span>{{ expandedStations[station.name] ? '收起详细趋势' : '展开详细趋势' }}</span>
              </div>
              <!-- 卡片内详细趋势图（完整版） -->
              <div v-if="expandedStations[station.name]" class="card-chart-wrapper">
                <div class="card-chart-container" :id="'chart-' + station.name.replace(/\s/g, '_')"></div>
                <div class="card-chart-tags">
                  <div class="mini-tag peak">
                    <i class="fa-solid fa-arrow-trend-up"></i>
                    <span>峰值 {{ station.maxLevel || station.maxHeight }}m</span>
                  </div>
                  <div class="mini-tag warning">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>警戒 {{ station.warningLevel }}m</span>
                  </div>
                  <div class="mini-tag surge" v-if="station.surgeHeight">
                    <i class="fa-solid fa-wave-square"></i>
                    <span>增水 +{{ station.surgeHeight }}m</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          <!-- ===== 浪高预警站点 ===== -->
          <div v-if="waveWarningStations.length > 0" class="warning-section">
            <div class="section-header-bar wave">
              <i class="fa-solid fa-wind"></i>
              <span>浪高预警站点</span>
              <span class="station-count">{{ waveWarningStations.length }}</span>
            </div>
            <div class="section-cards">
            <div
              v-for="station in waveWarningStations"
              :key="'wave-' + station.name"
              class="station-card-v2"
              :class="'warning-' + station.warningColor"
            >
              <div class="prediction-grid">
                <div class="pred-item station">
                  <i class="fa-solid fa-location-dot"></i>
                  <div class="pred-info">
                    <span class="pred-label">监测站点</span>
                    <span class="pred-value">{{ station.name }}</span>
                  </div>
                </div>
                <div class="pred-item time">
                  <i class="fa-solid fa-clock"></i>
                  <div class="pred-info">
                    <span class="pred-label">预测达峰</span>
                    <span class="pred-value">今日 {{ station.time }}</span>
                  </div>
                </div>
              </div>
              <div class="pred-item tide-peak wave-type" :class="'border-' + station.warningColor">
                <i class="fa-solid fa-wind"></i>
                <div class="pred-info">
                  <span class="pred-label">预测最大浪高</span>
                  <span class="pred-value large">{{ station.maxHeight }}m</span>
                </div>
                <div class="pred-extra">
                  <span class="color-badge" :class="station.warningColor">{{ getWarningColorText(station.warningColor) }}</span>
                  <span v-if="station.direction" class="over-text">波向 <strong>{{ station.direction }}</strong></span>
                </div>
              </div>
              <div class="observed-row">
                <div class="obs-item">
                  <i class="fa-solid fa-chart-line"></i>
                  <span class="obs-label">实测浪高</span>
                  <span class="obs-value">{{ station.currentHeight }}m</span>
                </div>
                <div class="obs-item">
                  <i class="fa-solid fa-clock"></i>
                  <span class="obs-label">实测时间</span>
                  <span class="obs-value">{{ station.observedTime }}</span>
                </div>
                <div class="obs-item" v-if="station.forecastWarning && station.observedWarning">
                  <span class="dual-badge">预报+实测超警</span>
                </div>
                <div class="obs-item" v-else-if="station.observedWarning">
                  <span class="obs-badge">实测超警</span>
                </div>
                <div class="obs-item" v-else>
                  <span class="forecast-badge">预报超警</span>
                </div>
              </div>
              <!-- 迷你趋势线 -->
              <div class="sparkline-row" v-if="station.trendData && !expandedStations[station.name]">
                <svg class="sparkline-svg" viewBox="0 0 200 36" preserveAspectRatio="none">
                  <line v-if="getWarningLineY(station.trendData, station.warningLevel) !== null"
                    x1="0" :y1="getWarningLineY(station.trendData, station.warningLevel)"
                    x2="200" :y2="getWarningLineY(station.trendData, station.warningLevel)"
                    class="sparkline-warning" />
                  <polyline
                    :points="getSparklinePath(station.trendData)"
                    class="sparkline-line"
                    :class="'sparkline-' + station.warningColor" />
                  <circle v-if="getSparklinePeak(station.trendData)"
                    :cx="getSparklinePeak(station.trendData).x"
                    :cy="getSparklinePeak(station.trendData).y"
                    r="3" class="sparkline-peak" :class="'peak-' + station.warningColor" />
                </svg>
                <span class="sparkline-hint">24h趋势</span>
              </div>
              <!-- 卡片内展开/收起按钮 -->
              <div class="card-detail-toggle" @click.stop="toggleStationDetail(station.name)">
                <i class="fa-solid" :class="expandedStations[station.name] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                <span>{{ expandedStations[station.name] ? '收起详细趋势' : '展开详细趋势' }}</span>
              </div>
              <!-- 卡片内详细趋势图（完整版） -->
              <div v-if="expandedStations[station.name]" class="card-chart-wrapper">
                <div class="card-chart-container" :id="'chart-' + station.name.replace(/\s/g, '_')"></div>
                <div class="card-chart-tags">
                  <div class="mini-tag peak">
                    <i class="fa-solid fa-arrow-trend-up"></i>
                    <span>峰值 {{ station.maxHeight }}m</span>
                  </div>
                  <div class="mini-tag warning">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>警戒 {{ station.warningLevel }}m</span>
                  </div>
                  <div class="mini-tag direction" v-if="station.direction">
                    <i class="fa-solid fa-compass"></i>
                    <span>波向 {{ station.direction }}</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

        </div>


      </div>
    </div>

    <!-- 2. 海岸侵蚀 -->
    <div class="disaster-panel" :class="{ collapsed: !expandedPanels.erosion, 'has-warning': erosionRisk !== 'normal' }">
      <div class="disaster-header" @click="togglePanel('erosion')">
        <div class="disaster-title">
          <span class="disaster-icon erosion"><i class="fa-solid fa-video"></i></span>
          <span>海岸侵蚀</span>
          <span class="risk-badge" :class="erosionRisk">
            {{ getRiskText(erosionRisk) }}
          </span>
        </div>
        <i class="fa-solid fa-chevron-down toggle-arrow"></i>
      </div>
      <div class="disaster-body">
        <div class="panel-summary summary-erosion" v-html="erosionSummary"></div>
        <!-- 视频直播区域 -->
        <div class="video-container">
          <div class="video-player">
            <!-- Mock阶段显示占位 -->
            <div class="video-placeholder">
              <i class="fa-solid fa-video"></i>
              <span class="video-station-name">{{ activeErosionStation.stationName }}</span>
              <span class="video-status" :class="activeErosionStation.status">
                <i class="fa-solid fa-circle"></i>
                {{ activeErosionStation.status === 'online' ? '直播中' : '离线' }}
              </span>
            </div>
          </div>
          <!-- 站点切换 -->
          <div class="video-station-bar">
            <button
              v-for="stream in erosionStreams"
              :key="stream.id"
              class="station-btn"
              :class="{ active: activeErosionId === stream.id, offline: stream.status === 'offline' }"
              @click="activeErosionId = stream.id"
            >
              <i class="fa-solid fa-circle" :class="stream.status"></i>
              {{ stream.stationName.slice(0, 4) }}
            </button>
          </div>
        </div>
        <!-- 侵蚀关键指标 -->
        <div class="mini-indicators">
          <div class="mini-card" :class="activeErosionStation.riskLevel === 'high' ? 'alarm' : activeErosionStation.riskLevel === 'medium' ? 'warn' : 'normal'">
            <div class="mini-label">侵蚀速率</div>
            <div class="mini-value">{{ activeErosionStation.erosionRate }}<span class="unit">m/年</span></div>
          </div>
          <div class="mini-card" :class="Math.abs(activeErosionStation.coastlineChange) > 10 ? 'alarm' : Math.abs(activeErosionStation.coastlineChange) > 5 ? 'warn' : 'normal'">
            <div class="mini-label">岸线变化</div>
            <div class="mini-value">{{ activeErosionStation.coastlineChange }}<span class="unit">m</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 咸潮入侵 -->
    <div class="disaster-panel" :class="{ collapsed: !expandedPanels.saltwater, 'has-warning': saltwaterData.riskLevel !== 'low' }">
      <div class="disaster-header" @click="togglePanel('saltwater')">
        <div class="disaster-title">
          <span class="disaster-icon saltwater"><i class="fa-solid fa-droplet"></i></span>
          <span>咸潮入侵</span>
          <span class="risk-badge" :class="saltwaterData.riskLevel === 'high' ? 'alarm' : saltwaterData.riskLevel === 'medium' ? 'warn' : 'normal'">
            {{ getRiskText(saltwaterData.riskLevel === 'high' ? 'alarm' : saltwaterData.riskLevel === 'medium' ? 'warn' : 'normal') }}
          </span>
        </div>
        <i class="fa-solid fa-chevron-down toggle-arrow"></i>
      </div>
      <div class="disaster-body">
        <div class="panel-summary summary-saltwater" v-html="saltwaterSummary"></div>
        <!-- 核心指标 -->
        <div class="mini-indicators">
          <div class="mini-card" :class="saltwaterData.currentChlorinity >= saltwaterData.chlorinityThreshold.alarm ? 'alarm' : saltwaterData.currentChlorinity >= saltwaterData.chlorinityThreshold.warn ? 'warn' : 'normal'">
            <div class="mini-label">当前氯度</div>
            <div class="mini-value">{{ saltwaterData.currentChlorinity }}<span class="unit">mg/L</span></div>
            <div class="mini-threshold">阈值 {{ saltwaterData.chlorinityThreshold.warn }}</div>
          </div>
          <div class="mini-card" :class="saltwaterData.upstreamDistance >= saltwaterData.upstreamThreshold.alarm ? 'alarm' : saltwaterData.upstreamDistance >= saltwaterData.upstreamThreshold.warn ? 'warn' : 'normal'">
            <div class="mini-label">上溯距离</div>
            <div class="mini-value">{{ saltwaterData.upstreamDistance }}<span class="unit">km</span></div>
            <div class="mini-threshold">阈值 {{ saltwaterData.upstreamThreshold.warn }}km</div>
          </div>
        </div>
        <!-- 24h趋势迷你图 -->
        <div class="sparkline-section">
          <div class="sparkline-title">近24h氯度变化</div>
          <div class="sparkline-container" ref="saltwaterChartRef"></div>
        </div>
        <!-- 受影响取水口 -->
        <div class="intake-list">
          <div
            v-for="intake in saltwaterData.affectedIntakes"
            :key="intake.name"
            class="intake-item"
            :class="intake.status"
          >
            <span class="intake-name">{{ intake.name }}</span>
            <span class="intake-value">{{ intake.chlorinity }}<span class="unit">mg/L</span></span>
            <span class="intake-badge" :class="intake.status">
              {{ intake.status === 'alarm' ? '超标' : intake.status === 'warn' ? '临界' : '正常' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 海水入侵 -->
    <div class="disaster-panel" :class="{ collapsed: !expandedPanels.seawater, 'has-warning': seawaterData.riskLevel !== 'low' }">
      <div class="disaster-header" @click="togglePanel('seawater')">
        <div class="disaster-title">
          <span class="disaster-icon seawater"><i class="fa-solid fa-water"></i></span>
          <span>海水入侵</span>
          <span class="risk-badge" :class="seawaterData.riskLevel === 'high' ? 'alarm' : seawaterData.riskLevel === 'medium' ? 'warn' : 'normal'">
            {{ getRiskText(seawaterData.riskLevel === 'high' ? 'alarm' : seawaterData.riskLevel === 'medium' ? 'warn' : 'normal') }}
          </span>
        </div>
        <i class="fa-solid fa-chevron-down toggle-arrow"></i>
      </div>
      <div class="disaster-body">
        <div class="panel-summary summary-seawater" v-html="seawaterSummary"></div>
        <!-- 核心指标 -->
        <div class="mini-indicators">
          <div class="mini-card" :class="seawaterData.groundwaterLevel <= seawaterData.groundwaterThreshold.alarm ? 'alarm' : seawaterData.groundwaterLevel <= seawaterData.groundwaterThreshold.warn ? 'warn' : 'normal'">
            <div class="mini-label">地下水位</div>
            <div class="mini-value">{{ seawaterData.groundwaterLevel }}<span class="unit">m</span></div>
          </div>
          <div class="mini-card" :class="seawaterData.chlorideConcentration >= seawaterData.chlorideThreshold.alarm ? 'alarm' : seawaterData.chlorideConcentration >= seawaterData.chlorideThreshold.warn ? 'warn' : 'normal'">
            <div class="mini-label">氯离子浓度</div>
            <div class="mini-value">{{ seawaterData.chlorideConcentration }}<span class="unit">mg/L</span></div>
          </div>
        </div>
        <!-- 入侵范围 -->
        <div class="intrusion-info">
          <div class="intrusion-row">
            <span class="intrusion-label">入侵距离</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(seawaterData.intrusionDistance / 10 * 100, 100) + '%' }"></div>
            </div>
            <span class="intrusion-value">{{ seawaterData.intrusionDistance }}<span class="unit">km</span></span>
          </div>
          <div class="intrusion-row">
            <span class="intrusion-label">影响面积</span>
            <div class="progress-bar">
              <div class="progress-fill area" :style="{ width: Math.min(seawaterData.affectedArea / 50 * 100, 100) + '%' }"></div>
            </div>
            <span class="intrusion-value">{{ seawaterData.affectedArea }}<span class="unit">km²</span></span>
          </div>
        </div>
        <!-- 监测井列表 -->
        <div class="well-list">
          <div
            v-for="well in seawaterData.monitoringWells"
            :key="well.name"
            class="well-item"
            :class="well.status"
          >
            <span class="well-dot" :class="well.status"></span>
            <span class="well-name">{{ well.name }}</span>
            <span class="well-value">{{ well.chloride }}<span class="unit">mg/L</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备与数据统计 - 保留不变 -->
    <div class="stats-section">
      <div class="stats-header">
        <i class="fa-solid fa-chart-pie"></i>
        <span>设备与数据</span>
      </div>
      <div class="stats-grid">
        <div class="stat-mini">
          <div class="stat-mini-value">{{ deviceStats.totalDevices }}</div>
          <div class="stat-mini-label">设备总数</div>
        </div>
        <div class="stat-mini online">
          <div class="stat-mini-value">{{ deviceStats.onlineDevices }}</div>
          <div class="stat-mini-label">在线设备</div>
        </div>
        <div class="stat-mini" :class="{ alert: alertDevicesCount > 0 }">
          <div class="stat-mini-value">{{ alertDevicesCount }}</div>
          <div class="stat-mini-label">预警设备</div>
        </div>
        <div class="stat-mini data">
          <div class="stat-mini-value">{{ databaseStats.totalData }}<span class="unit">TB</span></div>
          <div class="stat-mini-label">数据总量</div>
        </div>
      </div>
      <div class="quality-row">
        <span class="quality-label">数据完整率</span>
        <div class="quality-bar">
          <div class="quality-fill" :style="{ width: dataQuality.completeness + '%' }"></div>
        </div>
        <span class="quality-value">{{ dataQuality.completeness }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useAppStore } from '../../stores/app'

import { mockRealtimeData, mockErosionVideoStreams, mockSaltwaterData, mockSeawaterData } from '../../data/mockData'
import { mockAISummaryData } from '../../data/aiSummaryData'
import { mockTideForecastStations, mockWaveForecastStations } from '../../data/seaConditionData'

const store = useAppStore()

// ===== 面板展开/折叠状态 =====
const expandedPanels = reactive({
  stormWave: false,
  erosion: false,
  saltwater: false,
  seawater: false
})

const activeStormTab = ref('tide') // 潮位/浪高 Tab

function togglePanel(panel) {
  expandedPanels[panel] = !expandedPanels[panel]
}

// ===== 风浪潮数据 =====
const realtimeData = computed(() => mockRealtimeData)
const dataQuality = computed(() => mockRealtimeData.dataQuality)
const tideTrendData = computed(() => mockAISummaryData.tideAnalysis)
const selectedStation = ref('zhuhai')
const chartContainer = ref(null)
let tideChartInstance = null

const currentStationData = computed(() => {
  return tideTrendData.value.stations.find(s => s.id === selectedStation.value)
})

const currentTideData = computed(() => {
  return tideTrendData.value.stationData[selectedStation.value]
})

const currentPeakInfo = computed(() => {
  return currentTideData.value?.peakInfo
})

const currentAffectedDistricts = computed(() => {
  return currentTideData.value?.affectedDistricts
})

// 风浪潮整体风险判断
function getOverallRisk(type) {
  if (type === 'stormWave') {
    const overview = realtimeData.value.overview
    const hasAlarm = Object.values(overview).some(item => item.value >= item.threshold.alarm)
    const hasWarn = Object.values(overview).some(item => item.value >= item.threshold.warn)
    if (hasAlarm) return 'alarm'
    if (hasWarn) return 'warn'
    return 'normal'
  }
  return 'normal'
}

function riskLevelToPanelState(level) {
  if (['alarm', 'high', 'red'].includes(level)) return 'alarm'
  if (['warn', 'medium', 'orange', 'yellow', 'blue'].includes(level)) return 'warn'
  return 'normal'
}

// ===== 潮位预警站点列表（按四色级别排序） =====
const warningColorOrder = { red: 0, orange: 1, yellow: 2, blue: 3 }
const warningStations = computed(() => {
  return mockTideForecastStations
    .filter(s => s.forecastWarning || s.observedWarning)
    .sort((a, b) => (warningColorOrder[a.warningColor] ?? 99) - (warningColorOrder[b.warningColor] ?? 99))
})

// 浪高预警站点列表
const waveWarningStations = computed(() => {
  return mockWaveForecastStations
    .filter(s => s.forecastWarning || s.observedWarning)
    .sort((a, b) => (warningColorOrder[a.warningColor] ?? 99) - (warningColorOrder[b.warningColor] ?? 99))
})

const stormWaveSummary = computed(() => {
  const tideStations = warningStations.value
  const waveStations = waveWarningStations.value
  const predicted = tideStations.filter(s => s.forecastWarning).length
  const observed = tideStations.filter(s => s.observedWarning).length
  const overlap = tideStations.filter(s => s.forecastWarning && s.observedWarning).length
  const peak = tideStations[0]
  const topWave = waveStations[0]
  return `摘要：潮位预测预警<strong>${predicted}</strong>站、实测预警<strong>${observed}</strong>站、重叠<strong>${overlap}</strong>站；最高总潮位<strong>${peak?.maxLevel ?? '--'}m</strong>（${peak?.name ?? '--'}）@${peak?.time ?? '--'}，最大浪高<strong>${topWave?.maxHeight ?? '--'}m</strong>。`
})

// Tab 角标计数
const tideWarningCount = computed(() => warningStations.value.filter(s => s.warningColor === 'red' || s.warningColor === 'orange').length)
const waveWarningCount = computed(() => waveWarningStations.value.filter(s => s.warningColor === 'red' || s.warningColor === 'orange').length)

function getWarningColorText(color) {
  switch (color) {
    case 'red': return '红色'
    case 'orange': return '橙色'
    case 'yellow': return '黄色'
    case 'blue': return '蓝色'
    default: return color
  }
}

// ===== 迷你 sparkline 趋势线相关 =====
// 管理每个站点卡片的展开/收起状态
const expandedStations = ref({})
const stationChartInstances = new Map() // 站点名 -> ECharts 实例

// 初始化默认展开第一个潮位站和第一个浪高站
function initDefaultExpanded() {
  if (warningStations.value.length > 0) {
    expandedStations.value[warningStations.value[0].name] = true
  }
  if (waveWarningStations.value.length > 0) {
    expandedStations.value[waveWarningStations.value[0].name] = true
  }
}

function toggleStationDetail(stationName) {
  if (expandedStations.value[stationName]) {
    delete expandedStations.value[stationName]
    // 销毁 ECharts 实例
    const instance = stationChartInstances.get(stationName)
    if (instance) {
      instance.dispose()
      stationChartInstances.delete(stationName)
    }
  } else {
    expandedStations.value[stationName] = true
    // 下一帧渲染图表
    nextTick(() => renderStationChart(stationName))
  }
}

/**
 * 为站点创建详细 ECharts 趋势图
 */
function renderStationChart(stationName) {
  const container = document.getElementById('chart-' + stationName.replace(/\s/g, '_'))
  if (!container) return

  // 查找站点数据
  const tideStation = warningStations.value.find(s => s.name === stationName)
  const waveStation = waveWarningStations.value.find(s => s.name === stationName)
  const station = tideStation || waveStation
  if (!station || !station.trendData) return

  let instance = stationChartInstances.get(stationName)
  if (!instance) {
    instance = echarts.init(container)
    stationChartInstances.set(stationName, instance)
  }

  const data = station.trendData
  const warningLevel = station.warningLevel || 0
  const isTide = !!tideStation

  // 时间标签（00:00 - 23:00）
  const hours = data.map((_, i) => `${String(i).padStart(2, '0')}:00`)

  // 将 trendData 拆分为观测数据（前15点）和预测数据（后10点，重叠1点）
  const obsData = hours.map((_, i) => i <= 14 ? data[i] : null)
  const predData = hours.map((_, i) => i >= 14 ? data[i] : null)

  // 基于 surgeHeight 模拟增水数据
  const surgeHeight = station.surgeHeight || 0
  const surgeData = hours.map((_, i) => {
    if (i < 10 || i > 20) return null
    const peak = 15  // 峰值时间点
    const dist = Math.abs(i - peak)
    return dist <= 5 ? +(surgeHeight * (1 - dist / 6)).toFixed(2) : null
  })

  // 四色警戒线阈值（根据 warningLevel 推算）
  const wl = {
    blue: +(warningLevel * 0.7).toFixed(1),
    yellow: +(warningLevel * 0.85).toFixed(1),
    orange: warningLevel,
    red: +(warningLevel * 1.15).toFixed(1)
  }

  const series = [
    // 四色警戒线
    {
      name: '红色警戒',
      type: 'line',
      data: hours.map(() => wl.red),
      lineStyle: { color: '#dc2626', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '橙色警戒',
      type: 'line',
      data: hours.map(() => wl.orange),
      lineStyle: { color: '#ea580c', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '黄色警戒',
      type: 'line',
      data: hours.map(() => wl.yellow),
      lineStyle: { color: '#ca8a04', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '蓝色警戒',
      type: 'line',
      data: hours.map(() => wl.blue),
      lineStyle: { color: '#2563eb', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    // 增水柱状图
    {
      name: '风暴潮增水',
      type: 'bar',
      data: surgeData,
      barWidth: 6,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(249, 115, 22, 0.7)' },
          { offset: 1, color: 'rgba(249, 115, 22, 0.15)' }
        ]),
        borderRadius: [2, 2, 0, 0]
      },
      yAxisIndex: 1,
      z: 2
    },
    // 观测曲线（绿色实线）
    {
      name: isTide ? '总潮位(观测)' : '浪高(观测)',
      type: 'line',
      data: obsData,
      lineStyle: { color: '#10b981', width: 2 },
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: { color: '#10b981' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
        ])
      },
      z: 4
    },
    // 预测曲线（紫色虚线）
    {
      name: isTide ? '总潮位(预测)' : '浪高(预测)',
      type: 'line',
      data: predData,
      lineStyle: { color: '#8b5cf6', width: 2, type: 'dashed' },
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: { color: '#8b5cf6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(139, 92, 246, 0.15)' },
          { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
        ])
      },
      z: 3
    }
  ]

  const obsLabel = isTide ? '总潮位(观测)' : '浪高(观测)'
  const predLabel = isTide ? '总潮位(预测)' : '浪高(预测)'

  const option = {
    grid: { left: 38, right: 38, top: 32, bottom: 22 },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
      axisLabel: {
        color: 'rgba(255,255,255,0.45)', fontSize: 9,
        interval: 5, formatter: v => v.slice(0, 2) + 'h'
      },
      splitLine: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: isTide ? '潮位(m)' : '浪高(m)',
        nameTextStyle: { color: 'rgba(255,255,255,0.35)', fontSize: 8 },
        min: val => Math.floor(val.min * 10) / 10,
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 8, formatter: '{value}' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      {
        type: 'value',
        name: '增水(m)',
        nameTextStyle: { color: 'rgba(255,255,255,0.35)', fontSize: 8 },
        min: 0,
        max: Math.max(surgeHeight * 2, 1),
        axisLine: { show: false },
        axisLabel: { color: 'rgba(249, 115, 22, 0.5)', fontSize: 8, formatter: '{value}' },
        splitLine: { show: false }
      }
    ],
    series,
    legend: {
      data: [obsLabel, predLabel, '风暴潮增水'],
      top: 0,
      textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 8 },
      itemWidth: 10,
      itemHeight: 6
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 30, 50, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e5e7eb', fontSize: 10 },
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

  instance.setOption(option)
}

/**
 * 将趋势数据转为 SVG polyline 的 points 属性字符串
 * @param {number[]} data - 趋势数据点
 * @param {number} width - SVG 宽度
 * @param {number} height - SVG 高度
 * @param {number} padding - 上下内边距
 */
function getSparklinePath(data, width = 200, height = 36, padding = 3) {
  if (!data || data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  return data.map((val, i) => {
    const x = i * step
    const y = padding + (1 - (val - min) / range) * (height - padding * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

/**
 * 计算警戒线在 sparkline 中的 Y 坐标
 */
function getWarningLineY(data, warningLevel, height = 36, padding = 3) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  if (warningLevel < min || warningLevel > max) return null
  return padding + (1 - (warningLevel - min) / range) * (height - padding * 2)
}

/**
 * 获取 sparkline 中峰值点的坐标
 */
function getSparklinePeak(data, width = 200, height = 36, padding = 3) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const peakIdx = data.indexOf(max)
  const step = width / (data.length - 1)
  return {
    x: peakIdx * step,
    y: padding + (1 - (max - min) / range) * (height - padding * 2)
  }
}

// 当前站点最大增水
const currentSurgeMax = computed(() => {
  const surgeData = currentTideData.value?.surgeData
  if (!surgeData?.length) return null
  return Math.max(...surgeData.map(d => d.value)).toFixed(2)
})

// ===== 海岸侵蚀数据 =====
const erosionStreams = computed(() => mockErosionVideoStreams)
const activeErosionId = ref(mockErosionVideoStreams[0]?.id || '')
const activeErosionStation = computed(() => {
  return erosionStreams.value.find(s => s.id === activeErosionId.value) || erosionStreams.value[0]
})
const erosionRisk = computed(() => {
  const maxRisk = erosionStreams.value.reduce((max, s) => {
    const levels = { high: 3, medium: 2, low: 1 }
    return (levels[s.riskLevel] || 0) > (levels[max] || 0) ? s.riskLevel : max
  }, 'low')
  return riskLevelToPanelState(maxRisk)
})
const erosionSummary = computed(() => {
  const streams = erosionStreams.value || []
  const onlineCount = streams.filter(s => s.status === 'online').length
  const warningCount = streams.filter(s => riskLevelToPanelState(s.riskLevel) !== 'normal').length
  const maxRate = streams.reduce((max, s) => Math.max(max, Number(s.erosionRate) || 0), 0)
  return `摘要：<strong>${onlineCount}/${streams.length}</strong>路视频在线，<strong>${warningCount}</strong>处岸段预警，最大侵蚀速率<strong>${maxRate.toFixed(1)}m/年</strong>。`
})

// ===== 咸潮入侵数据 =====
const saltwaterData = computed(() => mockSaltwaterData)
const saltwaterChartRef = ref(null)
let saltwaterChartInstance = null
const saltwaterSummary = computed(() => {
  const intakes = saltwaterData.value?.affectedIntakes || []
  const warningCount = intakes.filter(i => i.status !== 'normal').length
  return `摘要：<strong>${warningCount}</strong>个取水口预警，当前氯度<strong>${saltwaterData.value?.currentChlorinity ?? '--'}mg/L</strong>，上溯<strong>${saltwaterData.value?.upstreamDistance ?? '--'}km</strong>。`
})

// ===== 海水入侵数据 =====
const seawaterData = computed(() => mockSeawaterData)
const seawaterSummary = computed(() => {
  const wells = seawaterData.value?.monitoringWells || []
  const warningCount = wells.filter(w => w.status !== 'normal').length
  const maxChloride = wells.reduce((max, w) => Math.max(max, Number(w.chloride) || 0), 0)
  return `摘要：<strong>${warningCount}</strong>口监测井预警，最大氯离子<strong>${maxChloride}mg/L</strong>，入侵距离<strong>${seawaterData.value?.intrusionDistance ?? '--'}km</strong>。`
})

// ===== 通用方法 =====
function getRiskText(level) {
  switch (level) {
    case 'alarm': return '预警'
    case 'warn': return '关注'
    default: return '正常'
  }
}

function getCardStatus(item) {
  if (item.value >= item.threshold.alarm) return 'alarm'
  if (item.value >= item.threshold.warn) return 'warn'
  return 'normal'
}

function getStatusText(item) {
  if (item.value >= item.threshold.alarm) return '超警戒'
  if (item.value >= item.threshold.warn) return '需关注'
  return '正常'
}

function getTrendIcon(trend) {
  switch (trend) {
    case 'up': return 'fa-solid fa-arrow-up'
    case 'down': return 'fa-solid fa-arrow-down'
    default: return 'fa-solid fa-minus'
  }
}

// ===== 潮位趋势图表（四色警戒线 + 增水面积图） =====
function renderTideChart() {
  if (!chartContainer.value) return

  if (!tideChartInstance) {
    tideChartInstance = echarts.init(chartContainer.value)
  }

  const data = currentTideData.value
  if (!data) return
  const stationInfo = currentStationData.value
  const wl = stationInfo?.warningLevels || { blue: 2.5, yellow: 3.0, orange: 3.5, red: 4.0 }

  // 合并所有时间节点（观测+预测+增水）
  const allTimes = [...new Set([
    ...data.observation.map(d => d.time),
    ...data.prediction.map(d => d.time),
    ...(data.surgeData || []).map(d => d.time)
  ])].sort()

  const series = [
    // 四色警戒线
    {
      name: '红色警戒',
      type: 'line',
      data: allTimes.map(() => wl.red),
      lineStyle: { color: '#dc2626', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '橙色警戒',
      type: 'line',
      data: allTimes.map(() => wl.orange),
      lineStyle: { color: '#ea580c', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '黄色警戒',
      type: 'line',
      data: allTimes.map(() => wl.yellow),
      lineStyle: { color: '#ca8a04', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    {
      name: '蓝色警戒',
      type: 'line',
      data: allTimes.map(() => wl.blue),
      lineStyle: { color: '#2563eb', width: 1, type: 'dashed' },
      symbol: 'none', z: 1
    },
    // 风暴潮增水面积图
    {
      name: '风暴潮增水',
      type: 'bar',
      data: allTimes.map(t => {
        const point = (data.surgeData || []).find(d => d.time === t)
        return point ? point.value : null
      }),
      barWidth: 8,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(249, 115, 22, 0.7)' },
          { offset: 1, color: 'rgba(249, 115, 22, 0.15)' }
        ]),
        borderRadius: [2, 2, 0, 0]
      },
      yAxisIndex: 1,
      z: 2
    },
    // 总潮位观测曲线
    {
      name: '总潮位(观测)',
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
          { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
        ])
      },
      z: 4
    },
    // 总潮位预测曲线
    {
      name: '总潮位(预测)',
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
          { offset: 0, color: 'rgba(139, 92, 246, 0.15)' },
          { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
        ])
      },
      z: 3
    }
  ]

  const option = {
    grid: { left: 40, right: 40, top: 35, bottom: 20 },
    xAxis: {
      type: 'category',
      data: allTimes,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
      splitLine: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '潮位(m)',
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
        min: 0,
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, formatter: '{value}' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      {
        type: 'value',
        name: '增水(m)',
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
        min: 0,
        max: 1.5,
        axisLine: { show: false },
        axisLabel: { color: 'rgba(249, 115, 22, 0.6)', fontSize: 9, formatter: '{value}' },
        splitLine: { show: false }
      }
    ],
    series,
    legend: {
      data: ['总潮位(观测)', '总潮位(预测)', '风暴潮增水'],
      top: 0,
      textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
      itemWidth: 12,
      itemHeight: 7
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 30, 50, 0.95)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
      textStyle: { color: '#fff', fontSize: 10 },
      formatter: function (params) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`
        params.forEach(p => {
          if (p.value != null) {
            html += `<div style="display:flex;align-items:center;gap:4px">`
            html += `${p.marker}<span>${p.seriesName}: <b>${p.value}</b>m</span></div>`
          }
        })
        return html
      }
    }
  }

  tideChartInstance.setOption(option, true)
}

// ===== 咸潮sparkline图表 =====
function renderSaltwaterSparkline() {
  if (!saltwaterChartRef.value) return

  if (!saltwaterChartInstance) {
    saltwaterChartInstance = echarts.init(saltwaterChartRef.value)
  }

  const trendData = saltwaterData.value.trend24h
  const threshold = saltwaterData.value.chlorinityThreshold.warn

  const option = {
    grid: { left: 35, right: 8, top: 8, bottom: 20 },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.time),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
    },
    series: [
      {
        name: '阈值',
        type: 'line',
        data: trendData.map(() => threshold),
        lineStyle: { color: '#ef4444', width: 1, type: 'dashed' },
        symbol: 'none',
        z: 1
      },
      {
        name: '氯度',
        type: 'line',
        data: trendData.map(d => d.value),
        lineStyle: { color: '#f59e0b', width: 2 },
        symbol: 'none',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
          ])
        },
        smooth: true
      }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 30, 50, 0.9)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      textStyle: { color: '#fff', fontSize: 10 },
      formatter: (params) => {
        const val = params[1]?.value || params[0]?.value
        return `${params[0].axisValue}<br/>氯度: ${val} mg/L`
      }
    }
  }

  saltwaterChartInstance.setOption(option)
}

// ===== 设备统计 =====
const deviceStats = computed(() => store.stats)
const databaseStats = computed(() => store.databaseStats)
const alertDevicesCount = computed(() =>
  store.devices.filter(d => d.status === 'alarm' || d.status === 'warn').length
)

function initPanelExpandByRisk() {
  expandedPanels.stormWave = getOverallRisk('stormWave') !== 'normal'
  expandedPanels.erosion = erosionRisk.value !== 'normal'
  expandedPanels.saltwater = riskLevelToPanelState(saltwaterData.value?.riskLevel) !== 'normal'
  expandedPanels.seawater = riskLevelToPanelState(seawaterData.value?.riskLevel) !== 'normal'
}

// ===== 生命周期 =====
onMounted(() => {
  nextTick(() => {
    initPanelExpandByRisk()
    // 初始化默认展开的站点
    initDefaultExpanded()
    // 仅在风浪潮展开时渲染默认展开站点图表
    if (expandedPanels.stormWave) {
      nextTick(() => {
        Object.keys(expandedStations.value).forEach(name => renderStationChart(name))
      })
    }
    if (expandedPanels.stormWave) {
      renderTideChart()
    }
    if (expandedPanels.saltwater) {
      renderSaltwaterSparkline()
    }
  })
})

watch(selectedStation, () => {
  if (!expandedPanels.stormWave) return
  nextTick(() => renderTideChart())
})

watch(() => expandedPanels.stormWave, (expanded) => {
  if (!expanded) return
  nextTick(() => {
    // resize 所有展开的站点图表
    Object.keys(expandedStations.value).forEach(name => {
      const instance = stationChartInstances.get(name)
      if (instance) {
        instance.resize()
      } else {
        renderStationChart(name)
      }
    })
    if (tideChartInstance) {
      tideChartInstance.resize()
    } else {
      renderTideChart()
    }
  })
})

watch(() => expandedPanels.saltwater, (expanded) => {
  if (!expanded) return
  nextTick(() => {
    if (saltwaterChartInstance) {
      saltwaterChartInstance.resize()
    } else {
      renderSaltwaterSparkline()
    }
  })
})

onUnmounted(() => {
  if (tideChartInstance) {
    tideChartInstance.dispose()
    tideChartInstance = null
  }
  if (saltwaterChartInstance) {
    saltwaterChartInstance.dispose()
    saltwaterChartInstance = null
  }
})
</script>

<style scoped>
/* ===== 侧边栏容器 ===== */
.data-panel-sidebar {
  width: 340px;
  flex-shrink: 0;
  background: var(--bg-deepest);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  gap: 10px;
  overflow-y: auto;
  z-index: 50;
  -webkit-overflow-scrolling: touch;
}

.data-panel-sidebar::-webkit-scrollbar { width: 4px; }
.data-panel-sidebar::-webkit-scrollbar-track { background: transparent; }
.data-panel-sidebar::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
.data-panel-sidebar::-webkit-scrollbar-thumb:hover { background: #10b981; }

/* ===== 灾害折叠面板 ===== */
.disaster-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  box-shadow: var(--shadow-panel);
  transition: border-color 0.3s ease;
}

.disaster-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan) 30%, var(--accent-cyan) 70%, transparent);
  opacity: 0.6;
}

.disaster-panel.has-warning {
  border-color: rgba(245, 158, 11, 0.4);
}

.disaster-panel.has-warning::before {
  background: linear-gradient(90deg, transparent, #f59e0b 30%, #f59e0b 70%, transparent);
}

/* ===== 灾害面板头部 ===== */
.disaster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.disaster-header:hover {
  background: var(--bg-hover);
}

.disaster-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.disaster-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.disaster-icon.storm-wave {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.disaster-icon.erosion {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
}

.disaster-icon.saltwater {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.disaster-icon.seawater {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
}

.risk-badge {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid;
}

.risk-badge.normal {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

.risk-badge.warn {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.risk-badge.alarm {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.toggle-arrow {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.3s ease;
}

.disaster-panel.collapsed .toggle-arrow {
  transform: rotate(-90deg);
}

/* ===== 灾害面板内容区 ===== */
.disaster-body {
  max-height: 5000px;
  overflow: visible;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 12px 12px 12px;
}

.disaster-panel.collapsed .disaster-body {
  max-height: 0;
  padding: 0 12px;
  overflow: hidden;
}

/* ===== 风浪潮 - 数据卡片网格 ===== */
.data-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.data-card {
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(20, 30, 50, 0.4));
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  padding: 12px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

.data-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #10b981, #3b82f6);
  opacity: 0;
  transition: opacity 0.3s;
}

.data-card:hover {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.05));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.data-card:hover::before { opacity: 1; }

.data-card.warn {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border-color: rgba(245, 158, 11, 0.4);
}

.data-card.warn::before {
  background: linear-gradient(180deg, #f59e0b, #ef4444);
  opacity: 1;
}

.data-card.alarm {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border-color: rgba(239, 68, 68, 0.4);
}

.data-card.alarm::before {
  background: linear-gradient(180deg, #ef4444, #dc2626);
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-label {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-trend { font-size: 10px; }
.card-trend.up { color: #ef4444; }
.card-trend.down { color: #10b981; }
.card-trend.stable { color: var(--text-muted); }

.card-value {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.card-value .value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-display);
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.data-card.warn .card-value .value {
  color: #f59e0b;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

.data-card.alarm .card-value .value {
  color: #ef4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.card-value .unit {
  font-size: 12px;
  color: var(--text-secondary);
  text-shadow: none;
}

.card-value .direction {
  font-size: 11px;
  color: #3b82f6;
  margin-left: 4px;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 8px;
  font-weight: 600;
}

.card-station {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 4px;
}

.card-status-text {
  font-size: 10px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 10px;
  display: inline-block;
  font-weight: 600;
  border: 1px solid;
}

.card-status-text.normal {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.4);
}

.card-status-text.warn {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.4);
}

.card-status-text.alarm {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

/* ===== 区块分隔标题条 ===== */
.warning-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warning-section + .warning-section {
  margin-top: 16px;
}

.section-header-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.section-header-bar i {
  font-size: 11px;
}

.section-header-bar.tide {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.section-header-bar.wave {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05));
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

/* ===== 面板摘要 ===== */
.panel-summary {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.03);
}

.panel-summary.summary-storm-wave {
  border-color: rgba(59, 130, 246, 0.25);
  background: rgba(59, 130, 246, 0.08);
}

.panel-summary.summary-erosion {
  border-color: rgba(251, 146, 60, 0.25);
  background: rgba(251, 146, 60, 0.08);
}

.panel-summary.summary-saltwater {
  border-color: rgba(245, 158, 11, 0.25);
  background: rgba(245, 158, 11, 0.08);
}

.panel-summary.summary-seawater {
  border-color: rgba(6, 182, 212, 0.25);
  background: rgba(6, 182, 212, 0.08);
}

/* P0-1.2 摘要文本中的关键数值高亮 */
.panel-summary strong {
  font-weight: 700;
  color: var(--text-primary);
}
.panel-summary.summary-storm-wave strong { color: #60a5fa; }
.panel-summary.summary-erosion strong { color: #fb923c; }
.panel-summary.summary-saltwater strong { color: #fbbf24; }
.panel-summary.summary-seawater strong { color: #22d3ee; }

/* ===== 摘要指标行 ===== */
.summary-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.summary-item {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item.alarm { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08); }
.summary-item.warn { border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.06); }

/* P0-1.1 关键数值状态着色 — 超警数值红色/橙色，正常保持白色 */
.summary-item.alarm .summary-value { color: #f87171; text-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
.summary-item.warn .summary-value  { color: #fbbf24; text-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }
.summary-item.alarm .summary-label { color: #ef4444; }
.summary-item.warn .summary-label  { color: #f59e0b; }

.summary-label {
  font-size: 10px;
  color: var(--text-muted);
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--text-primary);
}

.summary-value .unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 2px;
}

.summary-sub {
  font-size: 10px;
  color: #f97316;
  font-weight: 600;
}

.summary-trend {
  font-size: 11px;
  font-weight: 600;
}

.summary-trend.up { color: #ef4444; }
.summary-trend.down { color: #10b981; }
.summary-trend.stable { color: var(--text-muted); }

/* ===== 预警站点列表 ===== */
.warning-stations {
  margin-bottom: 12px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.section-label i {
  color: #f59e0b;
  font-size: 10px;
}

.station-count {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-weight: 700;
}

/* 外层容器 */
.station-scroll-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 12px;
}

/* 每区块独立滚动（约6张卡片高度） */
.section-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 550px;
  overflow-y: auto;
  padding-right: 4px;
}

.section-cards::-webkit-scrollbar { width: 3px; }
.section-cards::-webkit-scrollbar-track { background: transparent; }
.section-cards::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }

/* ===== 站点卡片 V2（参考 AISituationSummary） ===== */
.station-card-v2 {
  border-radius: 10px;
  overflow: visible;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.02);
}

.station-card-v2.warning-red {
  border-color: rgba(220, 38, 38, 0.5);
  border-left: 3px solid #dc2626;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(255, 255, 255, 0.02));
}
.station-card-v2.warning-orange {
  border-color: rgba(234, 88, 12, 0.45);
  border-left: 3px solid #ea580c;
  background: linear-gradient(135deg, rgba(234, 88, 12, 0.07), rgba(255, 255, 255, 0.02));
}
.station-card-v2.warning-yellow {
  border-color: rgba(202, 138, 4, 0.4);
  border-left: 3px solid #ca8a04;
  background: linear-gradient(135deg, rgba(202, 138, 4, 0.06), rgba(255, 255, 255, 0.02));
}
.station-card-v2.warning-blue {
  border-color: rgba(37, 99, 235, 0.35);
  border-left: 3px solid #2563eb;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(255, 255, 255, 0.02));
}

.prediction-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.pred-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
}

.pred-item i {
  font-size: 13px;
  margin-top: 2px;
}

.pred-item.station { border-right: 1px solid var(--border-subtle); }
.pred-item.station i { color: #10b981; }
.pred-item.time i { color: #8b5cf6; }

.pred-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.pred-label {
  font-size: 9px;
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
  font-size: 22px;
  font-weight: 700;
}

/* 峰值行 */
.pred-item.tide-peak {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;
}

.pred-item.tide-peak > * {
  position: relative;
  z-index: 2;
}

/* ===== 波浪动画层 ===== */
.pred-item.tide-peak::before,
.pred-item.tide-peak::after {
  content: '';
  position: absolute;
  left: -100%;
  bottom: 0;
  width: 300%;
  pointer-events: none;
  z-index: 1;
}
/* ===== 潮位动画 —— 缓慢平滑的水面升降 ===== */
/* 前景波浪 —— 缓慢正弦波 */
.pred-item.tide-peak:not(.wave-type)::before {
  height: 24px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 28 Q150 12 300 28 T600 28 T900 28 T1200 28 L1200 40 L0 40Z' fill='rgba(255%2C255%2C255%2C0.04)'/%3E%3C/svg%3E") repeat-x;
  background-size: 500px 24px;
  animation: tideSlide 8s ease-in-out infinite;
}

/* 背景波浪 —— 更慢的反向缓波 */
.pred-item.tide-peak:not(.wave-type)::after {
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 22 Q200 8 400 22 T800 22 T1200 22 L1200 40 L0 40Z' fill='rgba(255%2C255%2C255%2C0.025)'/%3E%3C/svg%3E") repeat-x;
  background-size: 400px 18px;
  animation: tideSlide 12s ease-in-out infinite reverse;
}

/* ===== 海浪动画 —— 快速激烈的尖锐浪花 ===== */
/* 前景：急浪（更尖的波峰、更短波长、更快） */
.pred-item.tide-peak.wave-type::before {
  height: 28px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 30 Q50 5 100 25 Q130 35 180 10 Q220 30 280 18 Q320 5 380 28 Q420 35 480 8 Q530 30 580 20 Q620 5 680 28 Q720 35 780 10 Q830 30 880 18 Q920 5 980 28 Q1020 35 1080 10 Q1140 30 1200 18 L1200 40 L0 40Z' fill='rgba(255%2C255%2C255%2C0.05)'/%3E%3C/svg%3E") repeat-x;
  background-size: 350px 28px;
  animation: chopWave 3.5s linear infinite;
}

/* 中景：涌浪（中速反向） */
.pred-item.tide-peak.wave-type::after {
  height: 20px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 25 Q60 8 120 22 Q160 32 220 12 Q280 28 340 15 Q400 5 460 25 Q520 32 580 12 Q640 28 700 15 Q760 5 820 25 Q880 32 940 12 Q1000 28 1060 15 Q1120 5 1200 25 L1200 40 L0 40Z' fill='rgba(255%2C255%2C255%2C0.035)'/%3E%3C/svg%3E") repeat-x;
  background-size: 280px 20px;
  animation: chopWave 5s linear infinite reverse;
}

/* 潮位：平滑缓慢 */
@keyframes tideSlide {
  0% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(16.5%) translateY(-2px); }
  100% { transform: translateX(33.33%) translateY(0); }
}

/* 海浪：快速+上下颠簸 */
@keyframes chopWave {
  0% { transform: translateX(0) translateY(0); }
  25% { transform: translateX(8.3%) translateY(-3px); }
  50% { transform: translateX(16.6%) translateY(1px); }
  75% { transform: translateX(25%) translateY(-2px); }
  100% { transform: translateX(33.33%) translateY(0); }
}

.pred-item.tide-peak i { font-size: 16px; }

/* 各颜色变体 - 潮位版（平滑波形） */
.pred-item.tide-peak.border-red {
  border-top: 1px solid rgba(220, 38, 38, 0.3);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.03));
}
.pred-item.tide-peak.border-red:not(.wave-type)::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 28 Q150 12 300 28 T600 28 T900 28 T1200 28 L1200 40 L0 40Z' fill='rgba(239%2C68%2C68%2C0.08)'/%3E%3C/svg%3E") repeat-x;
  background-size: 500px 24px;
}
.pred-item.tide-peak.border-red:not(.wave-type)::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 22 Q200 8 400 22 T800 22 T1200 22 L1200 40 L0 40Z' fill='rgba(239%2C68%2C68%2C0.05)'/%3E%3C/svg%3E") repeat-x;
  background-size: 400px 18px;
}
.pred-item.tide-peak.border-red.wave-type::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 30 Q50 5 100 25 Q130 35 180 10 Q220 30 280 18 Q320 5 380 28 Q420 35 480 8 Q530 30 580 20 Q620 5 680 28 Q720 35 780 10 Q830 30 880 18 Q920 5 980 28 Q1020 35 1080 10 Q1140 30 1200 18 L1200 40 L0 40Z' fill='rgba(239%2C68%2C68%2C0.1)'/%3E%3C/svg%3E") repeat-x;
  background-size: 350px 28px;
}
.pred-item.tide-peak.border-red.wave-type::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 25 Q60 8 120 22 Q160 32 220 12 Q280 28 340 15 Q400 5 460 25 Q520 32 580 12 Q640 28 700 15 Q760 5 820 25 Q880 32 940 12 Q1000 28 1060 15 Q1120 5 1200 25 L1200 40 L0 40Z' fill='rgba(239%2C68%2C68%2C0.06)'/%3E%3C/svg%3E") repeat-x;
  background-size: 280px 20px;
}
.pred-item.tide-peak.border-red i { color: #ef4444; }
.pred-item.tide-peak.border-red .pred-value.large { color: #f87171; }

.pred-item.tide-peak.border-orange {
  border-top: 1px solid rgba(234, 88, 12, 0.25);
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.02));
}
.pred-item.tide-peak.border-orange:not(.wave-type)::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 28 Q150 12 300 28 T600 28 T900 28 T1200 28 L1200 40 L0 40Z' fill='rgba(249%2C115%2C22%2C0.07)'/%3E%3C/svg%3E") repeat-x;
  background-size: 500px 24px;
}
.pred-item.tide-peak.border-orange:not(.wave-type)::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 22 Q200 8 400 22 T800 22 T1200 22 L1200 40 L0 40Z' fill='rgba(249%2C115%2C22%2C0.04)'/%3E%3C/svg%3E") repeat-x;
  background-size: 400px 18px;
}
.pred-item.tide-peak.border-orange.wave-type::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 30 Q50 5 100 25 Q130 35 180 10 Q220 30 280 18 Q320 5 380 28 Q420 35 480 8 Q530 30 580 20 Q620 5 680 28 Q720 35 780 10 Q830 30 880 18 Q920 5 980 28 Q1020 35 1080 10 Q1140 30 1200 18 L1200 40 L0 40Z' fill='rgba(249%2C115%2C22%2C0.09)'/%3E%3C/svg%3E") repeat-x;
  background-size: 350px 28px;
}
.pred-item.tide-peak.border-orange.wave-type::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 25 Q60 8 120 22 Q160 32 220 12 Q280 28 340 15 Q400 5 460 25 Q520 32 580 12 Q640 28 700 15 Q760 5 820 25 Q880 32 940 12 Q1000 28 1060 15 Q1120 5 1200 25 L1200 40 L0 40Z' fill='rgba(249%2C115%2C22%2C0.05)'/%3E%3C/svg%3E") repeat-x;
  background-size: 280px 20px;
}
.pred-item.tide-peak.border-orange i { color: #f97316; }
.pred-item.tide-peak.border-orange .pred-value.large { color: #fb923c; }

.pred-item.tide-peak.border-yellow {
  border-top: 1px solid rgba(202, 138, 4, 0.2);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(234, 179, 8, 0.02));
}
.pred-item.tide-peak.border-yellow:not(.wave-type)::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 28 Q150 12 300 28 T600 28 T900 28 T1200 28 L1200 40 L0 40Z' fill='rgba(234%2C179%2C8%2C0.06)'/%3E%3C/svg%3E") repeat-x;
  background-size: 500px 24px;
}
.pred-item.tide-peak.border-yellow:not(.wave-type)::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 22 Q200 8 400 22 T800 22 T1200 22 L1200 40 L0 40Z' fill='rgba(234%2C179%2C8%2C0.04)'/%3E%3C/svg%3E") repeat-x;
  background-size: 400px 18px;
}
.pred-item.tide-peak.border-yellow.wave-type::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 30 Q50 5 100 25 Q130 35 180 10 Q220 30 280 18 Q320 5 380 28 Q420 35 480 8 Q530 30 580 20 Q620 5 680 28 Q720 35 780 10 Q830 30 880 18 Q920 5 980 28 Q1020 35 1080 10 Q1140 30 1200 18 L1200 40 L0 40Z' fill='rgba(234%2C179%2C8%2C0.08)'/%3E%3C/svg%3E") repeat-x;
  background-size: 350px 28px;
}
.pred-item.tide-peak.border-yellow.wave-type::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 25 Q60 8 120 22 Q160 32 220 12 Q280 28 340 15 Q400 5 460 25 Q520 32 580 12 Q640 28 700 15 Q760 5 820 25 Q880 32 940 12 Q1000 28 1060 15 Q1120 5 1200 25 L1200 40 L0 40Z' fill='rgba(234%2C179%2C8%2C0.05)'/%3E%3C/svg%3E") repeat-x;
  background-size: 280px 20px;
}
.pred-item.tide-peak.border-yellow i { color: #eab308; }
.pred-item.tide-peak.border-yellow .pred-value.large { color: #facc15; }

.pred-item.tide-peak.border-blue {
  border-top: 1px solid rgba(37, 99, 235, 0.2);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02));
}
.pred-item.tide-peak.border-blue:not(.wave-type)::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 28 Q150 12 300 28 T600 28 T900 28 T1200 28 L1200 40 L0 40Z' fill='rgba(59%2C130%2C246%2C0.07)'/%3E%3C/svg%3E") repeat-x;
  background-size: 500px 24px;
}
.pred-item.tide-peak.border-blue:not(.wave-type)::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 22 Q200 8 400 22 T800 22 T1200 22 L1200 40 L0 40Z' fill='rgba(59%2C130%2C246%2C0.05)'/%3E%3C/svg%3E") repeat-x;
  background-size: 400px 18px;
}
.pred-item.tide-peak.border-blue.wave-type::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 30 Q50 5 100 25 Q130 35 180 10 Q220 30 280 18 Q320 5 380 28 Q420 35 480 8 Q530 30 580 20 Q620 5 680 28 Q720 35 780 10 Q830 30 880 18 Q920 5 980 28 Q1020 35 1080 10 Q1140 30 1200 18 L1200 40 L0 40Z' fill='rgba(59%2C130%2C246%2C0.09)'/%3E%3C/svg%3E") repeat-x;
  background-size: 350px 28px;
}
.pred-item.tide-peak.border-blue.wave-type::after {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 25 Q60 8 120 22 Q160 32 220 12 Q280 28 340 15 Q400 5 460 25 Q520 32 580 12 Q640 28 700 15 Q760 5 820 25 Q880 32 940 12 Q1000 28 1060 15 Q1120 5 1200 25 L1200 40 L0 40Z' fill='rgba(59%2C130%2C246%2C0.06)'/%3E%3C/svg%3E") repeat-x;
  background-size: 280px 20px;
}
.pred-item.tide-peak.border-blue i { color: #3b82f6; }
.pred-item.tide-peak.border-blue .pred-value.large { color: #60a5fa; }

.pred-extra {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: auto;
}

.over-text {
  font-size: 11px;
  color: var(--text-secondary);
}

.over-text strong { color: #f97316; }

/* 色标 */
.color-badge {
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 700;
  border: 1px solid;
}

.color-badge.red { background: rgba(220, 38, 38, 0.2); color: #ef4444; border-color: rgba(220, 38, 38, 0.4); }
.color-badge.orange { background: rgba(234, 88, 12, 0.2); color: #f97316; border-color: rgba(234, 88, 12, 0.4); }
.color-badge.yellow { background: rgba(202, 138, 4, 0.2); color: #eab308; border-color: rgba(202, 138, 4, 0.4); }
.color-badge.blue { background: rgba(37, 99, 235, 0.2); color: #3b82f6; border-color: rgba(37, 99, 235, 0.4); }

/* 观测数据行 */
.observed-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.02);
}

.obs-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.obs-item i {
  font-size: 10px;
  color: var(--text-muted);
}

.obs-label {
  color: var(--text-muted);
  font-size: 10px;
}

.obs-value {
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-display);
}

.dual-badge, .obs-badge, .forecast-badge {
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid;
}

.dual-badge {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.obs-badge {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.forecast-badge {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border-color: rgba(139, 92, 246, 0.3);
}

/* ===== 迷你 sparkline 趋势线 ===== */
.sparkline-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid var(--border-subtle);
}

.sparkline-svg {
  flex: 1;
  height: 36px;
  min-width: 0;
}

.sparkline-line {
  fill: none;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sparkline-red { stroke: #ef4444; }
.sparkline-orange { stroke: #f97316; }
.sparkline-yellow { stroke: #eab308; }
.sparkline-blue { stroke: #3b82f6; }

.sparkline-warning {
  stroke: rgba(239, 68, 68, 0.4);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

.sparkline-peak {
  fill: #ef4444;
  stroke: rgba(255, 255, 255, 0.6);
  stroke-width: 1;
}

.peak-red { fill: #ef4444; }
.peak-orange { fill: #f97316; }
.peak-yellow { fill: #eab308; }
.peak-blue { fill: #3b82f6; }

.sparkline-hint {
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ===== 卡片内展开/收起按钮 ===== */
.card-detail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  border-top: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s;
}

.card-detail-toggle:hover {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.06);
}

.card-detail-toggle i {
  font-size: 8px;
  transition: transform 0.2s;
}

/* ===== 卡片内嵌 ECharts 趋势图 ===== */
.card-chart-wrapper {
  border-top: 1px solid var(--border-subtle);
  padding: 4px 4px 0;
  background: rgba(0, 0, 0, 0.15);
}

.card-chart-container {
  width: 100%;
  height: 220px;
}

/* ===== 卡片内图表标签 ===== */
.card-chart-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 4px 8px;
}

.mini-tag {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
}

.mini-tag i {
  font-size: 8px;
}

.mini-tag.peak {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

.mini-tag.warning {
  background: rgba(234, 179, 8, 0.12);
  color: #fbbf24;
}

.mini-tag.surge {
  background: rgba(249, 115, 22, 0.12);
  color: #fb923c;
}

.mini-tag.direction {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;
}

/* ===== 详细趋势图折叠按钮 ===== */
.detail-chart-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  margin: 12px 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: #60a5fa;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  background: rgba(59, 130, 246, 0.06);
  transition: all 0.2s;
}

.detail-chart-toggle:hover {
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.12);
}

.detail-chart-toggle i {
  font-size: 10px;
  transition: transform 0.2s;
}

/* ===== 潮位趋势图区域 ===== */
.tide-chart-section {
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-title {
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 5px;
}

.station-select {
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  color: #60a5fa;
  font-size: 10px;
  cursor: pointer;
  outline: none;
}

.station-select:focus { border-color: #3b82f6; }
.station-select option { background: #1e293b; color: #fff; }

.chart-container {
  height: 180px;
  width: 100%;
  box-sizing: border-box;
}

/* 潮位标签 */
.tide-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tide-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 10px;
  border: 1px solid;
}

.tide-tag i { font-size: 9px; }
.tide-tag .tag-label { opacity: 0.8; }
.tide-tag .tag-value { font-weight: 600; }

.tide-tag.peak {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
}

.tide-tag.warning {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.tide-tag.surge {
  background: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.4);
  color: #fb923c;
}

/* 影响区域 */
.affected-areas-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: 8px;
}

.areas-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.areas-label i { color: #fb923c; }

.areas-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.area-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(251, 146, 60, 0.15);
  border: 1px solid rgba(251, 146, 60, 0.35);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: #fb923c;
  transition: background-color 0.2s ease;
}

.area-tag:hover { background: rgba(251, 146, 60, 0.25); }
.area-tag i { font-size: 9px; opacity: 0.8; }

/* ===== 海岸侵蚀 - 视频区域 ===== */
.video-container {
  margin-bottom: 10px;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a1628, #162a4a);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
}

.video-placeholder > i {
  font-size: 32px;
  color: rgba(251, 146, 60, 0.4);
}

.video-station-name {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.video-status {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-status.online {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.video-status.offline {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.video-station-bar {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.station-btn {
  flex: 1;
  padding: 5px 4px;
  font-size: 9px;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.station-btn i {
  font-size: 5px;
}

.station-btn i.online { color: #10b981; }
.station-btn i.offline { color: #6b7280; }

.station-btn:hover {
  background: rgba(251, 146, 60, 0.1);
  border-color: rgba(251, 146, 60, 0.3);
  color: var(--text-secondary);
}

.station-btn.active {
  background: rgba(251, 146, 60, 0.15);
  border-color: #fb923c;
  color: #fb923c;
}

.station-btn.offline {
  opacity: 0.5;
}

/* ===== 迷你指标卡片（通用） ===== */
.mini-indicators {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mini-card {
  padding: 10px;
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(20, 30, 50, 0.4));
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, background 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .disaster-panel,
  .disaster-body,
  .toggle-arrow,
  .data-card,
  .mini-card,
  .station-btn,
  .area-tag,
  .quality-fill,
  .progress-fill {
    transition: none !important;
  }
}

.mini-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s;
}

.mini-card.normal::before { background: #10b981; }
.mini-card.warn::before { background: #f59e0b; opacity: 1; }
.mini-card.alarm::before { background: #ef4444; opacity: 1; }

.mini-card.warn {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.03));
}

.mini-card.alarm {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.03));
}

.mini-label {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}

.mini-value {
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-display);
  color: #10b981;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
  line-height: 1;
}

.mini-card.warn .mini-value {
  color: #f59e0b;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.mini-card.alarm .mini-value {
  color: #ef4444;
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.mini-value .unit {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 2px;
  text-shadow: none;
}

.mini-threshold {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ===== 咸潮 - Sparkline ===== */
.sparkline-section {
  margin-top: 10px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 8px;
}

.sparkline-title {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.sparkline-container {
  height: 80px;
  width: 100%;
}

/* ===== 咸潮 - 取水口列表 ===== */
.intake-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.intake-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  font-size: 11px;
  transition: background 0.2s;
}

.intake-item:hover { background: rgba(255, 255, 255, 0.05); }

.intake-item.alarm { background: rgba(239, 68, 68, 0.06); }
.intake-item.warn { background: rgba(245, 158, 11, 0.04); }

.intake-name {
  flex: 1;
  color: var(--text-secondary);
  font-weight: 500;
}

.intake-value {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--text-primary);
}

.intake-value .unit {
  font-size: 9px;
  color: var(--text-muted);
  margin-left: 1px;
}

.intake-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid;
}

.intake-badge.normal {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

.intake-badge.warn {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.intake-badge.alarm {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

/* ===== 海水入侵 - 进度条 ===== */
.intrusion-info {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intrusion-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.intrusion-label {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 55px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22d3ee, #06b6d4);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.progress-fill.area {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.intrusion-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 50px;
  text-align: right;
  font-family: var(--font-display);
}

.intrusion-value .unit {
  font-size: 9px;
  font-weight: 400;
  color: var(--text-muted);
}

/* ===== 海水入侵 - 监测井列表 ===== */
.well-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.well-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s;
}

.well-item:hover { background: rgba(255, 255, 255, 0.05); }
.well-item.warn { background: rgba(245, 158, 11, 0.04); }

.well-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.well-dot.normal { background: #10b981; box-shadow: 0 0 4px rgba(16, 185, 129, 0.5); }
.well-dot.warn { background: #f59e0b; box-shadow: 0 0 4px rgba(245, 158, 11, 0.5); }
.well-dot.alarm { background: #ef4444; box-shadow: 0 0 4px rgba(239, 68, 68, 0.5); }

.well-name {
  flex: 1;
  color: var(--text-secondary);
}

.well-value {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--text-primary);
}

.well-value .unit {
  font-size: 9px;
  color: var(--text-muted);
  margin-left: 1px;
}

/* ===== 设备与数据统计 ===== */
.stats-section {
  background: rgba(30, 40, 60, 0.4);
  border-radius: 8px;
  padding: 12px;
  flex-shrink: 0;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
  margin-bottom: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.stat-mini {
  text-align: center;
  padding: 6px 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.stat-mini-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-mini-value .unit {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 1px;
}

.stat-mini-label {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 2px;
}

.stat-mini.online .stat-mini-value { color: #10b981; }
.stat-mini.alert .stat-mini-value { color: #ef4444; }
.stat-mini.data .stat-mini-value { color: #8b5cf6; }

.quality-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quality-label {
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
}

.quality-bar {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 2px;
  transition: width 0.5s;
}

.quality-value {
  font-size: 10px;
  font-weight: 600;
  color: #10b981;
  min-width: 35px;
  text-align: right;
}
</style>
