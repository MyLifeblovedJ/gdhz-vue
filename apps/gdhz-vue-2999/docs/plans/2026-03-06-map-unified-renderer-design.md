# 地图统一 Renderer 设计

**目标**

让 `2999` 首页与相关地图场景在 `2D/3D` 下对以下元素保持同一视觉与交互规范：

- 全量设备
- 真实台风路径、风圈、台风图标
- 船舶图标

约束：

- 以当前 `2D` 视觉为基准
- `3D` 只允许视角与底图不同，不允许图标、线型、颜色、标签、交互规则分叉
- 要有长期可维护结构，不再继续在 `MapContainer.vue` 中写双份渲染逻辑

## 根因

当前差异不是数据层问题，而是渲染责任散落在两套实现里：

- `2D` 使用 Leaflet `divIcon / circleMarker / popup / tooltip`
- `3D` 使用 Cesium `point / billboard / label / polyline`
- 颜色、尺寸、虚线、标签显隐、交互内容分别在两个分支里独立决定

这导致任何一次新需求都会在 `2D/3D` 再次漂移。

## 方案结论

采用“统一 renderer spec + 双端 adapter”结构。

## 结构设计

### 1. 统一 Render Spec

新增共享 spec 层，作为唯一渲染真相源：

- `buildDeviceRenderSpec(devices, options)`
- `buildTyphoonRenderSpec(typhoonData, layerVisibility, options)`
- `buildVesselRenderSpec(vessels, options)`

输出只描述渲染事实，不依赖 Leaflet/Cesium API：

- 点对象：坐标、图标 key、svg/data-uri、尺寸、颜色、描边、发光、zIndex、hover/click 交互 id
- 线对象：点列、颜色、宽度、透明度、虚线模式
- 面对象：polygon 点列、描边、填充、透明度
- 交互对象：tooltip 内容、popup 内容、触发方式、标签内容、标签偏移

### 2. 统一 Icon Factory

新增 `mapIconFactory`：

- 设备图标统一从状态 + 设备类型生成单一 SVG
- 船舶图标统一从状态 + 航向生成单一 SVG
- 台风图标统一从一个源 SVG 输出

Leaflet 与 Cesium 都使用同一 `data-uri`，消除图标分叉。

### 3. 双端 Adapter

只做“翻译”，不做业务判断：

- `applyLeafletRenderSpec(map, spec, registry)`
- `applyCesiumRenderSpec(viewer, spec, registry)`

adapter 的职责：

- 把点/线/面 spec 变成图层或实体
- 绑定统一交互内容
- 维护清理与 diff/update

adapter 不允许决定：

- 点颜色
- 点尺寸
- 路径宽度
- 风圈透明度
- 是否显示标签

### 4. 交互一致性

统一定义以下规则：

- 设备：点击展示相同 popup 内容
- 船舶：点击展示相同 popup 内容
- 台风历史点与预报点：hover 展示相同 tooltip 内容
- 台风当前点：点击展示相同 popup 内容
- 标签显隐规则一致
- 选中态一致

本次以“内容、触发规则、视觉状态一致”为最低要求；若底层库对 tooltip 呈现方式存在轻微容器差异，以共享 HTML 模板和相同偏移/配色补齐。

### 5. 文件边界

新增：

- `src/utils/mapIconFactory.js`
- `src/utils/mapRenderSpec.js`
- `src/utils/mapRenderSpec.test.js`
- `src/utils/mapIconFactory.test.js`

重构：

- `src/components/map/MapContainer.vue`

适配：

- `src/views/HomeOverview.vue`

## 实施策略

1. 先写 spec / icon factory 测试
2. 再抽纯函数 spec
3. 再把 Leaflet 改成消费 spec
4. 再把 Cesium 改成消费同一份 spec
5. 最后校对交互一致性与默认 `3D`

## 验收标准

- 默认进入 `3D`
- 切换到 `2D` 后设备、台风、船舶视觉不变，仅视角与底图不同
- 同一对象在 `2D/3D` 下颜色、尺寸、图标、线型、标签规则一致
- 台风 `7/10/12` 风圈在 `2D/3D` 使用同一多边形点集
- 单测与构建通过
