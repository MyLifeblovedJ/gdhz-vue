# 地质采样双图层业务化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `apps/wuhan` 中实现地质采样原始/处理后双点图层、字段筛选树、字段着色图例、以及基于 `mggid` 的组内联动高亮。

**Architecture:** 新增 geology 业务 mock 数据、API 和 store 状态层，再把过滤和着色计算收敛到独立 util，由 `MapContainer.vue` 通过统一 render spec 渲染 2D/3D 点位。`SeaConditionHome.vue` 负责接入图层开关与 geology 面板，图例侧栏使用独立组件消费 store 状态，不在页面里写散逻辑。

**Tech Stack:** Vue 3, Pinia, Leaflet, Cesium, Vite, Vitest

---

### Task 1: 建 geology mock 数据与 API

**Files:**
- Create: `apps/wuhan/src/data/geologySamplingMock.js`
- Modify: `apps/wuhan/src/api/index.js`
- Test: `apps/wuhan/src/data/geologySamplingMock.test.js`

**Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest'
import { buildMockGeologySamplingPayload } from './geologySamplingMock'

describe('buildMockGeologySamplingPayload', () => {
  it('returns raw and processed records with shared mggid groups', () => {
    const payload = buildMockGeologySamplingPayload()
    expect(payload.raw.length).toBeGreaterThan(0)
    expect(payload.processed.length).toBeGreaterThan(0)
    expect(payload.raw[0]).toEqual(expect.objectContaining({
      datasetType: 'raw',
      mggid: expect.any(String),
      ship: expect.any(String),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    }))
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/geologySamplingMock.test.js`

Expected: FAIL with missing module or missing export.

**Step 3: Write minimal implementation**

```js
export function buildMockGeologySamplingPayload() {
  return {
    raw: [],
    processed: [],
  }
}
```

Then expand to:
- generate stable raw/processed point arrays
- ensure one `mggid` maps to multiple `fid/objectid` points
- add processed-only metadata such as `folderPath`, `pdfCount`, `excelCount`
- expose helper for field-value aggregation

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/geologySamplingMock.test.js`

Expected: PASS.

### Task 2: 建 geology store 状态与派生数据

**Files:**
- Modify: `apps/wuhan/src/stores/app.js`
- Test: `apps/wuhan/src/stores/app.geology.test.js`
- Reference: `apps/wuhan/src/api/index.js`

**Step 1: Write the failing test**

```js
import { setActivePinia, createPinia } from 'pinia'
import { describe, expect, it, beforeEach } from 'vitest'
import { useAppStore } from './app'

describe('app geology state', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('filters visible geology records by visible layers and selected field values', async () => {
    const store = useAppStore()
    await store.fetchGeologySampling()
    store.setGeologyLayerVisibility('raw', true)
    store.setGeologyLayerVisibility('processed', false)
    store.setGeologyFilterField('ship')
    store.setGeologySelectedValues('ship', ['R/V Melville'])
    expect(store.visibleGeologyRecords.every(r => r.datasetType === 'raw')).toBe(true)
    expect(new Set(store.visibleGeologyRecords.map(r => r.ship))).toEqual(new Set(['R/V Melville']))
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/app.geology.test.js`

Expected: FAIL with missing store state or actions.

**Step 3: Write minimal implementation**

```js
const geology = ref({
  layers: { rawVisible: false, processedVisible: false },
  colorBy: 'ship',
  filterField: 'ship',
  filterMode: 'multiple',
  selectedValuesByField: {},
  activeMggid: null,
  records: { raw: [], processed: [] },
})
```

Then add:
- `fetchGeologySampling`
- `setGeologyLayerVisibility`
- `setGeologyColorBy`
- `setGeologyFilterField`
- `setGeologyFilterMode`
- `setGeologySelectedValues`
- `setActiveGeologyMggid`
- computed `visibleGeologyRecords`
- computed `geologyFilterTreeItems`
- computed `geologyColorLegendItems`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/app.geology.test.js`

Expected: PASS.

### Task 3: 抽离 geology 过滤、计数、颜色与高亮 util

**Files:**
- Create: `apps/wuhan/src/utils/geologySampling.js`
- Test: `apps/wuhan/src/utils/geologySampling.test.js`

**Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest'
import {
  createStableCategoryColorMap,
  filterGeologyRecords,
  buildGeologyHighlightState,
} from './geologySampling'

describe('geologySampling utils', () => {
  it('assigns stable colors for the selected color field', () => {
    const records = [{ ship: 'A' }, { ship: 'B' }, { ship: 'A' }]
    const map = createStableCategoryColorMap(records, 'ship')
    expect(map.A).toBeTruthy()
    expect(map.A).toBe(map.A)
    expect(map.A).not.toBe(map.B)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/geologySampling.test.js`

Expected: FAIL with missing module.

**Step 3: Write minimal implementation**

```js
export function filterGeologyRecords(records) {
  return records
}
```

Then add:
- stable palette hashing by field value
- layer-aware filtering
- single-select vs multi-select behavior helpers
- legend tree item builders
- `activeMggid` highlight state calculator returning `selected | linked | dimmed | normal`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/geologySampling.test.js`

Expected: PASS.

### Task 4: 扩展 render spec 支持 geology 双图层与 mggid 联动

**Files:**
- Modify: `apps/wuhan/src/utils/mapRenderSpec.js`
- Modify: `apps/wuhan/src/utils/mapRenderSpec.test.js`
- Reference: `apps/wuhan/src/utils/geologySampling.js`

**Step 1: Write the failing test**

```js
it('builds geology point specs with dataset-specific shapes and linked mggid emphasis', () => {
  const spec = buildMapRenderSpec({
    geologyRecords: [
      { pointId: 'r-1', datasetType: 'raw', latitude: 20, longitude: 110, ship: 'A', mggid: 'M1' },
      { pointId: 'p-1', datasetType: 'processed', latitude: 20.1, longitude: 110.1, ship: 'A', mggid: 'M1' },
    ],
    geologyStyle: { colorBy: 'ship', activeMggid: 'M1' },
  })
  expect(spec.geology.length).toBe(2)
  expect(spec.geology[0].sourceType).toBe('geology')
  expect(spec.geology[0].visualVariant).toBe('raw')
  expect(spec.geology[1].visualVariant).toBe('processed')
  expect(spec.geology[0].highlightState).toBeTruthy()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: FAIL because geology spec is absent.

**Step 3: Write minimal implementation**

```js
export function buildMapRenderSpec(input) {
  return {
    devices: [],
    homeStations: [],
    typhoon: { points: [], lines: [], polygons: [], markers: [] },
    vessels: [],
    geology: [],
  }
}
```

Then expand to:
- add `buildGeologyRenderSpec`
- include stable color, dataset variant, highlight state, popup text
- preserve existing devices/typhoon/vessels behavior unchanged

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: PASS.

### Task 5: 让 `MapContainer.vue` 渲染 geology 点并处理点击联动

**Files:**
- Modify: `apps/wuhan/src/components/map/MapContainer.vue`
- Modify: `apps/wuhan/src/components/map/MapContainer.test.js`
- Reference: `apps/wuhan/src/utils/mapRenderSpec.js`

**Step 1: Write/extend failing test**

- 断言源码或单测中已接入 geology render spec
- 断言点击 geology 点会向外暴露点击事件或直接更新 geology active mggid
- 断言 2D/3D 渲染都能消费 geology spec 字段

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: FAIL if geology hooks are missing.

**Step 3: Write minimal implementation**

- 新增 Leaflet geology marker layer
- 新增 Cesium geology entity 渲染
- 根据 `visualVariant` 区分原始/处理后点形态
- 根据 `highlightState` 设置尺寸、描边、透明度和 z-index
- 点击 geology 点时：
  - 记录当前点
  - 设置 `activeMggid`
  - 若需要，向页面抛出 geology click payload
- 点击空白地图时清空 `activeMggid`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: PASS.

### Task 6: 新增 geology 图例与左侧栏业务组件

**Files:**
- Create: `apps/wuhan/src/components/map/GeologyLayerPanel.vue`
- Create: `apps/wuhan/src/components/map/GeologyLegendPanel.vue`
- Test: `apps/wuhan/src/components/map/GeologyLegendPanel.test.js`
- Modify: `apps/wuhan/src/views/SeaConditionHome.vue`
- Modify: `apps/wuhan/src/views/SeaConditionHome.geology-sidebar.test.js`

**Step 1: Write the failing test**

- 断言左侧栏存在原始/处理后图层开关
- 断言存在“筛选字段”“筛选模式”“着色字段”控件
- 断言字段值树按当前可见图层渲染计数
- 断言出现当前 `mggid` 信息摘要区

**Step 2: Run test to verify it fails**

Run: `npm test -- src/views/SeaConditionHome.geology-sidebar.test.js src/components/map/GeologyLegendPanel.test.js`

Expected: FAIL because new components and structure are absent.

**Step 3: Write minimal implementation**

- 把原有两行 geology checkbox 升级为 `GeologyLayerPanel`
- 在图例区挂载 `GeologyLegendPanel`
- 通过 store 驱动字段、模式和值树
- 为当前激活的 `mggid` 渲染简要信息卡

**Step 4: Run test to verify it passes**

Run: `npm test -- src/views/SeaConditionHome.geology-sidebar.test.js src/components/map/GeologyLegendPanel.test.js`

Expected: PASS.

### Task 7: 全链路接线与初始化默认值

**Files:**
- Modify: `apps/wuhan/src/views/SeaConditionHome.vue`
- Modify: `apps/wuhan/src/stores/app.js`
- Modify: `apps/wuhan/src/api/index.js`

**Step 1: Write/verify failing expectation**

- 当前页面初始化后 geology 数据尚未自动加载
- geology 默认图层开关和默认着色字段未固定

**Step 2: Run focused tests**

Run: `npm test -- src/stores/app.geology.test.js src/views/SeaConditionHome.geology-sidebar.test.js`

Expected: FAIL before wiring is complete.

**Step 3: Write minimal implementation**

- 在 `initializeData` 中接入 geology mock 数据获取
- 设定默认值：
  - `rawVisible = false`
  - `processedVisible = false`
  - `filterField = 'ship'`
  - `colorBy = 'ship'`
- 保持原有设备、台风、船舶逻辑不被破坏

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/app.geology.test.js src/views/SeaConditionHome.geology-sidebar.test.js`

Expected: PASS.

### Task 8: 验证

**Files:**
- Verify only

**Step 1: Run focused tests**

Run: `npm test -- src/data/geologySamplingMock.test.js src/utils/geologySampling.test.js src/stores/app.geology.test.js src/utils/mapRenderSpec.test.js src/components/map/MapContainer.test.js src/components/map/GeologyLegendPanel.test.js src/views/SeaConditionHome.geology-sidebar.test.js`

Expected: PASS.

**Step 2: Run build**

Run: `npm run build`

Expected: build succeeds.

**Step 3: Manual checks**

- 左侧图层区可独立切换原始/处理后数据
- 图例区能切换筛选字段、筛选模式和着色字段
- 只开单层时，值树和颜色项随单层数据变化
- 双层同时显示时，同字段同值保持同色
- 点击一个 geology 点后，同 `mggid` 的其它可见点明显联动高亮
- 点击空白处后恢复默认样式
