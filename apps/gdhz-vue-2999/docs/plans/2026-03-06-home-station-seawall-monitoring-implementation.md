# 首页重点站点与海堤值守 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为首页补齐重点站点地图渲染、三段式底部 dock、站点与海堤风险联动，以及设备列表异常数值说明。

**Architecture:** 新增首页专用 mock 数据层与归一化工具层，由 `HomeOverview` 统一持有首页选中态。地图扩展首页重点站点专用图层，底部 dock 拆为左详情、中表格、右海堤风险三部分。设备列表仍保留原设备流，但补充异常说明文案。

**Tech Stack:** Vue 3, Pinia, Leaflet, Cesium, Vitest

---

### Task 1: 写首页数据归一化测试

**Files:**
- Create: `src/utils/homeMonitoring.js`
- Create: `src/utils/homeMonitoring.test.js`
- Create: `src/data/homeMonitoringData.js`

**Step 1: Write the failing test**

覆盖这些行为：

- 站点状态排序与默认选中规则
- 站点说明文案生成
- 站点到岸段、海堤、断点的关联聚合
- 海堤断点的 `漫堤/距堤顶` 说明生成

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 3: Write minimal implementation**

实现首页 mock 数据与纯函数工具，保证测试通过。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 5: Commit**

不提交，继续当前任务。

### Task 2: 接入首页 mock API 与页面状态

**Files:**
- Modify: `src/api/index.js`
- Modify: `src/views/HomeOverview.vue`

**Step 1: Write the failing test**

如可用，补充纯函数测试覆盖 `HomeOverview` 使用的数据映射；否则沿用 Task 1 的扩展测试。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 3: Write minimal implementation**

- 新增 `homeApi.getHomeMonitoringData()`
- 首页加载重点站点数据
- 建立 `selectedHomeStation`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 5: Commit**

不提交，继续当前任务。

### Task 3: 实现首页底部三段 dock

**Files:**
- Create: `src/components/layout/HomeMonitoringDock.vue`
- Create: `src/components/layout/HomeStationDetailCard.vue`
- Create: `src/components/layout/HomeStationTable.vue`
- Create: `src/components/layout/HomeSeawallRiskCard.vue`
- Modify: `src/views/HomeOverview.vue`

**Step 1: Write the failing test**

若组件测试环境不足，至少保持 Task 1 的纯函数测试覆盖展示字段生成。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 3: Write minimal implementation**

- 渲染左详情、中表格、右海堤风险
- 点击表格行向上派发站点选中事件

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 5: Commit**

不提交，继续当前任务。

### Task 4: 扩展地图首页重点站点图层

**Files:**
- Modify: `src/components/map/MapContainer.vue`
- Modify: `src/views/HomeOverview.vue`

**Step 1: Write the failing test**

补充 `homeMonitoring` 工具测试，覆盖地图点位需要的状态色与 popup 文案。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 3: Write minimal implementation**

- 新增首页重点站点图层
- 支持点击站点派发事件
- 暴露 `flyToHomeStation` 与高亮能力

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 5: Commit**

不提交，继续当前任务。

### Task 5: 补齐设备列表异常数值说明并做全量验证

**Files:**
- Modify: `src/components/device/DeviceExplorer.vue`
- Modify: `src/data/mockData.js`
- Modify: `src/utils/homeMonitoring.js`

**Step 1: Write the failing test**

补充测试覆盖设备异常说明生成。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 3: Write minimal implementation**

- 为设备数据补充阈值与说明字段
- 在设备列表中渲染明确数值说明

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeMonitoring.test.js`

**Step 5: Commit**

不提交，继续当前任务。

Plan complete and saved to `docs/plans/2026-03-06-home-station-seawall-monitoring-implementation.md`.
