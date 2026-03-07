<template>
  <aside class="right-tools">
    <button
      type="button"
      class="tool-btn tool-menu"
      :title="tools[0]?.label || '菜单'"
    >
      <span>{{ tools[0]?.label || '菜单' }}</span>
    </button>

    <button type="button" class="tool-btn tool-mode" @click="$emit('toggle-mode')" :title="`切换到${mapMode === '3D' ? '2D' : '3D'}`">
      <span>{{ mapMode }}</span>
    </button>

    <button
      v-for="tool in demoTools"
      :key="tool.key"
      type="button"
      class="tool-btn tool-normal"
      :title="tool.label"
      @click="handleToolClick(tool.key)"
    >
      <span>{{ tool.key === 'layer' ? `${tool.label}\n${basemapName}` : tool.label }}</span>
    </button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tools: {
    type: Array,
    default: () => []
  },
  mapMode: {
    type: String,
    default: '3D'
  },
  basemapName: {
    type: String,
    default: '卫星'
  }
})

const emit = defineEmits(['toggle-mode', 'switch-basemap'])

// 右侧仅做演示布局，去掉首项菜单后展示其余按钮。
const demoTools = computed(() => props.tools.slice(1))

function handleToolClick(toolKey) {
  if (toolKey === 'layer') {
    emit('switch-basemap')
  }
}
</script>
