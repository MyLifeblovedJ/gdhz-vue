<template>
  <div class="observation-overview">
    <!-- 多维度观测数据标签页 -->
    <div class="tab-header">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon"></i>
        {{ tab.label }}
      </button>
    </div>

    <!-- 数据内容 -->
    <div class="tab-content">
      <!-- 海水温度 -->
      <div v-if="activeTab === 'temperature'" class="data-grid">
        <div class="data-item">
          <div class="data-label">表层水温</div>
          <div class="data-value">26.8<span class="unit">°C</span></div>
          <div class="data-trend up">
            <i class="fa-solid fa-arrow-up"></i> +0.5
          </div>
        </div>
        <div class="data-item">
          <div class="data-label">底层水温</div>
          <div class="data-value">18.2<span class="unit">°C</span></div>
          <div class="data-trend stable">
            <i class="fa-solid fa-minus"></i> 稳定
          </div>
        </div>
        <div class="data-item full">
          <div class="data-label">温跃层深度</div>
          <div class="data-value">45<span class="unit">m</span></div>
        </div>
      </div>

      <!-- 盐度 -->
      <div v-if="activeTab === 'salinity'" class="data-grid">
        <div class="data-item">
          <div class="data-label">表层盐度</div>
          <div class="data-value">33.5<span class="unit">‰</span></div>
          <div class="data-trend down">
            <i class="fa-solid fa-arrow-down"></i> -0.2
          </div>
        </div>
        <div class="data-item">
          <div class="data-label">底层盐度</div>
          <div class="data-value">34.8<span class="unit">‰</span></div>
          <div class="data-trend stable">
            <i class="fa-solid fa-minus"></i> 稳定
          </div>
        </div>
      </div>

      <!-- 流场 -->
      <div v-if="activeTab === 'current'" class="data-grid">
        <div class="data-item">
          <div class="data-label">表层流速</div>
          <div class="data-value">0.8<span class="unit">m/s</span></div>
          <div class="data-direction">西南</div>
        </div>
        <div class="data-item">
          <div class="data-label">潮流相位</div>
          <div class="data-value">涨潮</div>
          <div class="data-status normal">正常</div>
        </div>
      </div>

      <!-- 气象 -->
      <div v-if="activeTab === 'weather'" class="data-grid">
        <div class="data-item">
          <div class="data-label">气压</div>
          <div class="data-value">1008<span class="unit">hPa</span></div>
          <div class="data-trend down">
            <i class="fa-solid fa-arrow-down"></i> -5
          </div>
        </div>
        <div class="data-item">
          <div class="data-label">能见度</div>
          <div class="data-value">8.5<span class="unit">km</span></div>
          <div class="data-status normal">良好</div>
        </div>
        <div class="data-item">
          <div class="data-label">降水量(24h)</div>
          <div class="data-value">12<span class="unit">mm</span></div>
        </div>
        <div class="data-item">
          <div class="data-label">相对湿度</div>
          <div class="data-value">85<span class="unit">%</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('temperature')

const tabs = [
  { id: 'temperature', label: '水温', icon: 'fa-solid fa-temperature-half' },
  { id: 'salinity', label: '盐度', icon: 'fa-solid fa-droplet' },
  { id: 'current', label: '流场', icon: 'fa-solid fa-arrows-spin' },
  { id: 'weather', label: '气象', icon: 'fa-solid fa-cloud' }
]
</script>

<style scoped>
.observation-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tab-header {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border-radius: 6px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: var(--accent-cyan);
  background: rgba(0, 255, 255, 0.1);
}

.tab-btn i {
  font-size: 10px;
}

.tab-content {
  min-height: 80px;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.data-item {
  padding: 10px;
  background: rgba(30, 40, 60, 0.4);
  border-radius: 6px;
  position: relative;
}

.data-item.full {
  grid-column: span 2;
}

.data-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.data-value {
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--text-primary);
}

.data-value .unit {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 2px;
}

.data-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  margin-top: 4px;
}

.data-trend.up {
  color: #ef4444;
}

.data-trend.down {
  color: #10b981;
}

.data-trend.stable {
  color: var(--text-muted);
}

.data-direction {
  font-size: 10px;
  color: var(--accent-cyan);
  margin-top: 4px;
}

.data-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}

.data-status.normal {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}
</style>
