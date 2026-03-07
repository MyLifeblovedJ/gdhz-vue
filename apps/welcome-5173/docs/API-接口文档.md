# 海洋灾害大屏接口文档（welcome-5173）

## 1. 说明
- 服务形态：前端 Vite 本地 Mock（开发阶段）
- 数据协议：`application/json`
- 统一返回结构：
```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

## 2. 初始化接口
- 路径：`/api/screen/bootstrap`
- 方法：`GET`
- 用途：获取大屏首屏渲染所需的标题、导航、右侧演示工具、底图配置、预警摘要与地图联动数据。

### 2.1 请求参数
- 无

### 2.2 响应字段
- `title: string` 系统标题
- `navItems: Array<{ key: string; label: string }>` 顶部导航
- `rightTools: Array<{ key: string; label: string; kind: 'menu' | 'normal' }>` 右侧工具按钮（演示态）
- `basemaps: Array<{ id: string; name: string }>` 底图配置（用于循环切换）
- `defaultBasemap: string` 默认底图 id（当前 `satellite`）
- `warningSpec: { zoomBoundaryKm: number; disasterPriority: string[]; iconMap: Record<string, Record<string, string>> }` 预警渲染规格
- `cityOverlays: Array<{ cityCode: string; cityName: string; center: [number, number]; boundary: Array<[number, number]> }>` 城市中心点与边界坐标
- `warningFeed: { generatedAt: string; items: WarningItem[] }` 预警数据源
- `WarningItem: { id: string; cityCode: string; cityName: string; disasterType: 'storm-surge' | 'tsunami' | 'wave' | 'red-tide' | 'other'; level: 'red' | 'orange' | 'yellow' | 'blue' | 'info'; publishTime: string; expireTime: string; status: 'active' | 'cancelled' }`

### 2.3 响应示例
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "title": "广东海洋灾害风险综合决策系统",
    "navItems": [{ "key": "home", "label": "首页" }],
    "rightTools": [{ "key": "menu", "label": "菜单", "kind": "menu" }],
    "basemaps": [
      { "id": "satellite", "name": "卫星" },
      { "id": "dark", "name": "深色" },
      { "id": "ocean", "name": "海图" }
    ],
    "defaultBasemap": "satellite",
    "warningSpec": {
      "zoomBoundaryKm": 150,
      "disasterPriority": ["storm-surge", "tsunami", "wave", "red-tide", "other"],
      "iconMap": {
        "storm-surge": { "blue": "/icons/disaster/storm-blue.png", "red": "/icons/disaster/storm-red.png" },
        "tsunami": { "yellow": "/icons/disaster/tsunami-yellow.png" }
      }
    },
    "cityOverlays": [
      {
        "cityCode": "maoming",
        "cityName": "茂名市",
        "center": [110.92, 21.67],
        "boundary": [[110.43, 21.26], [111.43, 21.26], [111.43, 22.1], [110.43, 22.1]]
      }
    ],
    "warningFeed": {
      "generatedAt": "2026-03-04T10:20:00+08:00",
      "items": [
        {
          "id": "warn-001",
          "cityCode": "maoming",
          "cityName": "茂名市",
          "disasterType": "storm-surge",
          "level": "orange",
          "publishTime": "2026-03-04T09:45:00+08:00",
          "expireTime": "2026-03-04T15:00:00+08:00",
          "status": "active"
        }
      ]
    }
  }
}
```

## 3. 错误码
- `0`：成功
- `500`：服务内部错误（当前 mock 未主动返回，可在后续联调补充）

## 4. 联调约定
- 所有业务数据必须来自接口或 Mock，组件内禁止写死业务值。
- 后端接口就绪后，仅替换 `/api/screen/bootstrap` 实现，不修改组件字段契约。
- 预警撤销请返回 `status=cancelled`，前端会立即移除对应城市高亮与摘要项。

## 5. 地图底图配置
- 默认底图：天地图卫星影像（`img_w`）+ 注记（`cia_w`），id 为 `satellite`。
- 环境变量：`VITE_TIANDITU_TOKEN`。
- 推荐做法：在项目根目录创建 `.env.local`，写入：
```env
VITE_TIANDITU_TOKEN=你的天地图token
```
- 右侧“图层”按钮会按 `basemaps` 数组循环切换底图。
- 若 token 未配置或网络不可达，前端会自动回退到 OSM/Ion 底图，保障页面可用。
