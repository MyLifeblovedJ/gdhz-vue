# 2999 导航与图例精修 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将首页导航重构为更高级的 briefing rail，并把图例移到设备与数据区域右侧，提升顶部秩序感和图例归属感。

**Architecture:** 通过重写 `AppHeader.vue` 的导航表达方式，移除导航容器玻璃化处理，改为轻量基线和稳态激活样式。通过扩展 `homeViewportProfile` 与 `HomeOverview` 的定位变量，把图例从底部留白区转移到左列设备区右侧，再统一 `MapLegend` 的样式细节，保证它是业务侧注而不是地图插件。

**Tech Stack:** Vue 3、Vite、CSS Variables、Scoped CSS、Vitest

---

### Task 1: 图例位置规则 TDD

**Files:**
- Modify: `src/utils/homeViewportProfile.test.js`
- Modify: `src/utils/homeViewportProfile.js`

**Step 1: 写失败测试**
- 更新 legend 偏移断言，体现“靠左列右侧”的新定位策略

**Step 2: 运行测试确认失败**
Run: `npm run test -- homeViewportProfile`
Expected: legend offset 断言失败

**Step 3: 最小实现**
- 在 `homeViewportProfile.js` 中更新图例偏移值

**Step 4: 运行测试确认通过**
Run: `npm run test -- homeViewportProfile`
Expected: 全部通过

### Task 2: 导航重设计

**Files:**
- Modify: `src/components/layout/AppHeader.vue`

**Step 1: 移除导航容器的玻璃面板语义**
- 不保留胶囊背景、pill 容器、玻璃块感

**Step 2: 实现 briefing rail**
- 加大横向节奏
- 加入细基线和稳态下划线
- 激活态靠字重、颜色、短划线表达
- 确保图标项也统一语义

**Step 3: 继续减轻 Header 厚度**
- 保持可读，不抢内容层

### Task 3: 图例移位与视觉修正

**Files:**
- Modify: `src/views/HomeOverview.vue`
- Modify: `src/components/map/MapLegend.vue`

**Step 1: 把图例定位变量接入首页**
- 将图例定位到左列 `设备与数据` 右侧地图留白区

**Step 2: 修正图例样式**
- 缩小工具盒感
- 让它更像业务侧注
- 与当前亮色中性系统一致

**Step 3: 检查与工具栏、左右大面板避让**
- 保证不挤压主内容区

### Task 4: 最终验证

**Files:**
- Inspect: `git diff -- src/components/layout/AppHeader.vue src/views/HomeOverview.vue src/components/map/MapLegend.vue src/utils/homeViewportProfile.js src/utils/homeViewportProfile.test.js`

**Step 1: 运行测试**
Run: `npm run test -- homeViewportProfile`
Expected: 全部通过

**Step 2: 运行构建**
Run: `npm run build`
Expected: 构建成功

**Step 3: 汇报结果**
- 说明导航新风格
- 说明图例新位置
- 说明仍需后续联调的点
