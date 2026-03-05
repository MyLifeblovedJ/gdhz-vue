<template>
  <Transition name="slide-fade">
    <div v-if="typhoon" class="typhoon-info-panel" :class="{ embedded }">
      <div class="panel-header">
        <div class="typhoon-icon">
          <i class="fa-solid fa-hurricane fa-spin-slow"></i>
        </div>
        <div class="header-info">
          <div class="typhoon-id">{{ typhoon.id }}</div>
          <div class="typhoon-name-row">
            <span class="typhoon-name">{{ typhoon.name }} ({{ typhoon.enName }})</span>
            <span class="typhoon-category tag-red">{{ typhoon.category }}</span>
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">中心位置</div>
          <div class="value number-font">{{ formatCoord(currentPoint?.lng) }}°E / {{ formatCoord(currentPoint?.lat) }}°N</div>
        </div>
        <div class="info-item">
          <div class="label">更新时间</div>
          <div class="value number-font">{{ formatTime(currentPoint?.time) }}</div>
        </div>
        <div class="info-item">
          <div class="label">中心气压</div>
          <div class="value"><span class="number-font big">{{ currentPoint?.pressure ?? '--' }}</span><span class="unit">hPa</span></div>
        </div>
        <div class="info-item">
          <div class="label">风速风力</div>
          <div class="value"><span class="number-font big">{{ currentPoint?.windSpeed ?? '--' }}</span><span class="unit">m/s</span></div>
        </div>
      </div>


      <div class="divider"></div>

      <div class="moving-info">
        <div class="label">移速移向</div>
        <div class="value">
          <i class="fa-solid fa-arrow-up-long" :style="{ transform: 'rotate(-67deg)' }"></i>
          <span>{{ movementDirection }}</span>
          <span class="speed number-font">{{ movementSpeedText }}</span>
        </div>
      </div>

      <div class="landing-forecast">
        <div class="forecast-header"><i class="fa-solid fa-stopwatch"></i> 预计登陆</div>
        <div v-if="landfallPrediction" class="landing-details">
          <div class="landing-loc">{{ landfallPrediction.location || '--' }}</div>
          <div class="landing-timer">预计时间：<span class="highlight number-font">{{ formatTime(landfallPrediction.time) }}</span></div>
        </div>
        <div v-else class="landing-empty">暂无预计登陆点信息</div>
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
              相似度 {{ (historicalComparison.similarity * 100).toFixed(0) }}%
            </span>
            <i class="fa-solid fa-chevron-down expand-icon"></i>
          </div>
        </div>

        <!-- 摘要信息（始终显示） -->
        <div class="history-ref-summary">
          <div class="ref-name">{{ historicalComparison.matchName }}</div>
          <div class="ref-factors">
            <span v-for="(value, key) in historicalComparison.matchFactors" :key="key" class="factor-tag">
              {{ value }}
            </span>
          </div>
          <div class="ref-impacts">
            <div class="impact-item">
              <span class="impact-value">{{ historicalComparison.historicalImpact.economicLoss }}</span>
              <span class="impact-label">亿元损失</span>
            </div>
            <div class="impact-item">
              <span class="impact-value">{{ formatNumber(historicalComparison.historicalImpact.affectedPopulation) }}</span>
              <span class="impact-label">受灾人口</span>
            </div>
            <div class="impact-item">
              <span class="impact-value">{{ historicalComparison.historicalImpact.floodArea }}</span>
              <span class="impact-label">km²淹没</span>
            </div>
          </div>
        </div>

        <!-- 展开的详细内容 -->
        <Transition name="slide-fade">
          <div v-if="historyExpanded" class="history-expanded-content">
            <!-- 当前台风与历史对比提示 -->
            <div class="compare-hint">
              <i class="fa-solid fa-circle-info"></i>
              {{ historicalComparison.comparisonNote }}
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
                <Transition name="slide-fade">
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
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '../../stores/app'
import { mockHistoricalMatches } from '../../data/mockData'
import { mockAISummaryData } from '../../data/aiSummaryData'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
})

const store = useAppStore()
const typhoon = computed(() => store.typhoonData)

// 历史相似台风 - 摘要数据
const historicalComparison = computed(() => mockAISummaryData.historicalComparison)

// 历史相似台风 - 展开状态
const historyExpanded = ref(false)
const expandedCards = ref([])

// 历史台风匹配列表
const historicalMatches = computed(() => mockHistoricalMatches.matches)

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

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const currentPoint = computed(() => {
  if (!typhoon.value?.track?.length) return null
  return typhoon.value.track[typhoon.value.track.length - 1]
})

const movementDirection = computed(() => typhoon.value?.movement?.direction || '--')
const movementSpeedText = computed(() => {
  const speed = typhoon.value?.movement?.speedKmh
  return Number.isFinite(speed) ? `${speed} km/h` : '--'
})

const landfallPrediction = computed(() => typhoon.value?.landfallPrediction || null)

const radius7Text = computed(() => {
  const rangeText = typhoon.value?.windCircle?.radius7Range
  if (rangeText) return rangeText
  const v = typhoon.value?.windCircle?.radius7
  return Number.isFinite(v) ? String(v) : '--'
})

const radius10Text = computed(() => {
  const v = typhoon.value?.windCircle?.radius10
  return Number.isFinite(v) ? String(v) : '--'
})

const radius12Text = computed(() => {
  const v = typhoon.value?.windCircle?.radius12
  return Number.isFinite(v) ? String(v) : '--'
})

function formatTime(timeStr) {
  if (!timeStr) return '--:--'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCoord(value) {
  if (!Number.isFinite(value)) return '--'
  return Number(value).toFixed(2)
}
</script>

<style scoped>
.typhoon-info-panel {
  position: absolute;
  top: 82px;
  right: 388px;
  width: 320px;
  background: rgba(16, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 4px solid #ef4444;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  color: #fff;
  padding: 16px;
  font-size: 13px;
  overflow: hidden;
  transition: all 0.3s;
}

.typhoon-info-panel.embedded {
  position: relative;
  top: auto;
  right: auto;
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0;
  box-shadow: none;
  background: rgba(255, 255, 255, 0.05);
}

.panel-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.typhoon-icon {
  width: 48px; height: 48px;
  background: radial-gradient(circle at center, rgba(239, 68, 68, 0.2), transparent 70%);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 50%;
}
.fa-spin-slow { animation: fa-spin 4s infinite linear; }
@keyframes fa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.header-info { flex: 1; }
.typhoon-id { font-size: 12px; color: rgba(255, 255, 255, 0.6); }
.typhoon-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.typhoon-name { font-size: 16px; font-weight: 700; }
.tag-red { background: #dc2626; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: 600; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-item .label { font-size: 11px; color: rgba(255, 255, 255, 0.58); }
.info-item .value { font-weight: 500; color: #e2e8f0; }
.number-font { font-family: var(--font-display, 'DIN Alternate', sans-serif); }
.big { font-size: 18px; font-weight: 700; color: #fff; }
.unit { font-size: 11px; margin-left: 2px; color: rgba(255, 255, 255, 0.55); }

.wind-radius { display: grid; grid-template-columns: 1fr; gap: 4px; margin-bottom: 10px; }
.radius-item { font-size: 12px; color: rgba(226, 232, 240, 0.95); }

.divider { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 12px 0; }

.moving-info {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 10px; border-radius: 4px; margin-bottom: 12px;
}
.moving-info .value { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.speed { color: #fcd34d; }

.landing-forecast {
  background: linear-gradient(to right, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.05));
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 4px;
  padding: 10px;
}
.forecast-header { font-size: 11px; color: #ef4444; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
.landing-details { display: flex; justify-content: space-between; align-items: flex-end; }
.landing-loc { font-size: 14px; font-weight: 700; color: #fff; }
.landing-timer { font-size: 11px; color: rgba(255, 255, 255, 0.75); }
.landing-timer .highlight { color: #ef4444; font-size: 13px; font-weight: 700; margin: 0 1px; }
.landing-empty { font-size: 12px; color: rgba(226, 232, 240, 0.82); }

/* ========== 历史相似台风参考 ========== */
.history-reference {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 229, 255, 0.2);
}

.history-ref-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(0, 229, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-ref-header:hover {
  background: rgba(0, 229, 255, 0.1);
}

.history-ref-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-ref-header .header-left i {
  color: #00e5ff;
  font-size: 12px;
}

.history-ref-header .header-left span {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
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
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  transition: transform 0.3s;
}

.history-reference.expanded .history-ref-header .expand-icon {
  transform: rotate(180deg);
}

/* 摘要信息 */
.history-ref-summary {
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.15);
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
  color: rgba(255, 255, 255, 0.75);
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
  color: rgba(255, 255, 255, 0.4);
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
  color: rgba(255, 255, 255, 0.75);
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
  color: rgba(255, 255, 255, 0.4);
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
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  color: rgba(255, 255, 255, 0.9);
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
  color: rgba(255, 255, 255, 0.4);
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
  color: rgba(255, 255, 255, 0.65);
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
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 5px;
}

.section-label i {
  color: #eab308;
  width: 10px;
  font-size: 10px;
}

.area-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.area-tags .area-tag {
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 10px;
  font-size: 10px;
  color: #60a5fa;
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
  color: rgba(255, 255, 255, 0.4);
}

.stat-value {
  color: rgba(255, 255, 255, 0.9);
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
  color: rgba(255, 255, 255, 0.4);
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.landing-time i {
  color: #3b82f6;
  font-size: 10px;
}

/* ========== 首页嵌入式大屏适配 ========== */

/* 头部：更大图标和字号 */
.embedded .panel-header { margin-bottom: 14px; }
.embedded .typhoon-icon {
  width: 54px; height: 54px;
  font-size: 28px;
}
.embedded .typhoon-name { font-size: 18px; }
.embedded .typhoon-id { font-size: 13px; }
.embedded .tag-red { font-size: 11px; padding: 3px 8px; border-radius: 4px; }

/* 核心指标：4 列一行 */
.embedded .info-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.embedded .info-item {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  gap: 4px;
}
.embedded .info-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
.embedded .info-item .value { font-size: 13px; }
.embedded .big { font-size: 20px; }

/* 移速移向 + 预计登陆 横排 */
.embedded .divider { display: none; }
.embedded .moving-info {
  display: inline-flex;
  width: calc(40% - 5px);
  vertical-align: top;
  margin-right: 10px;
  margin-bottom: 0;
  border-radius: 8px;
  padding: 10px 12px;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.embedded .moving-info .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(255,255,255,0.5); }
.embedded .moving-info .value { font-size: 14px; }
.embedded .landing-forecast {
  display: inline-flex;
  flex-direction: column;
  width: calc(60% - 5px);
  vertical-align: top;
  border-radius: 8px;
  padding: 10px 12px;
}
.embedded .forecast-header { font-size: 12px; }
.embedded .landing-loc { font-size: 15px; }

/* 历史相似台风 - 更宽敞 */
.embedded .history-ref-header { padding: 10px 14px; border-radius: 10px; }
.embedded .history-ref-header .header-left span { font-size: 13px; }
.embedded .history-ref-header .header-left i { font-size: 14px; }
.embedded .history-ref-header .similarity-badge { font-size: 11px; padding: 4px 10px; }
.embedded .history-ref-summary { padding: 14px; border-radius: 10px; }
.embedded .ref-name { font-size: 15px; }
.embedded .ref-factors .factor-tag { font-size: 11px; padding: 3px 10px; }
.embedded .ref-impacts .impact-item { padding: 8px 6px; border-radius: 8px; }
.embedded .ref-impacts .impact-value { font-size: 16px; }
.embedded .ref-impacts .impact-label { font-size: 11px; }

/* 展开内容 */
.embedded .compare-hint { font-size: 11px; padding: 10px 14px; border-radius: 6px; }
.embedded .more-matches-header { font-size: 11px; }

/* 台风卡片 */
.embedded .match-card { border-radius: 10px; }
.embedded .match-header { padding: 10px 14px; }
.embedded .match-rank { width: 22px; height: 22px; font-size: 11px; }
.embedded .match-name { font-size: 13px; }
.embedded .similarity-tag { font-size: 11px; padding: 3px 8px; }

/* 简略信息 */
.embedded .match-brief { padding: 0 14px 10px; gap: 12px; }
.embedded .brief-item { font-size: 11px; gap: 4px; }
.embedded .brief-item i { font-size: 11px; }

/* 详细信息：2列stats */
.embedded .match-details { padding: 12px 14px; }
.embedded .section-label { font-size: 11px; margin-bottom: 6px; }
.embedded .disaster-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}
.embedded .stat-row { padding: 4px 8px; font-size: 11px; }
.embedded .area-tags { gap: 6px; }
.embedded .area-tags .area-tag { font-size: 11px; padding: 3px 10px; }
.embedded .landing-time { font-size: 11px; margin-top: 8px; padding-top: 8px; }
</style>
