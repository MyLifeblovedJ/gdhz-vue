# Home Header Emphasis Design

> 日期：2026-03-17
> 范围：`apps/gdhz-vue-2999`

## 目标

- 仅增强首页头部导航栏的系统标题与主导航清晰度
- 放大系统标题、导航文字、导航图标，并增加间距
- 让首页左侧品牌区视觉宽度与首页左栏宽度对齐
- 保持现有白底头部与整体配色，不重做视觉风格

## 设计结论

- `AppHeader.vue` 增加首页专属 `home-emphasis` 状态
- 首页状态下：
  - 标题字号提升到约 `26px`
  - logo 尺寸提升到约 `56px`
  - 品牌区图标与文字间距提升到 `18-20px`
  - 导航常态字号提升到约 `18px`
  - 导航激活态字号提升到约 `20px`
  - 导航按钮之间 gap 提升到约 `30-36px`
  - header 高度提升到约 `88px`
- 首页头部品牌区宽度采用与 `HomeOverview` 左栏相同的宽度计算逻辑，实现视觉对齐
- 为避免放大后的头部压住首页内容，首页顶部安全距同步上调

## 影响范围

- 修改：`src/components/layout/AppHeader.vue`
- 修改：`src/views/HomeOverview.vue`
- 新增测试：`src/components/layout/AppHeader.test.js`

## 验收标准

- 首页系统标题明显更大、更清晰
- 首页主导航字号与间距明显增大
- 首页品牌区宽度与左侧栏视觉对齐
- 风浪潮页与其它页面头部不被放大逻辑误伤
