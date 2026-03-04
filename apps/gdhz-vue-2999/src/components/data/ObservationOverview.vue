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
  gap: 6px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08));
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15));
  opacity: 0;
  transition: opacity 0.3s;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

.tab-btn:hover::before {
  opacity: 0.5;
}

.tab-btn.active {
  color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
  border-color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.tab-btn.active::before {
  opacity: 1;
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
  padding: 12px;
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(20, 30, 50, 0.4));
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.data-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #10b981, #3b82f6);
  opacity: 0;
  transition: opacity 0.3s;
}

.data-item:hover {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.05));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.data-item:hover::before {
  opacity: 1;
}

.data-item.full {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.08));
  border-color: rgba(16, 185, 129, 0.3);
}

.data-label {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-display);
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  line-height: 1;
}

.data-value .unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 3px;
  text-shadow: none;
}

.data-trend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 10px;
  display: inline-flex;
  font-weight: 600;
}

.data-trend.up {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.data-trend.down {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.data-trend.stable {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.data-direction {
  font-size: 11px;
  color: #3b82f6;
  margin-top: 6px;
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  display: inline-block;
}

.data-status {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  margin-top: 6px;
  display: inline-block;
  font-weight: 600;
  border: 1px solid;
}

.data-status.normal {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
}
</style>
