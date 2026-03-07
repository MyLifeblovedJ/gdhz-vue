# 2999 首页亮色清晰化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将首页和公共视觉层从残留的深海科技风收敛为明亮、中性、清晰的指挥界面，重点提升文字可读性和整体克制度。

**Architecture:** 先统一设计令牌和公共面板语义，再收敛顶部 Header 与首页关键信息面板。通过 CSS 变量替换旧的蓝灰文字层级，并移除默认发光/液态装饰，把强调色限制到状态和焦点。最后更新设计文档，确保后续组件不再回退到旧体系。

**Tech Stack:** Vue 3、Vite、CSS Variables、Scoped CSS

---

### Task 1: 重建全局文字与色彩令牌

**Files:**
- Modify: `src/assets/styles/variables.css`
- Modify: `src/assets/styles/panels.css`
- Test: `npm run build`

**Step 1: 写出本轮新令牌目标**
- 主文字改为中性深墨色
- 次文字改为中性深灰
- 弱文字改为中性灰
- 默认面板标题不再使用青色强调

**Step 2: 调整 `variables.css`**
- 保留亮色背景体系
- 重新定义 `--text-primary` / `--text-secondary` / `--text-tertiary` / `--text-muted`
- 收紧 `accent` 的默认使用语义
- 让阴影、hover、active 更克制

**Step 3: 调整 `panels.css`**
- 面板标题改为默认使用主文字色
- 弱化顶部发光线和 hover 染色
- 抬升过小字号
- 保留状态 badge 的业务色

**Step 4: 运行构建验证**
Run: `npm run build`
Expected: Vite build 成功

### Task 2: 收敛 Header 视觉语言

**Files:**
- Modify: `src/components/layout/AppHeader.vue`
- Test: `npm run build`

**Step 1: 精简品牌区与导航表现**
- 让品牌标题从渐变字变为清晰实体字
- 降低品牌 logo 的装饰感
- 导航激活态改成简洁、稳定、可读

**Step 2: 移除过强的液态玻璃主导感**
- 允许保留必要交互结构
- 但减少高光、glow、半透明蓝染
- 提升导航、日期、天气的文字对比

**Step 3: 运行构建验证**
Run: `npm run build`
Expected: Vite build 成功

### Task 3: 修正首页关键信息面板的可读性

**Files:**
- Modify: `src/components/map/TyphoonInfo.vue`
- Optional Inspect: `src/views/HomeOverview.vue`
- Test: `npm run build`

**Step 1: 清理 `TyphoonInfo.vue` 的旧蓝灰硬编码**
- 把文本层级改为新令牌体系
- 提升 10px/11px 标签的清晰度
- 保留业务状态色，但减少非必要色相干扰

**Step 2: 调整卡片层级与摘要区**
- 保证嵌入首页时仍然紧凑
- 但避免“淡蓝字 + 小字号 + 半透明背景”叠加造成发虚

**Step 3: 运行构建验证**
Run: `npm run build`
Expected: Vite build 成功

### Task 4: 更新设计系统文档

**Files:**
- Modify: `.interface-design/system.md`

**Step 1: 删除旧深海系统描述**
- 去掉深海、发光控制台、冰蓝文字等默认叙事

**Step 2: 写入新的亮色清晰化规范**
- 明确中性文字层级
- 明确强调色的使用边界
- 明确字号底线与禁止项

### Task 5: 最终验证与差异复核

**Files:**
- Inspect: `git diff -- src/assets/styles/variables.css src/assets/styles/panels.css src/components/layout/AppHeader.vue src/components/map/TyphoonInfo.vue .interface-design/system.md`

**Step 1: 运行完整构建**
Run: `npm run build`
Expected: Vite build 成功

**Step 2: 检查最终差异**
Run: `git diff -- src/assets/styles/variables.css src/assets/styles/panels.css src/components/layout/AppHeader.vue src/components/map/TyphoonInfo.vue .interface-design/system.md`
Expected: 仅包含本轮亮色清晰化相关改动

**Step 3: 汇报结果**
- 说明已改的视觉核心点
- 说明仍未清理的旧风格残留文件
- 给出下一批建议整治对象
