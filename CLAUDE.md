# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言规则 (Language Rules)

**强制要求**：所有思考、回复、代码注释必须使用中文，即使用户输入英文也不例外。

## 项目简介

广东省海洋灾害综合决策系统 - 前端 Vue 项目，用于海洋灾害监测和态势感知。当前为纯前端实现，使用 Mock 数据模拟后端接口。

## 常用命令

```bash
# 进入 Vue 项目目录
cd gdhz-vue

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 技术栈

- Vue 3 + Vite 7
- Pinia 状态管理
- Vue Router 4
- ECharts 6 图表库
- Leaflet 地图库
- VueUse 工具库

## 项目架构

```
gdhz-vue/src/
├── api/              # API 接口层（当前为 Mock 实现）
├── components/
│   ├── common/       # 通用组件（时间选择器、图表、弹窗等）
│   ├── layout/       # 布局组件（头部、侧边栏、底部控制等）
│   ├── map/          # 地图相关组件
│   ├── device/       # 设备管理组件
│   ├── decision/     # 决策面板组件
│   └── model/        # 模型集成组件
├── views/            # 页面视图（Overview、Surge、Wave 等灾害类型页面）
├── stores/           # Pinia 状态管理
├── router/           # 路由配置
├── data/             # Mock 数据和设备配置
└── assets/styles/    # 全局样式（CSS 变量、动画）
```

## API 接口设计

所有 API 接口定义在 `src/api/index.js`，当前使用 Mock 数据，后续对接真实 API 时只需修改此文件：

- `deviceApi` - 设备列表、详情、统计
- `alertApi` - 预警列表、滚动消息
- `riskApi` - 风险评估数据
- `timelineApi` - 时间轴数据

接口基础 URL 通过环境变量 `VITE_API_BASE_URL` 配置。

## 路由结构

主要页面路由（定义在 `src/router/index.js`）：
- `/` - 态势感知（Overview）
- `/surge` - 风暴潮
- `/wave` - 海浪
- `/redtide` - 赤潮
- `/tsunami` - 海啸
- 其他灾害类型使用 Placeholder 组件

## 状态管理

全局状态集中在 `src/stores/app.js`：
- 设备数据和选中状态
- 预警信息和滚动消息
- 图层可见性控制
- 横幅展开/折叠状态
- 当前页面和时间

## 开发约定

- 新增 API 时，先在 `src/api/index.js` 添加 Mock 实现，保持接口签名稳定
- Mock 数据放在 `src/data/mockData.js`
- 设备类型配置在 `src/data/deviceConfig.js`
- 组件按功能分类放入对应子目录
