<template>
  <div class="historical-match">
    <!-- 当前台风信息 -->
    <div class="current-typhoon">
      <div class="typhoon-header">
        <div class="typhoon-name">
          <i class="fa-solid fa-hurricane"></i>
          {{ currentInfo.name }}
          <span class="category-badge">{{ currentInfo.category }}</span>
        </div>
        <div class="typhoon-stats">
          <span class="stat-item">
            <i class="fa-solid fa-wind"></i> {{ currentInfo.maxWindSpeed }}m/s
          </span>
          <span class="stat-item">
            <i class="fa-solid fa-gauge"></i> {{ currentInfo.minPressure }}hPa
          </span>
        </div>
      </div>
      <div class="landing-info">
        <div class="info-label">预计登陆</div>
        <div class="info-value">{{ currentInfo.landingLocation }} · {{ currentInfo.estimatedLanding }}</div>
      </div>
    </div>

    <!-- 匹配说明 -->
    <div class="match-hint">
      <i class="fa-solid fa-circle-info"></i>
      基于路径、强度、登陆点、气压等特征，为您匹配以下历史台风：
    </div>

    <!-- 历史台风列表 -->
    <div class="historical-list">
      <div
        v-for="(match, idx) in historicalMatches"
        :key="match.id"
        class="match-card"
        :class="{ 'high-match': match.similarity >= 0.9 }"
      >
        <!-- 标题栏 -->
        <div class="match-header" @click="toggleCard(idx)">
          <div class="match-title">
            <span class="match-rank">{{ idx + 1 }}</span>
            <span class="match-name">{{ match.year }} 台风"{{ match.name }}"</span>
            <span class="similarity-badge" :class="getSimilarityClass(match.similarity)">
              相似度 {{ (match.similarity * 100).toFixed(0) }}%
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
            {{ match.economicLoss }}亿元
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

            <!-- 伤亡情况 -->
            <div class="detail-section">
              <div class="section-label">
                <i class="fa-solid fa-heart-pulse"></i>
                伤亡情况
              </div>
              <div class="casualties-grid">
                <div class="casualty-item">
                  <span class="casualty-value deaths">{{ match.casualties.deaths }}</span>
                  <span class="casualty-label">死亡</span>
                </div>
                <div class="casualty-item">
                  <span class="casualty-value missing">{{ match.casualties.missing }}</span>
                  <span class="casualty-label">失踪</span>
                </div>
                <div class="casualty-item">
                  <span class="casualty-value injured">{{ match.casualties.injured }}</span>
                  <span class="casualty-label">受伤</span>
                </div>
              </div>
            </div>

            <!-- 灾害详情 -->
            <div class="detail-section">
              <div class="section-label">
                <i class="fa-solid fa-chart-line"></i>
                灾害详情
              </div>
              <div class="disaster-stats">
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
                <div class="stat-row">
                  <span class="stat-name">受灾人口</span>
                  <span class="stat-value">{{ formatNumber(match.details.affectedPopulation) }}人</span>
                </div>
              </div>
            </div>

            <!-- 登陆时间 -->
            <div class="landing-time">
              <i class="fa-solid fa-clock"></i>
              登陆时间：{{ match.landingTime }}
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockHistoricalMatches } from '../../data/mockData'

const expandedCards = ref([0]) // 默认展开第一个

const currentInfo = computed(() => mockHistoricalMatches.current)
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
  return num.toLocaleString()
}
</script>

<style scoped>
.historical-match {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 当前台风信息 */
.current-typhoon {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  padding: 12px;
}

.typhoon-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.typhoon-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.typhoon-name i {
  color: #f97316;
  font-size: 16px;
}

.category-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-weight: 600;
}

.typhoon-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.stat-item {
  font-size: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item i {
  color: #f97316;
  width: 12px;
}

.landing-info {
  border-top: 1px solid rgba(249, 115, 22, 0.2);
  padding-top: 8px;
}

.info-label {
  font-size: 9px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.info-value {
  font-size: 11px;
  color: var(--text-primary);
  font-weight: 500;
}

/* 匹配说明 */
.match-hint {
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
}

.match-hint i {
  color: #3b82f6;
  margin-top: 1px;
  flex-shrink: 0;
}

/* 历史台风列表 */
.historical-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.match-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.match-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.match-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.match-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.similarity-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
  margin-left: auto;
}

.similarity-badge.very-high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.similarity-badge.high {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.similarity-badge.medium {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.3s;
  margin-left: 8px;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* 基本信息 */
.match-brief {
  display: flex;
  gap: 12px;
  padding: 0 12px 10px 12px;
}

.brief-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-secondary);
}

.brief-item i {
  color: #eab308;
  width: 10px;
}

.brief-item.loss {
  margin-left: auto;
  color: #f97316;
  font-weight: 600;
}

/* 详细信息 */
.match-details {
  padding: 10px 12px;
  border-top: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
}

.detail-section {
  margin-bottom: 12px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.section-label i {
  color: #eab308;
  width: 12px;
}

/* 影响区域 */
.area-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.area-tag {
  font-size: 9px;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* 伤亡情况 */
.casualties-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.casualty-item {
  text-align: center;
  padding: 6px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.casualty-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-mono);
  margin-bottom: 2px;
}

.casualty-value.deaths {
  color: #ef4444;
}

.casualty-value.missing {
  color: #f59e0b;
}

.casualty-value.injured {
  color: #eab308;
}

.casualty-label {
  font-size: 9px;
  color: var(--text-muted);
}

/* 灾害详情 */
.disaster-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
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
  font-family: var(--font-mono);
}

/* 登陆时间 */
.landing-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.landing-time i {
  color: #3b82f6;
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
  max-height: 500px;
}
</style>
