<template>
  <div class="decision-sidebar">
    <!-- 0. 当前预警（复用态势感知的组件） -->
    <SituationAlerts :alerts="displayAlerts" />

    <!-- 1. 海堤风险监测 -->
    <SeawallRiskMonitor
      @seawall-click="handleSeawallClick"
    />

    <!-- 2. 风险研判（动态模拟 + 静态评估） -->
    <RiskAssessmentPanel
      @play-animation="handlePlayAnimation"
      @risk-click="handleRiskClick"
      @evacuation-click="handleEvacuationClick"
      @vulnerability-click="handleVulnerabilityClick"
    />

    <!-- 3. 决策建议面板 -->
    <DecisionSuggestions />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import SituationAlerts from '../common/SituationAlerts.vue'
import RiskAssessmentPanel from '../decision/RiskAssessmentPanel.vue'
import SeawallRiskMonitor from '../decision/SeawallRiskMonitor.vue'
import DecisionSuggestions from '../decision/DecisionSuggestions.vue'

const store = useAppStore()

// 风浪潮相关预警过滤关键词
const seaConditionKeywords = ['风暴潮', '海浪', '潮位', '台风', '天文潮', '潮汐', '增水', '浪高']

// 过滤后的预警
const displayAlerts = computed(() => {
  return store.alerts.filter(alert => {
    const title = alert.title || ''
    return seaConditionKeywords.some(keyword => title.includes(keyword))
  })
})

const emit = defineEmits(['risk-click', 'evacuation-click', 'seawall-click', 'play-animation', 'vulnerability-click'])

function handleVulnerabilityClick(vulnerability) {
  emit('vulnerability-click', vulnerability)
}

function handleEvacuationClick(location) {
  emit('evacuation-click', location)
}

function handleRiskClick(risk) {
  emit('risk-click', risk)
}

function handleSeawallClick(seawall) {
  emit('seawall-click', seawall)
}

function handlePlayAnimation() {
  emit('play-animation')
}
</script>

<style scoped>
.decision-sidebar {
  width: 360px;
  height: 100%;
  flex-shrink: 0;
  background: var(--bg-deepest);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 50;
}

/* 侧边栏滚动条 */
.decision-sidebar::-webkit-scrollbar {
  width: 4px;
}

.decision-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.decision-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

.decision-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan);
}

/* ===== 预警面板样式由 SituationAlerts 组件提供 ===== */
</style>
