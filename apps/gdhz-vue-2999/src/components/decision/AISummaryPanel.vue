<template>
  <div class="ai-summary-panel" :class="riskLevelClass">
    <!-- Header: 总体研判 -->
    <div class="panel-header">
      <div class="header-left">
        <div class="ai-icon-wrapper">
          <i class="fa-solid fa-robot"></i>
        </div>
        <span class="panel-title">AI 智能研判</span>
      </div>
      <div class="risk-badge">
        {{ summary.riskTitle }}
      </div>
    </div>

    <!-- Scrollable Content with Logic Chain -->
    <div class="panel-content custom-scroll">
      
      <!-- 1. 发生背景 (Context) -->
      <div class="logic-section context">
        <div class="section-title">
          <i class="fa-solid fa-cloud-bolt"></i> 发生背景
        </div>
        <div class="typhoon-card">
          <div class="typhoon-header">
            <span class="typhoon-name">{{ typhoon.name }} ({{ typhoon.level }})</span>
            <span class="typhoon-id">#{{ typhoon.id }}</span>
          </div>
          <div class="typhoon-detail">
            <div><i class="fa-solid fa-location-arrow"></i> {{ typhoon.location }}</div>
            <div><i class="fa-solid fa-arrow-trend-up"></i> {{ typhoon.trend }}</div>
            <div class="landfall-predict">
              <i class="fa-solid fa-bullseye"></i> {{ typhoon.landfallPrediction }}
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 发展趋势 (Trend) -->
      <div class="logic-section trend">
        <div class="section-title">
          <i class="fa-solid fa-chart-line"></i> 发展趋势
        </div>
        <div class="trend-analysis">
          <div class="tide-status">
            <span class="tag">天文潮状态</span>
            <span class="value">{{ tideAnalysis.astronomicalState }}</span>
          </div>
          <div class="overlay-warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            {{ tideAnalysis.description }}
          </div>
        </div>
      </div>

      <!-- 3. 重点影响 (Impact) -->
      <div class="logic-section impact">
        <div class="section-title">
          <i class="fa-solid fa-house-tsunami"></i> 重点影响
        </div>
        <div class="impact-grid">
          <!-- Max Surge -->
          <div class="impact-item surge">
            <div class="impact-label">最大风暴增水</div>
            <div class="impact-val">{{ impact.surge?.maxLevel }}<small>m</small></div>
            <div class="impact-loc">
              <i class="fa-solid fa-location-dot"></i> {{ impact.surge?.maxStation }}
            </div>
            <div class="impact-sub">超警 {{ impact.surge?.overAlert }}m</div>
          </div>
          <!-- Max Wave -->
          <div class="impact-item wave">
            <div class="impact-label">最高海浪</div>
            <div class="impact-val">{{ impact.wave?.maxHeight }}<small>m</small></div>
            <div class="impact-loc">
              <i class="fa-solid fa-location-dot"></i> {{ impact.wave?.maxArea }}
            </div>
            <div class="impact-sub">{{ impact.wave?.direction }}</div>
          </div>
        </div>
      </div>

      <!-- 4. 重点关注 (Vulnerability) -->
      <div class="logic-section focus">
        <div class="section-title">
          <i class="fa-solid fa-crosshairs"></i> 重点关注承灾体
        </div>
        <div class="vulnerable-list">
          <div 
            v-for="(obj, index) in vulnerableObjects" 
            :key="index"
            class="vulnerable-item"
          >
            <div class="obj-header">
              <span class="obj-name">{{ obj.name }}</span>
              <span class="obj-risk-badge">{{ obj.risk }}</span>
            </div>
            <div class="obj-detail">{{ obj.detail }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { mockAISummary } from '../../data/seaConditionData'

const summary = computed(() => mockAISummary || {})
const typhoon = computed(() => summary.value.typhoonContext || {})
const tideAnalysis = computed(() => summary.value.tideAnalysis || {})
const impact = computed(() => summary.value.impactData || {})
const vulnerableObjects = computed(() => summary.value.vulnerableObjects || [])

const riskLevelClass = computed(() => {
  return summary.value.overallRisk ? `risk-${summary.value.overallRisk}` : 'risk-medium'
})

onMounted(() => {
  console.log('AI Logic Chain Panel mounted')
})
</script>

<style scoped>
.ai-summary-panel {
  /* Panel Container */
  background: rgba(17, 24, 39, 0.85); /* Slightly darker for better readability */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 100%; /* Adapt to parent */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

/* Border Glows */
.risk-critical { border: 1px solid rgba(239, 68, 68, 0.6); box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
.risk-high { border: 1px solid rgba(245, 158, 11, 0.6); }

/* Header */
.panel-header {
  padding: 10px 14px;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 8px; }
.ai-icon-wrapper {
  width: 22px; height: 22px; border-radius: 6px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: white;
}
.panel-title { font-weight: 600; font-size: 14px; color: #f8fafc; letter-spacing: 0.5px; }

.risk-badge {
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(239, 68, 68, 0.2); color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
  animation: pulse 2s infinite;
}

/* Scrollable Content */
.panel-content {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

/* Logic Sections */
.logic-section { display: flex; flex-direction: column; gap: 8px; }
.section-title {
  font-size: 12px; font-weight: 600; color: #94a3b8;
  display: flex; align-items: center; gap: 6px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.section-title i { color: #60a5fa; }

/* 1. Context (Typhoon) */
.typhoon-card {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px; padding: 10px;
  border-left: 3px solid #3b82f6;
}
.typhoon-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.typhoon-name { font-weight: 700; color: #fff; font-size: 13px; }
.typhoon-id { font-family: monospace; color: #93c5fd; background: rgba(0,0,0,0.2); padding: 0 4px; border-radius: 2px; }
.typhoon-detail { font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; }
.landfall-predict { color: #fca5a5; margin-top: 2px; font-weight: 500; }

/* 2. Trend */
.trend-analysis {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px; padding: 10px;
}
.tide-status { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
.tide-status .tag { color: #94a3b8; }
.tide-status .value { color: #fcd34d; font-weight: 600; }
.overlay-warning {
  font-size: 11px; line-height: 1.4; color: #e2e8f0;
  display: flex; gap: 6px;
}
.overlay-warning i { color: #f59e0b; margin-top: 2px; }

/* 3. Impact Grid */
.impact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.impact-item {
  background: rgba(0,0,0,0.2);
  border-radius: 8px; padding: 8px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.impact-label { font-size: 10px; color: #94a3b8; margin-bottom: 4px; }
.impact-val { font-size: 16px; font-weight: 700; color: #fff; font-family: 'Bahnschrift', sans-serif; }
.impact-val small { font-size: 10px; font-weight: 400; color: #94a3b8; margin-left: 2px; }
.impact-loc { font-size: 10px; color: #cbd5e1; margin-top: 2px; display: flex; align-items: center; gap: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.impact-sub { font-size: 9px; margin-top: 2px; opacity: 0.8; }
.impact-item.surge .impact-val { color: #fca5a5; }
.impact-item.surge .impact-sub { color: #fca5a5; }
.impact-item.wave .impact-val { color: #93c5fd; }
.impact-item.wave .impact-sub { color: #93c5fd; }

/* 4. Vulnerable Objects */
.vulnerable-list { display: flex; flex-direction: column; gap: 6px; }
.vulnerable-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px; padding: 8px;
}
.obj-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.obj-name { font-size: 12px; font-weight: 600; color: #e2e8f0; }
.obj-risk-badge { font-size: 10px; padding: 1px 5px; border-radius: 3px; background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.obj-detail { font-size: 11px; color: #94a3b8; line-height: 1.3; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
</style>
