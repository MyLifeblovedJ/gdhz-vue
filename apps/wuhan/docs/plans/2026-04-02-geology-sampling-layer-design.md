# 地质采样双图层业务化设计

**目标**

在 `apps/wuhan` 的地质采样页面中，把 NOAA MGG 采样点字段结构接入为可业务化使用的地图图层。页面需要同时支持原始数据和处理后数据两个点图层，并围绕 `ship`、`cruise`、`device`、`yearmoda`、`title`、`institution` 六个字段提供显示控制、随机稳定着色、树形图例筛选，以及基于 `mggid` 的组内联动高亮。

**范围**

- 仅修改 `apps/wuhan`
- 使用 mock 接口提供原始数据与处理后数据
- 地图点以 `fid/objectid` 粒度渲染
- `mggid` 作为点位分组键
- 不在本次实现真实文件夹/PDF/Excel 解析详情，只预留处理后数据扩展结构

**设计**

1. 地质采样建立为独立业务域，包含两个数据集：
   - `raw`：原始 NOAA 采样点
   - `processed`：处理后采样点
2. 两个图层共用同一套字段控制模型：
   - `ship`
   - `cruise`
   - `device`
   - `yearmoda`
   - `title`
   - `institution`
3. 地图上的一个点对应一条 `fid/objectid` 级记录；一个 `mggid` 对应多个点。
4. 点击任一点时，不只高亮当前点，而是高亮所有当前可见、且 `mggid` 相同的点，允许跨 `raw/processed` 图层联动。
5. 图层显隐独立：
   - 只显示原始数据
   - 只显示处理后数据
   - 原始和处理后同时显示
6. 筛选和着色逻辑共用，但始终只作用于当前可见图层；图例计数与颜色项也只根据当前可见数据动态生成。
7. 图例区拆成两个业务块，避免“筛选字段”和“着色字段”互相打架：
   - 筛选树：选择字段、切换单选/多选、按字段值控制显示/隐藏
   - 着色图例树：选择当前着色字段，展示字段值到颜色的稳定映射
8. 地图样式区分两类数据源：
   - `raw` 使用实心点
   - `processed` 使用空心点或形态差异点
   在颜色相同的前提下，仍能辨认数据来源
9. 处理后数据保留扩展元信息结构，例如文件夹路径、PDF 数量、Excel 数量、解析状态，但这些字段本次不进入地图筛选树。
10. 所有 mock 数据都通过 API 返回，页面代码不直接 import 静态数组。

**状态模型**

- `geology.layers.rawVisible`
- `geology.layers.processedVisible`
- `geology.colorBy`
- `geology.filterField`
- `geology.filterMode`
- `geology.selectedValuesByField`
- `geology.activeMggid`
- `geology.records.raw`
- `geology.records.processed`

**交互规则**

1. 用户在“图层”区域勾选原始数据/处理后数据，决定当前参与渲染的数据集。
2. 用户在“筛选树”中选择某一字段作为过滤字段，并对字段值进行单选或多选。
3. 用户在“着色图例树”中选择某一字段作为当前着色字段，同一时刻只能按一个字段着色。
4. 当只显示一个图层时，筛选树和着色树仅基于该图层生成。
5. 当两个图层同时显示时，筛选树和着色树合并统计，并允许同字段同值在两个图层中保持同色。
6. 点击任一点后：
   - 当前点进入选中态
   - 同一 `mggid` 的其余可见点进入联动态
   - 其他点降透明度
7. 点击地图空白处或关闭详情后，清除 `activeMggid`，恢复默认样式。

**接口约定**

1. 新增地质采样 API，返回：
   - 原始点列表
   - 处理后点列表
   - 字段维度统计
2. 每条记录标准化为统一结构，至少包括：
   - `pointId`
   - `datasetType`
   - `fid`
   - `objectid`
   - `latitude`
   - `longitude`
   - `ship`
   - `cruise`
   - `sample`
   - `device`
   - `yearmoda`
   - `title`
   - `fgdcid`
   - `institution`
   - `mggid`
3. 处理后数据额外允许带：
   - `folderPath`
   - `pdfCount`
   - `excelCount`
   - `parseStatus`

**测试策略**

- 为 mock 数据生成与 API 增加单测，锁定字段完整性、`mggid` 分组和可见层聚合逻辑
- 为 geology store 增加单测，覆盖图层显隐、筛选模式、着色字段切换和联动状态
- 为 render spec 增加单测，覆盖：
  - 原始/处理后点样式差异
  - 颜色映射稳定性
  - `activeMggid` 联动高亮
- 为 `SeaConditionHome.vue` 左侧栏结构增加源码测试，锁定双图层开关、筛选树、着色树和组内信息区
- 为 `MapLegend.vue` 或新 geology legend 组件增加组件测试，锁定单选/多选与计数展示

**实现备注**

- 当前仓库工作树已有大量未提交改动，本次先写设计与实现，不在中途单独提交设计文档，避免把无关文件带入提交。
