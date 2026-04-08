# wuhan (海洋渊听智能管理系统)

这是海洋渊听智能管理系统的独立前端项目，最初从 `apps/gdhz-vue-2999` 拆分而来。

## 端口

- 默认开发端口：`2888`
- 可通过环境变量覆盖：`VITE_PORT`

## 启动

```bash
npm run dev
```

## 说明

- 本项目目录与来源模块完全隔离，可独立开发、构建与部署。
- 系统名称：海洋渊听智能管理系统

## 架构决策（必须遵守）

- Cesium 3D 黑屏修复与防回退约束：`docs/adr/0001-cesium-base-url-hardening.md`
- ADR 索引：`docs/adr/README.md`
