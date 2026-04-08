# Home Legend And Typhoon Polish Design

> 日期：2026-03-11
> 范围：`apps/gdhz-vue-2999`

## 目标

继续微调首页地图侧边业务信息：

- 图例下沿与左侧 `智能决策` 卡片下沿保持同一水平线
- 台风专题中的 `移速移向` 与 `预计登陆` 在当前窄宽度下呈现更规整、更对称的排版

## 设计结论

- 图例定位改为同时测量右侧 `设备与数据` 与左侧 `智能决策`，由布局工具函数统一计算横向锚点与纵向底边
- 台风专题摘要区改为规则的键值行布局，标签宽度固定，主值与次值分层，保证视觉对齐

## 组件边界

- 修改：`src/utils/homeChromeLayout.js`
- 修改：`src/utils/homeChromeLayout.test.js`
- 新建：`src/utils/typhoonPanel.js`
- 新建：`src/utils/typhoonPanel.test.js`
- 修改：`src/views/HomeOverview.vue`
- 修改：`src/components/map/TyphoonInfo.vue`

## 验收标准

- 图例下沿与 `智能决策` 卡片外边框底边对齐
- 台风专题 `移速移向` 与 `预计登陆` 在当前宽度下的标签与数值对齐明显更规整
