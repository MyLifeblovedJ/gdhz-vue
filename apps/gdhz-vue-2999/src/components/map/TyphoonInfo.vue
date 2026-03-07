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
          <div v-if="embedded" class="header-meta">更新时间 {{ formatTime(currentPoint?.time) }}</div>
        </div>
      </div>

      <div class="info-grid">
        <div v-if="!embedded" class="info-item">
          <div class="label">中心位置</div>
          <div class="value number-font">{{ formatCoord(currentPoint?.lng) }}°E / {{ formatCoord(currentPoint?.lat) }}°N</div>
        </div>
        <div v-if="!embedded" class="info-item">
          <div class="label">更新时间</div>
          <div class="value number-font">{{ formatTime(currentPoint?.time) }}</div>
        </div>
        <div class="info-item info-item--pressure">
          <div class="label">中心气压</div>
          <div class="value"><span class="number-font big">{{ currentPoint?.pressure ?? '--' }}</span><span class="unit">hPa</span></div>
        </div>
        <div class="info-item info-item--wind">
          <div class="label">最大风速</div>
          <div class="value"><span class="number-font big">{{ currentPoint?.windSpeed ?? '--' }}</span><span class="unit">m/s</span></div>
        </div>
      </div>

      <div class="typhoon-scroll-body">
        <div class="divider"></div>

        <div class="summary-grid">
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
        </div>

        <div class="history-reference" :class="{ expanded: historyExpanded }">
          <div class="history-ref-header" @click="historyExpanded = !historyExpanded">
            <div class="header-left">
              <i class="fa-solid fa-clock-rotate-left"></i>
              <div class="history-title-group">
                <span class="history-section-label">历史相似台风</span>
                <span v-if="embedded" class="history-match-name">{{ historicalComparison.matchName }}</span>
              </div>
            </div>
            <div class="header-right">
              <span class="similarity-badge">
                相似度 {{ (historicalComparison.similarity * 100).toFixed(0) }}%
              </span>
              <i class="fa-solid fa-chevron-down expand-icon"></i>
            </div>
          </div>

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

          <Transition name="slide-fade">
            <div v-if="historyExpanded" class="history-expanded-content">
              <div class="compare-hint">
                <i class="fa-solid fa-circle-info"></i>
                {{ historicalComparison.comparisonNote }}
              </div>

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
                  <div class="match-header" @click="toggleCard(idx)">
                    <div class="match-title">
                      <span class="match-rank">{{ idx + 1 }}</span>
                      <span class="match-name">{{ match.year }} 台风“{{ match.name }}”</span>
                      <span class="similarity-tag" :class="getSimilarityClass(match.similarity)">
                        {{ (match.similarity * 100).toFixed(0) }}%
                      </span>
                    </div>
                    <i class="fa-solid fa-chevron-down toggle-icon" :class="{ rotated: expandedCards.includes(idx) }"></i>
                  </div>

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
                      {{ match.economicLoss }}亿元</div>
                  </div>

                  <Transition name="slide-fade">
                    <div v-if="expandedCards.includes(idx)" class="match-details">
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

const historicalComparison = computed(() => mockAISummaryData.historicalComparison)
const historyExpanded = ref(false)
const expandedCards = ref([])
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
  --typhoon-surface: rgba(255, 255, 255, 0.76);
  --typhoon-soft: rgba(248, 250, 252, 0.92);
  --typhoon-border: rgba(15, 23, 42, 0.1);
  --typhoon-divider: rgba(15, 23, 42, 0.08);
  position: absolute;
  top: 82px;
  right: 388px;
  width: 320px;
  background: var(--typhoon-surface);
  backdrop-filter: blur(16px) saturate(1.08);
  -webkit-backdrop-filter: blur(16px) saturate(1.08);
  border: 1px solid rgba(239, 68, 68, 0.24);
  border-left: 4px solid #ef4444;
  border-radius: 10px;
  box-shadow: var(--shadow-panel);
  z-index: 1000;
  color: var(--text-secondary);
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
  height: 100%;
  min-height: 0;
  border-radius: 10px;
  margin-bottom: 0;
  box-shadow: none;
  background: rgba(255, 255, 255, 0.52);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.typhoon-icon {
  width: 48px;
  height: 48px;
  background: radial-gradient(circle at center, rgba(239, 68, 68, 0.16), transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.16);
  border-radius: 50%;
}

.fa-spin-slow {
  animation: fa-spin 4s infinite linear;
}

@keyframes fa-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.header-info {
  flex: 1;
}

.typhoon-id {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 3px;
}

.typhoon-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.typhoon-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.tag-red {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item--pressure,
.info-item--wind {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.72);
}

.info-item--pressure .label,
.info-item--wind .label {
  font-weight: 700;
}

.info-item--pressure .big {
  color: #2563eb;
}

.info-item--wind .big {
  color: #dc2626;
}

.info-item .label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.info-item .value {
  font-weight: 600;
  color: var(--text-secondary);
}

.number-font {
  font-family: var(--font-display, 'DIN Alternate', sans-serif);
}

.big {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.unit {
  font-size: 12px;
  margin-left: 3px;
  color: var(--text-muted);
}

.divider {
  height: 1px;
  background: var(--typhoon-divider);
  margin: 12px 0;
}

.typhoon-scroll-body {
  min-height: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.moving-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 92px;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid var(--typhoon-border);
  padding: 11px 12px;
  border-radius: 10px;
  gap: 10px;
}

.moving-info .label,
.forecast-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.moving-info .label {
  color: var(--text-secondary);
}

.moving-info .value {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-weight: 600;
  color: var(--text-primary);
}

.speed {
  color: #b45309;
}

.landing-forecast {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 92px;
  background: linear-gradient(90deg, rgba(220, 38, 38, 0.1), rgba(255, 255, 255, 0.72));
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 10px;
  padding: 11px 12px;
  gap: 10px;
}

.forecast-header {
  color: #dc2626;
}

.landing-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.landing-loc {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.landing-timer {
  font-size: 12px;
  color: var(--text-secondary);
}

.landing-timer .highlight {
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
  margin: 0 1px;
}

.landing-empty {
  font-size: 12px;
  color: var(--text-tertiary);
}

.history-reference {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.12);
}

.history-ref-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid var(--typhoon-border);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.history-ref-header:hover {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(13, 116, 144, 0.18);
}

.history-ref-header .header-left,
.history-ref-header .header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-ref-header .header-left {
  min-width: 0;
}

.history-ref-header .header-left i {
  color: var(--text-secondary);
  font-size: 13px;
}

.history-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.history-section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.history-match-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-ref-header .header-right {
  justify-self: end;
  flex-shrink: 0;
}

.history-ref-header .similarity-badge {
  padding: 4px 10px;
  background: rgba(234, 179, 8, 0.14);
  color: #b45309;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.history-ref-header .expand-icon {
  color: var(--text-muted);
  font-size: 11px;
  transition: transform 0.3s;
}

.history-reference.expanded .history-ref-header .expand-icon {
  transform: rotate(180deg);
}

.history-ref-summary {
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid var(--typhoon-border);
  border-radius: 10px;
  padding: 10px;
  margin-top: 8px;
}

.ref-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.ref-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.ref-factors .factor-tag {
  padding: 3px 8px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 999px;
  font-size: 11px;
  color: var(--text-secondary);
}

.ref-impacts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.ref-impacts .impact-item {
  text-align: center;
  padding: 7px 4px;
  background: var(--typhoon-soft);
  border-radius: 8px;
}

.ref-impacts .impact-value {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #b45309;
}

.ref-impacts .impact-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.history-expanded-content {
  margin-top: 10px;
}

.compare-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 9px 10px;
  background: rgba(59, 130, 246, 0.08);
  border-left: 2px solid #3b82f6;
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
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
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--typhoon-divider);
}

.historical-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match-card {
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid var(--typhoon-border);
  border-radius: 10px;
  overflow: hidden;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.match-card.high-match {
  border-color: rgba(234, 179, 8, 0.32);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(255, 255, 255, 0.62));
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.match-header:hover {
  background: rgba(15, 23, 42, 0.03);
}

.match-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.match-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(234, 179, 8, 0.16);
  color: #b45309;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.match-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.similarity-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
  margin-left: auto;
}

.similarity-tag.very-high {
  background: rgba(239, 68, 68, 0.14);
  color: #dc2626;
}

.similarity-tag.high {
  background: rgba(249, 115, 22, 0.14);
  color: #c2410c;
}

.similarity-tag.medium {
  background: rgba(234, 179, 8, 0.14);
  color: #b45309;
}

.match-card .toggle-icon {
  color: var(--text-muted);
  font-size: 11px;
  transition: transform 0.3s;
  margin-left: 6px;
}

.match-card .toggle-icon.rotated {
  transform: rotate(180deg);
}

.match-brief {
  display: flex;
  gap: 10px;
  padding: 0 10px 9px;
}

.brief-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.brief-item i {
  color: #b45309;
  width: 11px;
  font-size: 11px;
}

.brief-item.loss {
  margin-left: auto;
  color: #c2410c;
  font-weight: 700;
}

.match-details {
  padding: 10px;
  border-top: 1px solid var(--typhoon-divider);
  background: rgba(15, 23, 42, 0.02);
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
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.section-label i {
  color: #b45309;
  width: 11px;
  font-size: 11px;
}

.area-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.area-tags .area-tag {
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.18);
  border-radius: 999px;
  font-size: 11px;
  color: #2563eb;
}

.disaster-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 7px;
  background: rgba(255, 255, 255, 0.56);
  border-radius: 6px;
  font-size: 11px;
}

.stat-name {
  color: var(--text-tertiary);
}

.stat-value {
  color: var(--text-primary);
  font-weight: 700;
}

.stat-value.warn {
  color: #dc2626;
}

.landing-time {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--typhoon-divider);
}

.landing-time i {
  color: #2563eb;
  font-size: 11px;
}

.embedded .panel-header {
  margin-bottom: 14px;
}

.embedded .typhoon-scroll-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.embedded .typhoon-scroll-body::-webkit-scrollbar {
  width: 4px;
}

.embedded .typhoon-scroll-body::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.14);
  border-radius: 999px;
}

.embedded .typhoon-icon {
  width: 54px;
  height: 54px;
  font-size: 28px;
}

.embedded .typhoon-name {
  font-size: 18px;
}

.embedded .typhoon-id {
  font-size: 13px;
}

.embedded .header-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.embedded .tag-red {
  font-size: 12px;
  padding: 4px 9px;
}

.embedded .info-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.embedded .info-item {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid var(--typhoon-border);
  border-radius: 10px;
  gap: 4px;
}

.embedded .info-item--pressure,
.embedded .info-item--wind {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.86);
}

.embedded .info-item .label {
  font-size: 11px;
  letter-spacing: 0.02em;
}

.embedded .info-item .value {
  font-size: 13px;
}

.embedded .big {
  font-size: 20px;
}

.embedded .divider {
  display: none;
}

.embedded .summary-grid {
  gap: 8px;
  margin-bottom: 10px;
}

.embedded .moving-info {
  border-radius: 10px;
  padding: 10px 12px;
  min-height: 88px;
  gap: 8px;
}

.embedded .moving-info .label {
  font-size: 11px;
}

.embedded .moving-info .value {
  font-size: 14px;
}

.embedded .landing-forecast {
  border-radius: 10px;
  padding: 10px 12px;
  min-height: 88px;
  gap: 8px;
}

.embedded .forecast-header {
  font-size: 11px;
}

.embedded .landing-loc {
  font-size: 15px;
}

.embedded .history-ref-header {
  padding: 10px 14px;
  gap: 18px;
}

.embedded .history-ref-header .header-left {
  align-items: flex-start;
  gap: 12px;
}

.embedded .history-title-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.embedded .history-section-label {
  display: none;
}

.embedded .history-match-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.embedded .history-ref-header .header-left i {
  font-size: 14px;
}

.embedded .history-ref-header .similarity-badge {
  font-size: 12px;
  padding: 5px 12px;
}

.embedded .history-ref-summary {
  display: none;
  padding: 14px;
}

.embedded .history-reference.expanded .history-ref-summary {
  display: block;
  margin-top: 8px;
}

.embedded .ref-name {
  font-size: 15px;
}

.embedded .ref-factors .factor-tag {
  font-size: 11px;
  padding: 4px 10px;
}

.embedded .ref-impacts .impact-item {
  padding: 8px 6px;
}

.embedded .ref-impacts .impact-value {
  font-size: 16px;
}

.embedded .ref-impacts .impact-label {
  font-size: 11px;
}

.embedded .compare-hint {
  font-size: 11px;
  padding: 10px 14px;
}

.embedded .more-matches-header {
  font-size: 11px;
}

.embedded .history-expanded-content {
  margin-top: 8px;
}

.embedded .match-card {
  border-radius: 10px;
}

.embedded .match-header {
  padding: 10px 14px;
}

.embedded .match-rank {
  width: 22px;
  height: 22px;
  font-size: 11px;
}

.embedded .match-name {
  font-size: 13px;
}

.embedded .similarity-tag {
  font-size: 11px;
  padding: 3px 8px;
}

.embedded .match-brief {
  padding: 0 14px 10px;
  gap: 12px;
}

.embedded .brief-item {
  font-size: 11px;
}

.embedded .brief-item i {
  font-size: 11px;
}

.embedded .match-details {
  padding: 12px 14px;
}

.embedded .section-label {
  font-size: 11px;
  margin-bottom: 6px;
}

.embedded .disaster-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}

.embedded .stat-row {
  padding: 5px 8px;
  font-size: 11px;
}

.embedded .area-tags {
  gap: 6px;
}

.embedded .area-tags .area-tag {
  font-size: 11px;
  padding: 4px 10px;
}

.embedded .landing-time {
  font-size: 11px;
  margin-top: 8px;
  padding-top: 8px;
}
</style>



