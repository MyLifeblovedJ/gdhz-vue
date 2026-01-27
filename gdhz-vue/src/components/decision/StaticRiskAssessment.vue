<template>
  <div class="panel static-risk-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header" @click="isCollapsed = !isCollapsed">
      <div class="panel-title">
        <i class="fa-solid fa-database"></i>
        静态风险研判
        <span class="source-badge">灾普数据</span>
      </div>
      <i class="fa-solid fa-chevron-down toggle-icon"></i>
    </div>

    <div class="panel-content">
      <!-- 当前匹配场景 -->
      <div class="scenario-match">
        <div class="scenario-header">
          <span class="scenario-label">当前台风强度:</span>
          <span class="scenario-value">{{ currentPressure }} hPa</span>
        </div>
        <div class="scenario-matched">
          <i class="fa-solid fa-check-circle"></i>
          匹配场景: {{ matchedScenario.label }}
        </div>
      </div>

      <!-- 预计影响范围 -->
      <div class="impact-summary">
        <div class="impact-title">
          <i class="fa-solid fa-map-location-dot"></i>
          预计影响范围
        </div>
        <div class="impact-stats">
          <div class="impact-stat">
            <span class="stat-value">{{ matchedScenario.floodArea }}</span>
            <span class="stat-label">km² 淹没面积</span>
          </div>
          <div class="impact-stat">
            <span class="stat-value">{{ matchedScenario.affectedTowns }}</span>
            <span class="stat-label">个镇街</span>
          </div>
        </div>
      </div>

      <!-- 承灾体影响评估 -->
      <div class="vulnerability-section">
        <div class="section-title">
          <i class="fa-solid fa-house-crack"></i>
          承灾体影响评估
        </div>
        <div class="vulnerability-list">
          <div
            v-for="item in vulnerabilitySummary"
            :key="item.type"
            class="vulnerability-item"
            :class="{ clickable: item.clickable }"
            @click="item.clickable && handleVulnerabilityClick(item)"
          >
            <i :class="item.icon"></i>
            <span class="vuln-name">{{ item.name }}</span>
            <span class="vuln-count">{{ item.count }}{{ item.unit }}</span>
            <span v-if="item.extra" class="vuln-extra">{{ item.extra }}</span>
            <i v-if="item.warning" class="fa-solid fa-triangle-exclamation warning-icon"></i>
          </div>
        </div>
      </div>

      <!-- 潜在损失估算 -->
      <div class="loss-estimation">
        <div class="section-title">
          <i class="fa-solid fa-coins"></i>
          潜在损失估算
        </div>
        <div class="loss-items">
          <div class="loss-item">
            <span class="loss-label">直接经济损失</span>
            <span class="loss-value">约 {{ estimatedLoss.economic }} 亿元</span>
          </div>
          <div class="loss-item">
            <span class="loss-label">受影响人口</span>
            <span class="loss-value">约 {{ estimatedLoss.population }} 万人</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockDisasterCensusData } from '../../data/seaConditionData'

const isCollapsed = ref(true)
const currentPressure = ref(958)  // 当前台风中心气压

const emit = defineEmits(['vulnerability-click', 'evacuation-click'])

// 匹配气压场景
const matchedScenario = computed(() => {
  const pressure = currentPressure.value
  if (pressure <= 855) return mockDisasterCensusData.pressureScenarios['845-855']
  if (pressure <= 875) return mockDisasterCensusData.pressureScenarios['855-875']
  if (pressure <= 895) return mockDisasterCensusData.pressureScenarios['875-895']
  if (pressure <= 920) return mockDisasterCensusData.pressureScenarios['895-920']
  if (pressure <= 950) return mockDisasterCensusData.pressureScenarios['920-950']
  return mockDisasterCensusData.pressureScenarios['950-980']
})

// 承灾体汇总
const vulnerabilitySummary = computed(() => {
  const v = mockDisasterCensusData.vulnerabilities
  return [
    {
      type: 'population',
      name: '人口聚集区',
      icon: 'fa-solid fa-users',
      count: v.populationCenters.length,
      unit: '处',
      extra: `${(v.populationCenters.reduce((sum, p) => sum + p.population, 0) / 10000).toFixed(1)}万人`,
      clickable: true,
      data: v.populationCenters,
    },
    {
      type: 'tourist',
      name: '滨海旅游区',
      icon: 'fa-solid fa-umbrella-beach',
      count: v.touristAreas.length,
      unit: '处',
      clickable: true,
      data: v.touristAreas,
    },
    {
      type: 'fishingPort',
      name: '渔港',
      icon: 'fa-solid fa-anchor',
      count: v.fishingPorts.length,
      unit: '处',
      extra: `${v.fishingPorts.reduce((sum, p) => sum + p.vessels, 0)}艘船`,
      clickable: true,
      data: v.fishingPorts,
    },
    {
      type: 'aquaculture',
      name: '海水养殖区',
      icon: 'fa-solid fa-fish',
      count: v.aquaculture.reduce((sum, a) => sum + a.area, 0),
      unit: '亩',
      clickable: true,
      data: v.aquaculture,
    },
    {
      type: 'seawall',
      name: '海堤风险段',
      icon: 'fa-solid fa-shield-halved',
      count: 6,
      unit: '处',
      warning: true,
      clickable: false,
    },
  ]
})

// 损失估算（简化计算）
const estimatedLoss = computed(() => ({
  economic: 2.3,
  population: 15.6,
}))

function handleVulnerabilityClick(item) {
  if (item.type === 'population') {
    // 人口聚集区点击触发疏散路径
    emit('evacuation-click', item.data[0])
  } else {
    emit('vulnerability-click', item)
  }
}
</script>

<style scoped>
.static-risk-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  flex-shrink: 0;
}

.static-risk-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #f59e0b 30%, #f59e0b 70%, transparent);
  opacity: 0.6;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.panel-header:hover {
  background: var(--bg-hover);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-badge {
  font-size: 9px;
  padding: 2px 6px;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-radius: 4px;
  font-weight: 500;
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.2s;
}

.static-risk-panel.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.panel-content {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow: hidden;
  transition: max-height 0.3s, padding 0.3s;
}

.static-risk-panel.collapsed .panel-content {
  max-height: 0;
  padding: 0 12px;
}

/* 场景匹配 */
.scenario-match {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 10px;
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.scenario-label {
  font-size: 11px;
  color: var(--text-muted);
}

.scenario-value {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
  font-family: var(--font-mono);
}

.scenario-matched {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.scenario-matched i {
  color: #10b981;
}

/* 影响范围 */
.impact-summary {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px;
}

.impact-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.impact-stats {
  display: flex;
  gap: 16px;
}

.impact-stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
}

/* 承灾体列表 */
.vulnerability-section {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 10px;
}

.section-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vulnerability-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vulnerability-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.vulnerability-item.clickable {
  cursor: pointer;
}

.vulnerability-item.clickable:hover {
  background: rgba(245, 158, 11, 0.1);
  transform: translateX(4px);
}

.vulnerability-item i:first-child {
  width: 16px;
  text-align: center;
  color: var(--accent-cyan);
}

.vuln-name {
  flex: 1;
  color: var(--text-secondary);
}

.vuln-count {
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.vuln-extra {
  font-size: 10px;
  color: var(--text-muted);
}

.warning-icon {
  color: #ef4444 !important;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 损失估算 */
.loss-estimation {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 10px;
}

.loss-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.loss-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.loss-label {
  color: var(--text-muted);
}

.loss-value {
  color: #f87171;
  font-weight: 600;
}
</style>
