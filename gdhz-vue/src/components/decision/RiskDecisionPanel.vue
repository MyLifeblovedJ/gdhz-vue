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
      <div class="risk-list-scroll" :class="{ 'no-scroll': riskDecisions.risks?.length <= 5 }">
        <div 
          v-for="risk in riskDecisions.risks" 
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
    
    <!-- 决策建议（精简版） -->
    <div class="decision-section">
      <div class="section-title">
        <i class="fa-solid fa-lightbulb"></i>
        决策建议
      </div>
      
      <!-- 建议应急响应等级 -->
      <div class="decision-row">
        <span class="decision-label">建议应急响应等级</span>
        <div class="response-badge" :class="getResponseClass(riskDecisions.recommendations?.responseLevel)">
          {{ riskDecisions.recommendations?.responseLevel }}级
        </div>
      </div>
      
      <!-- 建议应急响应方案 -->
      <div class="decision-row clickable" @click="showResponsePlan">
        <span class="decision-label">建议应急响应方案</span>
        <div class="decision-action">
          <span>查看方案</span>
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
      
      <!-- 建议决策辅助报告 -->
      <div class="decision-row clickable" @click="showDecisionReport">
        <span class="decision-label">建议决策辅助报告</span>
        <div class="decision-action">
          <span>查看报告</span>
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()

const riskDecisions = computed(() => store.riskDecisions)

// 风险统计
const highRiskCount = computed(() => 
  riskDecisions.value?.risks?.filter(r => r.level === 'high').length || 0
)
const mediumRiskCount = computed(() => 
  riskDecisions.value?.risks?.filter(r => r.level === 'medium').length || 0
)
const lowRiskCount = computed(() => 
  riskDecisions.value?.risks?.filter(r => r.level === 'low').length || 0
)

function getLevelText(level) {
  const texts = { high: '高', medium: '中', low: '低' }
  return texts[level] || level
}

function getResponseClass(level) {
  const classes = { I: 'level-1', II: 'level-2', III: 'level-3', IV: 'level-4' }
  return classes[level] || ''
}

function showResponsePlan() {
  // TODO: 打开应急响应方案弹窗
  console.log('打开应急响应方案')
  alert('应急响应方案：\n1. 启动防风防潮应急预案\n2. 组织沿海低洼地区人员转移\n3. 通知在海渔船回港避风\n4. 加强海堤巡查和应急值守\n5. 做好排涝泵站准备工作')
}

function showDecisionReport() {
  // TODO: 打开决策辅助报告弹窗
  console.log('打开决策辅助报告')
  alert('决策辅助报告功能开发中...')
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

/* 决策建议 */
.decision-section {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--border-subtle);
}

.decision-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.decision-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.decision-row:first-of-type {
  padding-top: 0;
}

.decision-row.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.decision-row.clickable:hover {
  background: rgba(0, 180, 230, 0.08);
  margin: 0 -12px;
  padding-left: 12px;
  padding-right: 12px;
}

.decision-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.response-badge {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
  color: #fff;
}

.response-badge.level-1 { background: linear-gradient(135deg, #EF4444, #DC2626); }
.response-badge.level-2 { background: linear-gradient(135deg, #F97316, #EA580C); }
.response-badge.level-3 { background: linear-gradient(135deg, #EAB308, #CA8A04); }
.response-badge.level-4 { background: linear-gradient(135deg, #3B82F6, #2563EB); }

.decision-action {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-cyan);
  font-size: 12px;
}

.decision-action i {
  font-size: 10px;
  transition: transform 0.2s;
}

.decision-row.clickable:hover .decision-action i {
  transform: translateX(3px);
}
</style>
