<template>
  <div class="collapsible-panel" :class="{ collapsed: isCollapsed }">
    <div class="collapsible-header" @click="toggle">
      <span class="title">
        <i :class="['fa-solid', icon]"></i>
        {{ title }}
        <span v-if="badge !== undefined" class="badge">{{ badge }}</span>
      </span>
      <i class="fa-solid fa-chevron-down toggle-icon"></i>
    </div>
    <div class="collapsible-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  id: String,
  title: String,
  icon: {
    type: String,
    default: 'fa-folder'
  },
  badge: [String, Number],
  defaultCollapsed: {
    type: Boolean,
    default: false
  }
})

const isCollapsed = ref(props.defaultCollapsed)

function toggle() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.collapsible-panel {
  background: var(--bg-deep);
  margin: 8px 10px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  flex-shrink: 0; /* 防止面板在 flex 容器中被挤压 */
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.collapsible-header:hover {
  background: var(--bg-hover);
}

.collapsible-header .title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapsible-header .badge {
  font-size: 10px;
  background: var(--bg-active);
  padding: 2px 6px;
  border-radius: 10px;
  color: var(--text-secondary);
}

.collapsible-header .toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform var(--transition-fast);
}

.collapsible-panel.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.collapsible-content {
  max-height: 1000px;
  overflow: hidden; /* 恢复 hidden 配合折叠动画 */
  transition: max-height var(--transition-normal), padding var(--transition-normal);
  padding: 0 12px 12px 12px;
}

.collapsible-panel.collapsed .collapsible-content {
  max-height: 0;
  padding: 0 12px;
}
</style>
