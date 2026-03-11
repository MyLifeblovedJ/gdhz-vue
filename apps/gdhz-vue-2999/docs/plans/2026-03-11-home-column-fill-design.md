# Home Column Fill Design

> 日期：2026-03-11
> 范围：`apps/gdhz-vue-2999`

## 目标

继续优化首页两侧边栏的均衡表现：

- 小屏下允许左右边栏整列滚动，避免海堤风险被压缩到难以浏览
- 大屏和小屏都避免右侧列底部出现明显留白
- 海堤风险卡压缩单卡垂直占用，把城市信息并入标题行

## 设计结论

首页仍保留两列固定宽度布局，但调整列内块的弹性规则：

- 左列继续支持整列滚动，局部滚动只用于超长列表
- 右列将 `海岸观测` 改为吃掉剩余高度的弹性块，视觉上铺满整列
- `CoastalObservationPanel` 的网格在可用高度更大时拉伸行高，而不是只保留固定内容高度
- 海堤风险卡将 `城市` 移到 `海堤名 · 断点名 · 城市` 同一主标题内，删除底部独立位置行

## 组件边界

- 新建：`src/utils/seawallRisk.js`
- 新建：`src/utils/seawallRisk.test.js`
- 修改：`src/components/layout/SeawallRiskPanel.vue`
- 修改：`src/components/layout/CoastalObservationPanel.vue`
- 修改：`src/views/HomeOverview.vue`

## 验收标准

- 12/14 寸屏下，左右列都可以通过整列滚动完整浏览内容
- 右侧列底部不再明显留白，`海岸观测` 能补足剩余高度
- 海堤风险卡标题在一行内包含海堤、断点、城市信息，单卡高度下降
