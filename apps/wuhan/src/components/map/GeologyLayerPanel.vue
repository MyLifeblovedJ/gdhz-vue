<template>
  <section class="geology-layer-panel">
    <div class="panel-heading">
      <i class="fa-solid fa-layer-group"></i>
      <span>地质采样图层</span>
    </div>

    <label class="layer-toggle-card">
      <input
        type="checkbox"
        :checked="store.geology.layers.rawVisible"
        @change="store.setGeologyLayerVisibility('raw', $event.target.checked)"
      >
      <div class="layer-toggle-main">
        <div class="layer-toggle-title-row">
          <span class="layer-toggle-title">原始数据</span>
          <span class="layer-toggle-badge raw">{{ rawCount }}</span>
        </div>
        <p>NOAA MGG 原始采样点，勾选后在地图中显示实心点。</p>
      </div>
    </label>

    <label class="layer-toggle-card">
      <input
        type="checkbox"
        :checked="store.geology.layers.processedVisible"
        @change="store.setGeologyLayerVisibility('processed', $event.target.checked)"
      >
      <div class="layer-toggle-main">
        <div class="layer-toggle-title-row">
          <span class="layer-toggle-title">处理后数据</span>
          <span class="layer-toggle-badge processed">{{ processedCount }}</span>
        </div>
        <p>人工解析后的采样点，勾选后在地图中显示空心点。</p>
      </div>
    </label>

    <div class="layer-note">
      <i class="fa-solid fa-circle-info"></i>
      <span>同一个 mggid 下的点在点击后会联动高亮。</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()

const rawCount = computed(() => store.geology.records.raw.length)
const processedCount = computed(() => store.geology.records.processed.length)
</script>

<style scoped>
.geology-layer-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-heading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
}

.panel-heading i {
  color: #0284c7;
}

.layer-toggle-card {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
}

.layer-toggle-card input[type='checkbox'] {
  margin-top: 3px;
  accent-color: #0284c7;
}

.layer-toggle-main {
  min-width: 0;
}

.layer-toggle-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.layer-toggle-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.layer-toggle-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.layer-toggle-badge.raw {
  background: rgba(14, 165, 233, 0.12);
  color: #0369a1;
}

.layer-toggle-badge.processed {
  background: rgba(249, 115, 22, 0.14);
  color: #c2410c;
}

.layer-toggle-main p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.layer-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(14, 165, 233, 0.08);
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
}

.layer-note i {
  color: #0284c7;
}
</style>
