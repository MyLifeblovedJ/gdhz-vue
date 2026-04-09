<template>
  <div class="tree-level" :class="`level-${level}`">
    <!-- 搜索框（仅在 level < 2 时展示） -->
    <div v-if="level < 2 && nodes.length > 3" class="tree-search">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input
        v-model="searchText"
        type="text"
        :placeholder="searchPlaceholder"
        class="tree-search-input"
      >
      <button v-if="searchText" class="tree-search-clear" @click="searchText = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- 节点列表 -->
    <template v-for="node in displayedNodes" :key="node.id">
      <!-- 非叶子节点（机构/船只/航次） -->
      <div
        v-if="node.type !== 'sample'"
        class="tree-node"
        :class="[`node-${node.type}`, { expanded: isExpanded(node.id) }]"
      >
        <div class="tree-node-header" @click="$emit('toggle', node.id)">
          <i class="tree-node-arrow fa-solid" :class="isExpanded(node.id) ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
          <i :class="nodeIcon(node)"></i>
          <span class="tree-node-label">{{ node.label }}</span>
          <span v-if="node.year" class="tree-node-year">{{ node.year }}</span>
          <span class="tree-node-count">{{ node.count }} 条</span>
          <span v-if="node.rawCount && node.processedCount" class="tree-node-tags">
            <span class="tag tag-raw">原{{ node.rawCount }}</span>
            <span class="tag tag-processed">处{{ node.processedCount }}</span>
          </span>
          <span v-else-if="node.processedCount" class="tree-node-tags">
            <span class="tag tag-processed">处理后</span>
          </span>
          <span v-else-if="node.rawCount" class="tree-node-tags">
            <span class="tag tag-raw">原始</span>
          </span>
          <button
            class="focus-btn"
            :title="`只看${focusLabel(node.type)}`"
            @click.stop="$emit('focus-node', buildFocusPayload(node))"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>

        <!-- 展开后递归渲染子层级 -->
        <div v-if="isExpanded(node.id)" class="tree-node-children">
          <TreeLevel
            :nodes="node.children || []"
            :level="level + 1"
            :default-show-count="defaultShowCount"
            :expanded-map="expandedMap"
            :parent-context="currentContext(node)"
            @toggle="(id) => $emit('toggle', id)"
            @sample-click="(record) => $emit('sample-click', record)"
            @focus-node="(payload) => $emit('focus-node', payload)"
          />
        </div>
      </div>

      <!-- 叶子节点（样品） -->
      <div
        v-else
        class="tree-node tree-sample"
        @click="$emit('sample-click', node.record)"
      >
        <i class="fa-solid fa-location-dot sample-icon"></i>
        <span class="tree-sample-label">{{ node.label }}</span>
        <span class="tag" :class="node.datasetType === 'processed' ? 'tag-processed' : 'tag-raw'">
          {{ node.datasetType === 'processed' ? '处理后' : '原始' }}
        </span>
        <span v-if="node.record" class="tree-sample-meta">
          {{ node.record.device }} · {{ node.record.sample }}
        </span>
      </div>
    </template>

    <!-- 展开更多按钮 -->
    <button
      v-if="hasMore"
      class="tree-show-more"
      @click="showAll = true"
    >
      <i class="fa-solid fa-ellipsis"></i>
      展开更多（剩余 {{ filteredNodes.length - defaultShowCount }} 项）
    </button>

    <!-- 无搜索结果 -->
    <div v-if="searchText && !filteredNodes.length" class="tree-no-match">
      未找到 "{{ searchText }}"
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import TreeLevel from './GeologyFilterTreeLevel.vue'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  level: { type: Number, default: 0 },
  defaultShowCount: { type: Number, default: 5 },
  expandedMap: { type: Object, default: () => ({}) },
  parentContext: { type: Object, default: () => ({}) },
})

defineEmits(['toggle', 'sample-click', 'focus-node'])

const searchText = ref('')
const showAll = ref(false)

const searchPlaceholder = computed(() => {
  const labels = { 0: '搜索机构...', 1: '搜索船只...' }
  return labels[props.level] || '搜索...'
})

// 搜索过滤
const filteredNodes = computed(() => {
  if (!searchText.value) return props.nodes
  const keyword = searchText.value.toLowerCase()
  return props.nodes.filter(node =>
    node.label?.toLowerCase().includes(keyword),
  )
})

// 默认折叠，只显示 defaultShowCount 条
const displayedNodes = computed(() => {
  if (showAll.value || filteredNodes.value.length <= props.defaultShowCount) {
    return filteredNodes.value
  }
  return filteredNodes.value.slice(0, props.defaultShowCount)
})

const hasMore = computed(() =>
  !showAll.value && filteredNodes.value.length > props.defaultShowCount,
)

function isExpanded(nodeId) {
  return !!props.expandedMap[nodeId]
}

function nodeIcon(node) {
  const icons = {
    institution: 'fa-solid fa-building-columns',
    ship: 'fa-solid fa-ship',
    cruise: 'fa-solid fa-folder',
  }
  return icons[node.type] || 'fa-solid fa-circle'
}

function focusLabel(type) {
  const labels = { institution: '机构', ship: '调查船', cruise: '航次' }
  return labels[type] || ''
}

function currentContext(node) {
  const ctx = { ...props.parentContext }
  if (node.type === 'institution') ctx.institution = node.label
  if (node.type === 'ship') ctx.ship = node.label
  if (node.type === 'cruise') ctx.cruise = node.label
  return ctx
}

function buildFocusPayload(node) {
  const filters = { ...props.parentContext }
  if (node.type === 'institution') filters.institution = node.label
  if (node.type === 'ship') filters.ship = node.label
  if (node.type === 'cruise') filters.cruise = node.label
  return { type: node.type, label: node.label, filters }
}
</script>

<style scoped>
.tree-level {
  display: flex;
  flex-direction: column;
}

.tree-level.level-1 {
  padding-left: 12px;
}

.tree-level.level-2 {
  padding-left: 12px;
}

.tree-level.level-3 {
  padding-left: 8px;
}

/* ─── 搜索框 ─── */
.tree-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 10px 6px;
  padding: 0 8px;
  height: 28px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: border-color 0.15s;
}

.tree-search:focus-within {
  border-color: #0ea5e9;
  background: #fff;
}

.tree-search i {
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
}

.tree-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #334155;
  outline: none;
  min-width: 0;
}

.tree-search-input::placeholder {
  color: #94a3b8;
}

.tree-search-clear {
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  font-size: 11px;
  line-height: 1;
  transition: color 0.15s;
}

.tree-search-clear:hover {
  color: #ef4444;
}

/* ─── 树节点（非叶子） ─── */
.tree-node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  color: #334155;
  border-radius: 4px;
  margin: 0 4px;
  transition: background 0.12s;
  user-select: none;
}

.tree-node-header:hover {
  background: #f1f5f9;
}

.tree-node.expanded > .tree-node-header {
  background: rgba(14, 165, 233, 0.05);
  font-weight: 600;
}

.tree-node-arrow {
  font-size: 10px;
  color: #94a3b8;
  flex-shrink: 0;
  width: 12px;
  text-align: center;
  transition: transform 0.15s;
}

.tree-node-header > i:nth-child(2) {
  font-size: 13px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.node-institution > .tree-node-header > i:nth-child(2) {
  color: #8b5cf6;
}

.node-ship > .tree-node-header > i:nth-child(2) {
  color: #0ea5e9;
}

.node-cruise > .tree-node-header > i:nth-child(2) {
  color: #f59e0b;
}

.tree-node-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-year {
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
}

.tree-node-count {
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 8px;
}

/* ─── 只看按钮 ─── */
.focus-btn {
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(14, 165, 233, 0.08);
  color: #0ea5e9;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.tree-node-header:hover .focus-btn {
  display: flex;
}

.focus-btn:hover {
  background: #0ea5e9;
  color: #fff;
}

/* ─── 来源标签 ─── */
.tree-node-tags {
  display: inline-flex;
  gap: 3px;
  flex-shrink: 0;
}

.tag {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  line-height: 16px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}

.tag-raw {
  background: rgba(14, 165, 233, 0.1);
  color: #0284c7;
}

.tag-processed {
  background: rgba(249, 115, 22, 0.1);
  color: #c2410c;
}

/* ─── 子节点容器 ─── */
.tree-node-children {
  border-left: 1px solid #e2e8f0;
  margin-left: 17px;
}

/* ─── 叶子节点（样品） ─── */
.tree-sample {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  margin: 0 4px;
  font-size: 12px;
  color: #475569;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s;
}

.tree-sample:hover {
  background: rgba(14, 165, 233, 0.06);
}

.sample-icon {
  font-size: 11px;
  color: #0ea5e9;
  flex-shrink: 0;
}

.tree-sample-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-sample-meta {
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
  white-space: nowrap;
}

/* ─── 展开更多 ─── */
.tree-show-more {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin: 2px 4px 4px;
  border: none;
  background: none;
  color: #0ea5e9;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.tree-show-more:hover {
  background: rgba(14, 165, 233, 0.06);
}

.tree-show-more i {
  font-size: 10px;
}

/* ─── 无搜索结果 ─── */
.tree-no-match {
  padding: 12px 16px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}
</style>
