# 地质采样筛选新增 MGGID 设计

**目标**

在地质采样页面左侧边栏的顶部筛选区新增 `mggid` 筛选项，并放在第一位。该筛选项需要沿用当前顶部筛选的联动逻辑：选择任一条件后，其余条件的可选项和计数都基于当前结果集动态更新。

**交互约束**

- `mggid` 放在顶部筛选第一位
- `mggid` 与机构、船只、设备、日期保持双向联动
- 同一个 `mggid` 下可能对应多条记录，筛选命中后应保留该 `mggid` 下全部匹配记录
- 树结构浏览方式保持不变，仍按 `机构 -> 船只 -> 航次 -> 样品` 展示

**实现方式**

1. 在 `GeologyFilterPanel.vue` 的 `filters`、`effectiveFilters`、`filtersExcept`、`hasActiveFilter`、`clearFilters`、`onFilterChange` 中接入 `mggid`
2. 新增 `mggidOptions` 计算属性，生成方式与现有下拉一致
3. 在 `filterByTopFilters` 中增加 `mggid` 条件，作为顶部筛选链路的一部分
4. 不修改树组件和地图高亮逻辑，因为 `mggid` 已是记录字段，现有一组多点能力已具备

**验证**

- 工具层单测覆盖 `mggid` 过滤时保留同组多条记录
- 手动验证顶部第一个下拉为 `mggid`，且与其它条件正常联动
