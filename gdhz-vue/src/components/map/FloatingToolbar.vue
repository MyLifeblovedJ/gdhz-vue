<template>
  <div class="floating-toolbar">
    <!-- 悬浮按钮组 -->
    <div class="toolbar-buttons">
      <button
        class="toolbar-btn"
        :class="{ active: activePanel === 'layers' }"
        @click="togglePanel('layers')"
        title="图层控制"
      >
        <i class="fa-solid fa-layer-group"></i>
      </button>
      <button
        class="toolbar-btn devices"
        :class="{ active: activePanel === 'devices' }"
        @click="togglePanel('devices')"
        title="观测设备"
      >
        <i class="fa-solid fa-satellite-dish"></i>
      </button>
      <button
        class="toolbar-btn models"
        :class="{ active: activePanel === 'models' }"
        @click="togglePanel('models')"
        title="模型集成"
      >
        <i class="fa-solid fa-brain"></i>
      </button>
    </div>

    <!-- 面板容器 -->
    <Transition name="panel-slide">
      <div v-if="activePanel" class="floating-panel" :class="activePanel">
        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="panel-title">
            <i :class="panelConfig[activePanel].icon"></i>
            {{ panelConfig[activePanel].title }}
          </div>
          <button class="panel-close" @click="closePanel">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 面板内容 -->
        <div class="panel-content">
          <LayerControl v-if="activePanel === 'layers'" @layer-toggle="handleLayerToggle" />
          <DeviceExplorer v-if="activePanel === 'devices'" @device-click="handleDeviceClick" />
          <ModelIntegration v-if="activePanel === 'models'" @model-click="handleModelClick" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import LayerControl from './LayerControl.vue'
import DeviceExplorer from '../device/DeviceExplorer.vue'
import ModelIntegration from '../model/ModelIntegration.vue'

const emit = defineEmits(['device-click', 'layer-toggle', 'model-click'])

const store = useAppStore()

// 面板配置
const panelConfig = {
  layers: {
    title: '图层控制',
    icon: 'fa-solid fa-layer-group'
  },
  devices: {
    title: '观测设备',
    icon: 'fa-solid fa-satellite-dish'
  },
  models: {
    title: '模型集成',
    icon: 'fa-solid fa-brain'
  }
}

// 计算属性
const activePanel = computed(() => store.activeFloatingPanel)

// 方法
function togglePanel(panel) {
  store.setActiveFloatingPanel(panel)
}

function closePanel() {
  store.closeFloatingPanel()
}

function handleLayerToggle(data) {
  emit('layer-toggle', data)
}

function handleDeviceClick(device) {
  emit('device-click', device)
}

function handleModelClick(model) {
  emit('model-click', model)
}
</script>

<style scoped>
.floating-toolbar {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 1100;  /* 高于图例的 1000 */
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* 按钮组 */
.toolbar-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(10, 15, 28, 0.85);
  backdrop-filter: blur(12px);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.toolbar-btn {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(30, 40, 60, 0.6);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.25s ease;
}

.toolbar-btn:hover {
  background: rgba(50, 65, 90, 0.8);
  color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
}

.toolbar-btn.active {
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 229, 255, 0.05));
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
}

/* 设备按钮特色 */
.toolbar-btn.devices.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
  border-color: #10b981;
  color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

/* 模型按钮特色 */
.toolbar-btn.models.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05));
  border-color: #8b5cf6;
  color: #8b5cf6;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
}

/* 悬浮面板 */
.floating-panel {
  width: 320px;
  max-height: 70vh;
  background: rgba(10, 15, 28, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-normal);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* 面板顶部光条 */
.floating-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent,
    var(--accent-cyan) 30%,
    var(--accent-cyan) 70%,
    transparent);
  opacity: 0.8;
}

.floating-panel.devices::before {
  background: linear-gradient(90deg,
    transparent,
    #10b981 30%,
    #10b981 70%,
    transparent);
}

.floating-panel.models::before {
  background: linear-gradient(90deg,
    transparent,
    #8b5cf6 30%,
    #8b5cf6 70%,
    transparent);
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.floating-panel.devices .panel-title {
  color: #10b981;
}

.floating-panel.models .panel-title {
  color: #8b5cf6;
}

.panel-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.panel-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
}

/* 面板滑入动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
