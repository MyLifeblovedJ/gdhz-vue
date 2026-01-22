<template>
  <div class="risk-decision-panel">
    <!-- 风险统计概览（聚光灯效果） -->
    <div class="risk-stats-row">
      <div class="risk-stat high" style="--glow-color: #EF4444;">
        <div class="light-holder">
          <div class="dot"></div>
          <div class="light"></div>
        </div>
        <div class="stat-num">{{ highRiskCount }}</div>
        <div class="stat-text">高风险</div>
        <div class="bottom-arc"></div>
      </div>
      <div class="risk-stat medium" style="--glow-color: #F97316;">
        <div class="light-holder">
          <div class="dot"></div>
          <div class="light"></div>
        </div>
        <div class="stat-num">{{ mediumRiskCount }}</div>
        <div class="stat-text">中风险</div>
        <div class="bottom-arc"></div>
      </div>
      <div class="risk-stat low" style="--glow-color: #EAB308;">
        <div class="light-holder">
          <div class="dot"></div>
          <div class="light"></div>
        </div>
        <div class="stat-num">{{ lowRiskCount }}</div>
        <div class="stat-text">低风险</div>
        <div class="bottom-arc"></div>
      </div>
    </div>
    
    <!-- 风险列表（默认显示5个，超过才滚动） -->
    <div class="risk-list">
      <div class="section-title">
        <i class="fa-solid fa-bolt"></i>
        重点风险
      </div>
      <div class="risk-list-scroll" :class="{ 'no-scroll': filteredRiskDecisions.risks?.length <= 5 }">
        <div
          v-for="risk in filteredRiskDecisions.risks"
          :key="risk.id"
          class="risk-item"
          :class="risk.level"
        >
          <div class="risk-header">
            <span class="risk-level-badge" :class="risk.level">
              {{ getLevelText(risk.level) }}
            </span>
            <span class="risk-title">{{ risk.title }}</span>
          </div>
          <div class="risk-location">
            <i class="fa-solid fa-location-dot"></i>
            {{ risk.location }}
          </div>
          <div class="risk-description">{{ risk.description }}</div>
          <div class="risk-impact" v-if="risk.affectedPop || risk.affectedArea || risk.affectedVessels">
            <span v-if="risk.affectedPop">
              <i class="fa-solid fa-users"></i> {{ risk.affectedPop }}
            </span>
            <span v-if="risk.affectedArea">
              <i class="fa-solid fa-seedling"></i> {{ risk.affectedArea }}
            </span>
            <span v-if="risk.affectedVessels">
              <i class="fa-solid fa-ship"></i> {{ risk.affectedVessels }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

// Props
const props = defineProps({
  // 灾害类型过滤，如 'surge'、'wave' 等，为空或 'all' 时显示全部
  disasterType: {
    type: String,
    default: ''
  }
})

const store = useAppStore()

// 各灾害类型对应的风险类型映射
const disasterRiskTypes = {
  surge: ['dike_overflow', 'seawater_backflow', 'vessel_safety', 'infrastructure', 'flooding', 'saltification'],
  wave: ['vessel_safety', 'coastal_erosion', 'infrastructure', 'offshore_platform'],
  redtide: ['aquaculture', 'water_quality', 'ecosystem', 'tourism'],
  tsunami: ['coastal_flooding', 'infrastructure', 'vessel_safety', 'evacuation'],
  erosion: ['coastal_erosion', 'infrastructure', 'land_loss'],
}

// 根据灾害类型过滤风险数据
const filteredRiskDecisions = computed(() => {
  const originalData = store.riskDecisions
  if (!originalData?.risks) return originalData

  // 如果没有指定灾害类型或为 'all'，显示全部
  if (!props.disasterType || props.disasterType === 'all') {
    return originalData
  }

  // 获取该灾害类型对应的风险类型列表
  const allowedRiskTypes = disasterRiskTypes[props.disasterType] || []

  // 过滤风险列表
  const filteredRisks = originalData.risks.filter(risk =>
    allowedRiskTypes.includes(risk.type)
  )

  return {
    ...originalData,
    risks: filteredRisks
  }
})

// 风险统计（基于过滤后的数据）
const highRiskCount = computed(() =>
  filteredRiskDecisions.value?.risks?.filter(r => r.level === 'high').length || 0
)
const mediumRiskCount = computed(() =>
  filteredRiskDecisions.value?.risks?.filter(r => r.level === 'medium').length || 0
)
const lowRiskCount = computed(() =>
  filteredRiskDecisions.value?.risks?.filter(r => r.level === 'low').length || 0
)

function getLevelText(level) {
  const texts = { high: '高', medium: '中', low: '低' }
  return texts[level] || level
}

</script>

<style scoped>
.risk-decision-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 12px;
}

/* 风险统计（聚光灯效果） */
.risk-stats-row {
  display: flex;
  gap: 8px;
  padding: 10px 8px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.risk-stat {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 18px 0;
  transition: all 0.3s ease;
  z-index: 1;
}

/* 聚光灯效果 */
.risk-stat .light-holder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 0;
}

.risk-stat .light-holder .dot {
  width: 14px;
  height: 3px;
  background-color: var(--glow-color);
  border-radius: 2px;
  box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color);
  opacity: 1;
  z-index: 2;
}

.risk-stat .light-holder .light {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 130%;
  height: 95%;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  background: radial-gradient(
    ellipse at center top,
    color-mix(in srgb, var(--glow-color) 80%, transparent) 0%,
    color-mix(in srgb, var(--glow-color) 40%, transparent) 40%,
    color-mix(in srgb, var(--glow-color) 15%, transparent) 70%,
    transparent 100%
  );
  opacity: 0.8;
  filter: blur(12px);
  z-index: 1;
}

.stat-num {
  position: relative;
  z-index: 2;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 0 25px color-mix(in srgb, var(--glow-color) 90%, transparent),
               0 0 45px color-mix(in srgb, var(--glow-color) 50%, transparent);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-top: 2px;
  line-height: 1;
}

.stat-text {
  position: relative;
  z-index: 2;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  margin-top: 4px;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.bottom-arc {
  position: absolute;
  bottom: 0;
  width: 80%;
  height: 4px;
  background: var(--glow-color);
  border-radius: 50% / 100% 100% 0 0;
  box-shadow: 0 0 20px var(--glow-color), 
              0 0 40px var(--glow-color),
              0 -4px 12px color-mix(in srgb, var(--glow-color) 70%, transparent);
  opacity: 1;
  filter: blur(0.2px);
}

.risk-stat:hover .stat-num {
  transform: scale(1.1);
  text-shadow: 0 0 35px var(--glow-color), 0 0 60px var(--glow-color);
}

.risk-stat:hover .stat-text {
  transform: translateY(-2px);
  text-shadow: 0 0 20px #fff;
}

.risk-stat:hover .bottom-arc {
  width: 90%;
  height: 5px;
  box-shadow: 0 0 30px var(--glow-color), 
              0 0 55px var(--glow-color),
              0 -6px 18px var(--glow-color);
}

/* 风险列表 */
.section-title {
  font-weight: 600;
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.risk-list-scroll {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.risk-list-scroll.no-scroll {
  max-height: none;
  overflow: visible;
}

.risk-list-scroll::-webkit-scrollbar {
  width: 4px;
}

.risk-list-scroll::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
}

.risk-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(2px);
  border-left-color: rgba(255, 255, 255, 0.3);
}

.risk-item.selected {
  background: linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, transparent 100%);
  border-left-color: var(--accent-cyan);
  box-shadow: inset 0 0 20px rgba(6, 182, 212, 0.05);
}

.risk-item.selected .risk-title {
  color: var(--accent-cyan);
}

.risk-item {
  background: var(--bg-card);
  border-radius: 6px;
  padding: 10px;
  border-left: 3px solid;
}

.risk-item.high { border-left-color: #EF4444; }
.risk-item.medium { border-left-color: #F97316; }
.risk-item.low { border-left-color: #EAB308; }

.risk-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.risk-level-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  color: #fff;
}

.risk-level-badge.high { background: #EF4444; }
.risk-level-badge.medium { background: #F97316; }
.risk-level-badge.low { background: #EAB308; }

.risk-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 12px;
}

.risk-location {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.risk-location i {
  margin-right: 3px;
}

.risk-description {
  color: var(--text-secondary);
  line-height: 1.4;
  font-size: 11px;
}

.risk-impact {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 10px;
  color: var(--text-muted);
}

.risk-impact span {
  display: flex;
  align-items: center;
  gap: 4px;
}

</style>
