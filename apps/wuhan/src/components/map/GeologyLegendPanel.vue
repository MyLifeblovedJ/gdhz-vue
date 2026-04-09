<template>
  <section class="geology-legend-panel">
    <div class="panel-heading">
      <i class="fa-solid fa-palette"></i>
      <span>地质采样图例</span>
    </div>

    <div class="panel-block">
      <div class="block-title">筛选树</div>

      <label class="field-control">
        <span>筛选字段</span>
        <select
          :value="store.geology.filterField"
          @change="store.setGeologyFilterField($event.target.value)"
        >
          <option v-for="field in fieldOptions" :key="field.key" :value="field.key">
            {{ field.label }}
          </option>
        </select>
      </label>

      <div class="mode-row">
        <span>筛选模式</span>
        <div class="mode-buttons">
          <button
            v-for="mode in filterModes"
            :key="mode.key"
            type="button"
            class="mode-button"
            :class="{ active: store.geology.filterMode === mode.key }"
            @click="store.setGeologyFilterMode(mode.key)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <div class="tree-shell">
        <template v-if="filterGroup?.children?.length">
          <div class="tree-group-header">
            <i class="fa-solid fa-folder-tree"></i>
            <span>{{ filterGroup.label }}</span>
          </div>

          <label
            v-for="item in filterGroup.children"
            :key="item.id"
            class="tree-item"
          >
            <input
              :type="isSingleMode ? 'radio' : 'checkbox'"
              :name="isSingleMode ? `geology-filter-${store.geology.filterField}` : undefined"
              :checked="item.checked"
              @change="store.toggleGeologySelectedValue(item.value)"
            >
            <span class="tree-item-label">{{ item.label }}</span>
            <span class="tree-item-count">{{ item.count }}</span>
          </label>
        </template>

        <div v-else class="empty-state">
          先在左侧图层里勾选原始数据或处理后数据。
        </div>
      </div>
    </div>

    <div class="panel-block">
      <div class="block-title">着色图例</div>

      <div class="mode-row">
        <span>着色模式</span>
        <div class="mode-buttons">
          <button
            v-for="mode in colorModes"
            :key="mode.key"
            type="button"
            class="mode-button"
            :class="{ active: store.geology.colorMode === mode.key }"
            @click="store.setGeologyColorMode(mode.key)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <template v-if="store.geology.colorMode === 'linked'">
        <label class="field-control">
          <span>着色字段</span>
          <select
            :value="store.geology.colorBy"
            @change="store.setGeologyColorBy($event.target.value)"
          >
            <option v-for="field in fieldOptions" :key="field.key" :value="field.key">
              {{ field.label }}
            </option>
          </select>
        </label>

        <div class="tree-shell">
          <template v-if="colorGroup?.children?.length">
            <div class="tree-group-header">
              <i class="fa-solid fa-swatchbook"></i>
              <span>{{ colorGroup.label }}</span>
            </div>

            <div
              v-for="item in colorGroup.children"
              :key="item.id"
              class="color-item"
            >
              <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
              <span class="tree-item-label">{{ item.label }}</span>
              <span class="tree-item-count">{{ item.count }}</span>
            </div>
          </template>

          <div v-else class="empty-state">
            当前没有可着色的采样点。
          </div>
        </div>
      </template>

      <template v-else>
        <template v-if="store.geology.layers.rawVisible">
          <label class="field-control">
            <span>原始数据着色字段</span>
            <select
              :value="store.geology.rawColorBy"
              @change="store.setGeologyDatasetColorBy('raw', $event.target.value)"
            >
              <option v-for="field in fieldOptions" :key="field.key" :value="field.key">
                {{ field.label }}
              </option>
            </select>
          </label>
        </template>

        <template v-if="store.geology.layers.processedVisible">
          <label class="field-control">
            <span>处理后数据着色字段</span>
            <select
              :value="store.geology.processedColorBy"
              @change="store.setGeologyDatasetColorBy('processed', $event.target.value)"
            >
              <option v-for="field in fieldOptions" :key="field.key" :value="field.key">
                {{ field.label }}
              </option>
            </select>
          </label>
        </template>

        <div class="tree-shell">
          <template v-if="rawColorGroup?.children?.length || processedColorGroup?.children?.length">
            <template v-if="rawColorGroup?.children?.length">
              <div class="tree-group-header">
                <i class="fa-solid fa-swatchbook"></i>
                <span>原始数据分类</span>
              </div>
              <div
                v-for="item in rawColorGroup.children"
                :key="item.id"
                class="color-item"
              >
                <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="tree-item-label">{{ item.label }}</span>
                <span class="tree-item-count">{{ item.count }}</span>
              </div>
            </template>

            <template v-if="processedColorGroup?.children?.length">
              <div class="tree-group-header tree-group-subheader">
                <i class="fa-solid fa-swatchbook"></i>
                <span>处理后数据分类</span>
              </div>
              <div
                v-for="item in processedColorGroup.children"
                :key="item.id"
                class="color-item"
              >
                <span class="color-diamond" :style="{ borderColor: item.color }"></span>
                <span class="tree-item-label">{{ item.label }}</span>
                <span class="tree-item-count">{{ item.count }}</span>
              </div>
            </template>
          </template>

          <div v-else class="empty-state">
            当前没有可着色的采样点。
          </div>
        </div>
      </template>
    </div>

    <div v-if="store.activeGeologyRecord" class="active-group-card">
      <div class="active-group-title">
        <i class="fa-solid fa-link"></i>
        <span>MGGID 联动</span>
      </div>
      <div class="active-group-grid">
        <div class="active-group-cell">
          <span class="cell-label">当前分组</span>
          <strong>{{ store.activeGeologyRecord.mggid }}</strong>
        </div>
        <div class="active-group-cell">
          <span class="cell-label">联动点数</span>
          <strong>{{ store.activeGeologyGroupRecords.length }}</strong>
        </div>
        <div class="active-group-cell wide">
          <span class="cell-label">样品</span>
          <strong>{{ store.activeGeologyRecord.sample || store.activeGeologyRecord.pointId }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { GEOLOGY_COLOR_MODE_OPTIONS, GEOLOGY_FILTER_MODE_OPTIONS } from '../../utils/geologySampling'

const store = useAppStore()

const fieldOptions = computed(() => store.geology.fieldOptions || [])
const filterModes = GEOLOGY_FILTER_MODE_OPTIONS
const colorModes = GEOLOGY_COLOR_MODE_OPTIONS
const isSingleMode = computed(() => store.geology.filterMode === 'single')
const filterGroup = computed(() => store.geologyFilterTreeItems[0] || null)
const colorGroup = computed(() => store.geologyColorLegendItems[0] || null)
const rawColorGroup = computed(() => store.rawGeologyColorLegendItems[0] || null)
const processedColorGroup = computed(() => store.processedGeologyColorLegendItems[0] || null)
</script>

<style scoped>
.geology-legend-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.panel-block {
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.field-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-control span,
.mode-row > span {
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.field-control select {
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
}

.mode-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mode-button {
  min-height: 36px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.mode-button.active {
  border-color: rgba(14, 165, 233, 0.28);
  background: rgba(224, 242, 254, 0.92);
  color: #0f172a;
}

.tree-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.tree-group-header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
}

.tree-group-header i {
  color: #0284c7;
}

.tree-item,
.color-item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.color-item {
  grid-template-columns: 12px minmax(0, 1fr) auto;
}

.tree-item input {
  accent-color: #0284c7;
}

.tree-item-label {
  min-width: 0;
  color: #334155;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-item-count {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.color-diamond {
  width: 10px;
  height: 10px;
  border: 1.4px solid #64748b;
  background: #ffffff;
  transform: rotate(45deg);
  box-sizing: border-box;
}

.tree-group-subheader {
  margin-top: 8px;
}

.empty-state {
  padding: 12px 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.active-group-card {
  padding: 14px;
  border-radius: 16px;
  background: rgba(14, 165, 233, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.active-group-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}

.active-group-title i {
  color: #0284c7;
}

.active-group-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.active-group-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
}

.active-group-cell.wide {
  grid-column: 1 / -1;
}

.cell-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.active-group-cell strong {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}
</style>
