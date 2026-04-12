<template>
  <div class="tree-level" :class="`level-${level}`">
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

    <template v-for="node in displayedNodes" :key="node.id">
      <div
        v-if="node.type !== 'sample'"
        class="tree-node"
        :class="[`node-${node.type}`, { expanded: isExpanded(node.id) }]"
      >
        <div class="tree-node-header" @click="$emit('toggle', node.id)">
          <i class="tree-node-arrow fa-solid" :class="isExpanded(node.id) ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
          <i :class="nodeIcon(node)"></i>

          <div class="tree-node-main">
            <div class="tree-node-title">
              <span class="tree-node-label">{{ node.label }}</span>
              <span v-if="node.year" class="tree-node-year">{{ node.year }}</span>
            </div>

            <div
              v-if="getNodeSummary(node).visible.length"
              class="tree-node-summary-wrap"
            >
              <div
                class="tree-node-summary"
                :class="{ 'has-overflow': getNodeSummary(node).hiddenCount > 0 }"
              >
                <template v-for="(item, index) in getNodeSummary(node).visible" :key="item.key">
                  <span class="summary-item" :class="item.variant ? `is-${item.variant}` : ''">
                    {{ item.inline }}
                  </span>
                  <span v-if="index < getNodeSummary(node).visible.length - 1" class="summary-sep">/</span>
                </template>
                <span v-if="getNodeSummary(node).hiddenCount > 0" class="summary-more">
                  另 {{ getNodeSummary(node).hiddenCount }} 项
                </span>
              </div>

              <div v-if="getNodeSummary(node).hiddenCount > 0" class="tree-node-tooltip">
                <div
                  v-for="item in getNodeSummary(node).details"
                  :key="item.key"
                  class="tree-node-tooltip__line"
                >
                  {{ item.full }}
                </div>
              </div>
            </div>
          </div>

          <span class="tree-node-count">{{ node.count }} 条</span>
          <button
            class="focus-btn"
            :title="`只看${focusLabel(node.type)}`"
            @click.stop="$emit('focus-node', buildFocusPayload(node))"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>

        <div v-if="isExpanded(node.id)" class="tree-node-children">
          <TreeLevel
            :nodes="node.children || []"
            :level="level + 1"
            :default-show-count="defaultShowCount"
            :expanded-map="expandedMap"
            :browse-view="browseView"
            :parent-context="currentContext(node)"
            @toggle="(id) => $emit('toggle', id)"
            @sample-click="(record) => $emit('sample-click', record)"
            @focus-node="(payload) => $emit('focus-node', payload)"
          />
        </div>
      </div>

      <div
        v-else
        class="tree-node tree-sample"
        @click="$emit('sample-click', node.record)"
      >
        <div class="tree-sample-main">
          <div class="tree-sample-title">
            <i class="fa-solid fa-location-dot sample-icon"></i>
            <span class="tree-sample-label">{{ node.label }}</span>
          </div>

          <div class="tree-sample-summary">
            <template v-for="(item, index) in getSampleSummary(node)" :key="`${node.id}-${item.key}`">
              <span class="summary-item" :class="item.variant ? `is-${item.variant}` : ''">
                {{ item.label }}
              </span>
              <span v-if="index < getSampleSummary(node).length - 1" class="summary-sep">/</span>
            </template>
          </div>
        </div>
      </div>
    </template>

    <button
      v-if="hasMore"
      class="tree-show-more"
      @click="showAll = true"
    >
      <i class="fa-solid fa-ellipsis"></i>
      展开更多（剩余 {{ filteredNodes.length - defaultShowCount }} 项）
    </button>

    <div v-if="searchText && !filteredNodes.length" class="tree-no-match">
      未找到“{{ searchText }}”
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import TreeLevel from './GeologyFilterTreeLevel.vue'
import {
  getGeologyCategory,
  getGeologyCategoryGroupSummary,
} from '../../utils/geologySampling'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  level: { type: Number, default: 0 },
  defaultShowCount: { type: Number, default: 5 },
  expandedMap: { type: Object, default: () => ({}) },
  browseView: { type: String, default: 'institution' },
  parentContext: { type: Object, default: () => ({}) },
})

defineEmits(['toggle', 'sample-click', 'focus-node'])

const searchText = ref('')
const showAll = ref(false)

const searchPlaceholder = computed(() => {
  const labels = props.browseView === 'category'
    ? { 0: '搜索研究大类...', 1: '搜索具体分类...' }
    : { 0: '搜索机构...', 1: '搜索调查船...' }
  return labels[props.level] || '搜索...'
})

const filteredNodes = computed(() => {
  if (!searchText.value) return props.nodes
  const keyword = searchText.value.toLowerCase()
  return props.nodes.filter(node => node.label?.toLowerCase().includes(keyword))
})

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
    categoryGroup: 'fa-solid fa-layer-group',
    category: 'fa-solid fa-tags',
  }
  return icons[node.type] || 'fa-solid fa-circle'
}

function focusLabel(type) {
  const labels = {
    institution: '机构',
    ship: '调查船',
    cruise: '航次',
    categoryGroup: '研究大类',
    category: '具体分类',
  }
  return labels[type] || ''
}

function currentContext(node) {
  const ctx = { ...props.parentContext }
  if (node.type === 'institution') ctx.institution = node.label
  if (node.type === 'ship') ctx.ship = node.label
  if (node.type === 'cruise') ctx.cruise = node.label
  if (node.type === 'categoryGroup') ctx.categoryGroup = node.categoryGroupKey
  if (node.type === 'category') ctx.category = node.categoryKey
  return ctx
}

function buildFocusPayload(node) {
  const filters = { ...props.parentContext }
  if (node.type === 'institution') filters.institution = node.label
  if (node.type === 'ship') filters.ship = node.label
  if (node.type === 'cruise') filters.cruise = node.label
  if (node.type === 'categoryGroup') filters.categoryGroup = node.categoryGroupKey
  if (node.type === 'category') filters.category = node.categoryKey
  return { type: node.type, label: node.label, filters }
}

function getSampleCategory(node) {
  return getGeologyCategory(node.record)
}

function getDatasetLabel(datasetType) {
  return datasetType === 'processed' ? '处理后' : '原始'
}

function collectRecords(node) {
  if (node.type === 'sample') return node.record ? [node.record] : []
  if (!node.children) return []
  return node.children.flatMap(child => collectRecords(child))
}

function getNodeSummary(node) {
  const details = []

  if (node.rawCount) {
    details.push({
      key: `${node.id}-raw`,
      inline: node.processedCount ? `原始 ${node.rawCount}` : '全部原始',
      full: `原始数据 ${node.rawCount} 条`,
      variant: 'raw',
    })
  }

  if (node.processedCount) {
    details.push({
      key: `${node.id}-processed`,
      inline: node.rawCount ? `处理后 ${node.processedCount}` : '全部处理后',
      full: `处理后数据 ${node.processedCount} 条`,
      variant: 'processed',
    })
  }

  if (props.browseView !== 'category') {
    const groups = getGeologyCategoryGroupSummary(collectRecords(node))
    for (const item of groups) {
      details.push({
        key: `${node.id}-${item.key}`,
        inline: `${item.label} ${item.count}`,
        full: `${item.label} ${item.count} 条`,
        variant: '',
      })
    }
  }

  const visibleLimit = props.browseView === 'category' ? 2 : 3
  return {
    details,
    visible: details.slice(0, visibleLimit),
    hiddenCount: Math.max(details.length - visibleLimit, 0),
  }
}

function getSampleSummary(node) {
  const items = []
  const category = getSampleCategory(node)

  if (props.browseView !== 'category' && category.key !== 'other') {
    items.push({
      key: 'category',
      label: category.label,
      variant: '',
    })
  }

  items.push({
    key: 'dataset',
    label: getDatasetLabel(node.datasetType),
    variant: node.datasetType === 'processed' ? 'processed' : 'raw',
  })

  const metaText = [node.record?.device, node.record?.sample].filter(Boolean).join(' · ')
  if (metaText) {
    items.push({
      key: 'meta',
      label: metaText,
      variant: '',
    })
  }

  return items
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

.tree-node-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  color: #334155;
  border-radius: 6px;
  margin: 0 4px;
  transition: background 0.12s;
  user-select: none;
}

.tree-node-header:hover {
  background: #f1f5f9;
}

.tree-node.expanded > .tree-node-header {
  background: rgba(14, 165, 233, 0.05);
}

.tree-node-arrow {
  font-size: 10px;
  color: #94a3b8;
  flex-shrink: 0;
  width: 12px;
  text-align: center;
  margin-top: 2px;
}

.tree-node-header > i:nth-child(2) {
  font-size: 13px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 1px;
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

.node-categoryGroup > .tree-node-header > i:nth-child(2) {
  color: #0ea5e9;
}

.node-category > .tree-node-header > i:nth-child(2) {
  color: #f97316;
}

.tree-node-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tree-node-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tree-node-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

.tree-node-year {
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
}

.tree-node-summary-wrap {
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.tree-node-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
  font-size: 11px;
  color: #64748b;
}

.summary-item {
  white-space: nowrap;
}

.summary-item.is-raw {
  color: #0284c7;
  font-weight: 600;
}

.summary-item.is-processed {
  color: #c2410c;
  font-weight: 600;
}

.summary-sep {
  color: #cbd5e1;
}

.summary-more {
  color: #64748b;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  white-space: nowrap;
  display: inline-block;
}

.tree-node-tooltip {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 20;
  min-width: 200px;
  max-width: 300px;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe7f3;
  color: #1e293b;
  font-size: 12px;
  line-height: 1.65;
  font-weight: 500;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-2px);
  transition: opacity 0.15s, transform 0.15s;
}

.tree-node-summary-wrap:hover .tree-node-tooltip {
  opacity: 1;
  transform: translateY(0);
}

.tree-node-summary.has-overflow:hover .summary-more {
  visibility: hidden;
}

.tree-node-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 14px;
  width: 10px;
  height: 10px;
  background: #fbfdff;
  border-left: 1px solid #dbe7f3;
  border-top: 1px solid #dbe7f3;
  transform: rotate(45deg);
}

.tree-node-tooltip__line + .tree-node-tooltip__line {
  margin-top: 3px;
}

.tree-node-count {
  font-size: 11px;
  color: #64748b;
  flex-shrink: 0;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 600;
  margin-top: 1px;
}

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
  margin-top: 1px;
}

.tree-node-header:hover .focus-btn {
  display: flex;
}

.focus-btn:hover {
  background: #0ea5e9;
  color: #fff;
}

.tree-node-children {
  border-left: 1px solid #e2e8f0;
  margin-left: 17px;
}

.tree-sample {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 12px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s;
}

.tree-sample:hover {
  background: rgba(14, 165, 233, 0.06);
}

.tree-sample-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tree-sample-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.sample-icon {
  font-size: 11px;
  color: #0ea5e9;
  flex-shrink: 0;
}

.tree-sample-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #475569;
}

.tree-sample-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
}

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

.tree-no-match {
  padding: 12px 16px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}
</style>
