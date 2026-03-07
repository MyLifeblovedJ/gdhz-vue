<template>
  <main class="screen-root">
    <MapStage
      :map-mode="mapMode"
      :basemap-id="basemapId"
      :city-warnings="cityWarningStates"
      :warning-spec="dashboard.warningSpec"
    />

    <div class="overlay-layer">
      <ShellHeader
        :title="dashboard.title"
        :nav-items="dashboard.navItems"
        :active-key="activeNav"
        @switch-nav="activeNav = $event"
      />

      <section class="middle-layer">
        <WarningSummary :city-warnings="cityWarningStates" :warning-spec="dashboard.warningSpec" />
        <RightTools
          :tools="dashboard.rightTools"
          :map-mode="mapMode"
          :basemap-name="currentBasemapName"
          @toggle-mode="toggleMapMode"
          @switch-basemap="switchBasemap"
        />
      </section>
    </div>

    <div v-if="loading" class="status-mask">正在加载大屏数据...</div>
    <div v-else-if="errorMessage" class="status-mask error">{{ errorMessage }}</div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchScreenBootstrap } from './api/screen'
import ShellHeader from './components/ShellHeader.vue'
import RightTools from './components/RightTools.vue'
import MapStage from './components/MapStage.vue'
import WarningSummary from './components/WarningSummary.vue'
import { buildCityWarningStates } from './utils/warning'

const dashboard = ref({
  title: '',
  navItems: [],
  rightTools: [],
  basemaps: [],
  defaultBasemap: 'satellite',
  warningSpec: {
    zoomBoundaryKm: 150,
    disasterPriority: ['storm-surge', 'tsunami', 'wave', 'red-tide', 'other']
  },
  warningFeed: {
    items: []
  },
  cityOverlays: []
})
const activeNav = ref('')
const mapMode = ref('3D')
const basemapId = ref('satellite')
const loading = ref(true)
const errorMessage = ref('')

// 初始化只从接口加载，不在组件中写死业务数据。
async function loadBootstrap() {
  try {
    const data = await fetchScreenBootstrap()
    dashboard.value = data
    activeNav.value = data.navItems[0]?.key || ''
    basemapId.value = data.defaultBasemap || 'satellite'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '数据加载失败'
  } finally {
    loading.value = false
  }
}

function toggleMapMode() {
  mapMode.value = mapMode.value === '2D' ? '3D' : '2D'
}

function switchBasemap() {
  const basemaps = dashboard.value.basemaps || []
  if (!basemaps.length) {
    return
  }

  const currentIndex = basemaps.findIndex((item) => item.id === basemapId.value)
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % basemaps.length
  basemapId.value = basemaps[nextIndex].id
}

const currentBasemapName = computed(() => {
  const basemap = (dashboard.value.basemaps || []).find((item) => item.id === basemapId.value)
  return basemap?.name || '卫星'
})

const cityWarningStates = computed(() =>
  buildCityWarningStates({
    warningFeed: dashboard.value.warningFeed,
    cityOverlays: dashboard.value.cityOverlays,
    priorityList: dashboard.value.warningSpec?.disasterPriority
  })
)

onMounted(() => {
  loadBootstrap()
})
</script>
