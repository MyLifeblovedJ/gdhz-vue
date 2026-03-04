<template>
  <div class="panel risk-assessment-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header" @click="isCollapsed = !isCollapsed">
      <div class="panel-title">
        <i class="fa-solid fa-scale-balanced"></i>
        风险研判
      </div>
      <i class="fa-solid fa-chevron-down toggle-icon" :class="{ rotated: !isCollapsed }"></i>
    </div>

    <div class="panel-content" v-show="!isCollapsed">
      <!-- 模式切换 -->
      <div class="mode-switch">
        <div 
          class="switch-item" 
          :class="{ active: currentMode === 'dynamic' }"
          @click="currentMode = 'dynamic'"
        >
          <i class="fa-solid fa-water"></i>
          动态模拟
          <span class="badge-new">NEW</span>
        </div>
        <div 
          class="switch-item" 
          :class="{ active: currentMode === 'static' }"
          @click="currentMode = 'static'"
        >
          <i class="fa-solid fa-database"></i>
          静态研判
        </div>
      </div>

      <!-- 统一内容区，带有淡入动画 -->
      <div :key="currentMode" class="fade-in content-area">
        <!-- 头部信息 -->
        <div class="info-card highlight">
          <div class="row-between">
            <span class="label">模拟/研判标题</span>
            <span class="value highlight-text">{{ displayData.title }}</span>
          </div>
          <div class="row-between mt-1">
            <span class="label">时段/数据源</span>
            <span class="value">{{ displayData.timeRange }}</span>
          </div>
        </div>

        <!-- 关键指标 (4宫格) -->
        <div class="metrics-grid">
          <div class="metric-box box-red">
            <div class="metric-val">{{ displayData.metrics.area }}<span class="unit">km²</span></div>
            <div class="metric-label">最大淹没范围</div>
          </div>
          <div class="metric-box box-orange">
            <div class="metric-val">{{ displayData.metrics.depth }}<span class="unit">m</span></div>
            <div class="metric-label">最大水深</div>
          </div>
          <div class="metric-box box-yellow">
            <div class="metric-val">{{ displayData.metrics.duration }}<span class="unit">h</span></div>
            <div class="metric-label">持续时长</div>
          </div>
          <div class="metric-box box-blue">
            <div class="metric-val">{{ displayData.metrics.affected || displayData.metrics.affectedTowns }}<span class="unit">
              {{ displayData.mode === 'static' ? '个' : '万人' }}
            </span></div>
            <div class="metric-label text-truncate">{{ displayData.mode === 'static' ? '受影响镇街' : '受影响人口' }}</div>
          </div>
        </div>

        <!-- 并发风险列表 (已移除) -->


        <!-- 承灾体列表 -->
        <div class="vulnerability-list">
          <div class="section-title">
             <i class="fa-solid fa-house-crack"></i>
             <span>重点承灾体</span>
          </div>
          <div 
            v-for="item in displayData.vulnerabilities"
            :key="item.type"
            class="vuln-item"
            :class="{ clickable: item.clickable, 'high-risk': item.isHighRisk }"
            @click="item.clickable && handleVulnerabilityClick(item)"
          >
            <div class="vuln-icon"><i :class="item.icon"></i></div>
            <div class="vuln-info">
              <div class="name">{{ item.name }}</div>
              <div class="count">{{ item.count }} <span class="unit">{{ item.unit }}</span></div>
            </div>
            
            <div class="vuln-actions">
              <!-- 疏散按钮 (仅针对人口且有Action的项) -->
              <div 
                v-if="item.hasAction" 
                class="action-icon-btn"
                @click="handleEvacuationAction(item, $event)"
              >
                <i :class="item.actionIcon"></i> {{ item.actionText }}
              </div>
              <!-- 其他额外信息 -->
              <div v-else-if="item.extra" class="vuln-extra">{{ item.extra }}</div>
            </div>
            
            <i v-if="item.clickable && !item.hasAction" class="fa-solid fa-chevron-right arrow"></i>
          </div>
        </div>
        
        <!-- 动态模式下的操作按钮 -->
        <div v-if="currentMode === 'dynamic'" class="action-bar top-border">
           <button class="btn btn-primary" @click="$emit('play-animation')">
             <i class="fa-solid fa-play"></i> 演练动画
           </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockFloodSimulation, mockDisasterCensusData } from '../../data/seaConditionData'

const props = defineProps({})
const emit = defineEmits(['play-animation', 'risk-click', 'evacuation-click', 'vulnerability-click'])

const isCollapsed = ref(false)
const currentMode = ref('dynamic') // dynamic | static
const hasSimulationData = ref(true)
const currentPressure = ref(955) // hPa

// ===== 统一数据接口 =====
const displayData = computed(() => {
  if (currentMode.value === 'dynamic') {
    const sim = mockFloodSimulation
    return {
      mode: 'dynamic',
      title: '最新模拟结果',
      source: sim.metadata.source,
      timeRange: `${formatTime(sim.metadata.simulationPeriod.start)} - ${formatTime(sim.metadata.simulationPeriod.end)}`,
      // 核心指标
      metrics: {
        area: sim.summary.maxFloodArea,
        depth: sim.summary.maxWaterDepth,
        duration: sim.summary.duration,
        affected: sim.summary.affectedPopulation / 10000 // 万人
      },
      // 并发风险 (已隐藏)
      // risks: sim.concurrentRisks.map(r => ({
      //   ...r, 
      //   desc: `预测深度 ${r.predictedDepth}m` 
      // })),
      // 承灾体 (动态模式下使用 simulation 中的风险数据作为承灾体展示，或者也可以复用静态列表但加上动态深度)
      // 这里为了演示融合，我们合并静态列表和动态深度
      vulnerabilities: mergeVulnerabilitiesWithSimulation(mockDisasterCensusData.vulnerabilities, sim.concurrentRisks)
    }
  } else {
    // static mode
    const pressure = currentPressure.value
    const scenarios = mockDisasterCensusData.pressureScenarios
    let scenario = scenarios['950-980']
    if (pressure <= 855) scenario = scenarios['845-855']
    else if (pressure <= 875) scenario = scenarios['855-875']
    else if (pressure <= 895) scenario = scenarios['875-895']
    else if (pressure <= 920) scenario = scenarios['895-920']
    else if (pressure <= 950) scenario = scenarios['920-950']

    return {
      mode: 'static',
      title: `匹配场景: ${scenario.label}`,
      source: '灾害普查数据库',
      timeRange: '历史极值统计',
      // 核心指标
      metrics: {
        area: scenario.floodArea,
        depth: scenario.maxWaterDepth,
        duration: scenario.duration,
        affected: scenario.affectedTowns // 镇街数 (静态模式下的特有指标，但也映射到同一位置)
      },
      // 并发风险 (已隐藏)
      // risks: scenario.concurrentRisks?.map(r => ({
      //   ...r,
      //   desc: `历史极值 ${r.predictedDepth}m`
      // })) || [],
      // 承灾体
      vulnerabilities: formatStaticVulnerabilities(mockDisasterCensusData.vulnerabilities)
    }
  }
})

// 辅助函数：将静态承灾体与模拟数据结合
function mergeVulnerabilitiesWithSimulation(staticVulns, simulatedRisks) {
  // 简化处理：基于静态分类统计，但如果模拟数据中有该类型的风险，则标红
  return formatStaticVulnerabilities(staticVulns).map(CAT => {
    const riskCount = simulatedRisks.filter(r => r.type === CAT.originalType).length
    return {
      ...CAT,
      extra: riskCount > 0 ? `${riskCount}处高风险` : CAT.extra,
      isHighRisk: riskCount > 0
    }
  })
}

// 辅助函数：格式化静态承灾体列表
function formatStaticVulnerabilities(v) {
  return [
    {
      type: 'population',
      originalType: 'population',
      name: '人口聚集区',
      icon: 'fa-solid fa-users',
      count: v.populationCenters.length,
      unit: '处',
      extra: `${(v.populationCenters.reduce((sum, p) => sum + p.population, 0) / 10000).toFixed(1)}万人`,
      clickable: true,
      hasAction: true,
      actionIcon: 'fa-solid fa-person-walking-arrow-right', // 疏散图标
      actionText: '疏散路径',
      data: v.populationCenters,
    },
    {
      type: 'tourist',
      originalType: 'tourist',
      name: '滨海旅游区',
      icon: 'fa-solid fa-umbrella-beach',
      count: v.touristAreas.length,
      unit: '处',
      clickable: true,
      data: v.touristAreas,
    },
    {
      type: 'fishingPort',
      originalType: 'fishingPort',
      name: '渔港',
      icon: 'fa-solid fa-anchor',
      count: v.fishingPorts.length,
      unit: '处',
      extra: `${v.fishingPorts.reduce((sum, p) => sum + p.vessels, 0)}船`,
      clickable: true,
      data: v.fishingPorts,
    },
    {
      type: 'aquaculture',
      originalType: 'aquaculture',
      name: '海水养殖',
      icon: 'fa-solid fa-fish',
      count: v.aquaculture.reduce((sum, a) => sum + a.area, 0),
      unit: '亩',
      clickable: true,
      data: v.aquaculture,
    }
  ]
}

function formatTime(fullTime) {
  return fullTime ? fullTime.split(' ')[1] : ''
}



function handleVulnerabilityClick(item) {
  emit('vulnerability-click', item)
}

function handleEvacuationAction(item, event) {
  event.stopPropagation() // 阻止冒泡，避免触发列表点击
  if (item.data && item.data.length > 0) {
    // 默认演示第一个，实际业务可能需要进一步选择
    emit('evacuation-click', item.data[0]) 
  }
}
</script>

<style scoped>
.risk-assessment-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.toggle-icon.rotated { transform: rotate(180deg); }

.panel-content {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 模式切换 */
.mode-switch {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px;
  border-radius: 6px;
  gap: 4px;
}

.switch-item {
  flex: 1;
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary);
  padding: 6px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

.switch-item.active {
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.badge-new {
  position: absolute;
  top: 0;
  right: 2px;
  font-size: 8px;
  color: #ff3b30;
  transform: scale(0.8);
  font-weight: 800;
}

/* 统一信息卡片 */
.info-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 11px;
}
.info-card.highlight {
  background: rgba(0, 229, 255, 0.05);
  border: 1px dashed rgba(0, 229, 255, 0.2);
}

.row-between { display: flex; justify-content: space-between; align-items: center; }
.mt-1 { margin-top: 4px; }
.label { color: var(--text-muted); }
.value { color: var(--text-secondary); }
.highlight-text { color: #fbbf24; font-weight: 700; }

/* 统一指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.metric-box {
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  border-left: 3px solid transparent;
}
.box-red { border-left-color: #ef4444; }
.box-orange { border-left-color: #f97316; }
.box-yellow { border-left-color: #eab308; }
.box-blue { border-left-color: #3b82f6; }

.metric-row { display: flex; justify-content: space-between; align-items: baseline; }
.metric-val { font-size: 18px; font-weight: 700; color: #fff; font-family: var(--font-display); }
.metric-val .unit { font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.6); margin-left: 2px; }
.metric-label { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

/* 风险列表 */
.risk-list-section, .vulnerability-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.section-title i { color: #f97316; }

.risk-list { display: flex; flex-direction: column; gap: 6px; }

.risk-item {
  background: rgba(255, 255, 255, 0.04);
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}
.risk-item:hover { background: rgba(255, 255, 255, 0.08); }
.risk-item.high { border-left-color: #ef4444; }
.risk-item.medium { border-left-color: #f97316; }

.risk-main { display: flex; justify-content: space-between; align-items: center; }
.risk-name { font-size: 12px; color: var(--text-primary); font-weight: 500; }
.risk-tag { font-size: 10px; color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 1px 4px; border-radius: 3px; }
.risk-sub { font-size: 10px; color: var(--text-muted); margin-top: 4px; }

/* 承灾体项 */
.vuln-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
  transition: background 0.2s;
  position: relative;
}
.vuln-item.clickable { cursor: pointer; }
.vuln-item.clickable:hover { background: rgba(255,255,255,0.08); }
.vuln-item.high-risk { border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }

.vuln-icon { width: 24px; height: 24px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--accent-cyan); font-size: 10px; }
.vuln-info { flex: 1; }
.vuln-info .name { font-size: 12px; color: var(--text-secondary); }
.vuln-info .count { font-size: 13px; font-weight: 600; color: #fff; }
.vuln-info .unit { font-size: 10px; font-weight: 400; color: var(--text-muted); }

.vuln-actions { display: flex; gap: 4px; }

/* 疏散按钮 */
.action-icon-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 10px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  cursor: pointer;
  transition: all 0.2s;
}
.action-icon-btn:hover {
  background: rgba(16, 185, 129, 0.25);
  transform: translateY(-1px);
}

.vuln-extra { font-size: 10px; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 1px 4px; border-radius: 3px; }
.arrow { font-size: 10px; color: var(--text-muted); }

/* 按钮 */
.btn {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s;
}
.btn-primary { background: var(--accent-cyan); color: #000; font-weight: 600; }
.btn-primary:hover { opacity: 0.9; }

/* 动画 */
.fade-in {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
