import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

function marineMockPlugin() {
  return {
    name: 'marine-mock-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'GET' && req.url?.startsWith('/api/screen/bootstrap')) {
          const payload = {
            title: '广东海洋灾害风险综合决策系统',
            navItems: [
              { key: 'home', label: '首页' },
              { key: 'storm', label: '风浪潮' },
              { key: 'red-tide', label: '赤潮' },
              { key: 'tsunami', label: '海啸' },
              { key: 'saltwater', label: '咸潮入侵' },
              { key: 'seawater', label: '海水入侵' },
              { key: 'erosion', label: '海岸侵蚀' },
              { key: 'sea-level', label: '海平面上升' },
              { key: 'oil-spill', label: '溢油' }
            ],
            leftPanels: [
              {
                key: 'warning',
                title: '灾害预警',
                subtitle: '2025-07-20 08:00:00  自然资源部南海预报减灾中心',
                emphasis: {
                  title: '风暴潮蓝色预警',
                  detail: '影响区域：茂名市'
                },
                columns: ['预警类型', '等级', '影响区域'],
                rows: [['风暴潮', '蓝色', '茂名市']]
              },
              {
                key: 'station',
                title: '站点预警列表',
                subtitle: '历史预警：查看',
                columns: ['预警站点', '最高潮位(cm)', '出现时间', '预警级别'],
                rows: [['茂名市-水东站', '185', '21日05-07时', '蓝色']]
              },
              {
                key: 'overflow',
                title: '漫堤风险列表',
                subtitle: '海堤选择：全部',
                columns: ['断面名称', '核定站点潮位(cm)', '现状堤顶高程(cm)'],
                rows: [['南海海堤-断面A', '水东站-185', '213.4']]
              }
            ],
            rightTools: [
              { key: 'menu', label: '菜单', kind: 'menu' },
              { key: 'layer', label: '图层', kind: 'normal' },
              { key: 'device', label: '观测设备', kind: 'normal' },
              { key: 'typhoon', label: '台风', kind: 'normal' },
              { key: 'wave', label: '海浪', kind: 'normal' },
              { key: 'current', label: '海流', kind: 'normal' },
              { key: 'temp', label: '海温', kind: 'normal' },
              { key: 'salinity', label: '海盐', kind: 'normal' },
              { key: 'wind', label: '实况风场', kind: 'normal' },
              { key: 'radar', label: '实况雷达', kind: 'normal' },
              { key: 'ship', label: '实况船舶', kind: 'normal' }
            ],
            basemaps: [
              { id: 'satellite', name: '卫星' },
              { id: 'dark', name: '深色' },
              { id: 'ocean', name: '海图' }
            ],
            defaultBasemap: 'satellite',
            warningSpec: {
              zoomBoundaryKm: 150,
              disasterPriority: ['storm-surge', 'tsunami', 'wave', 'red-tide', 'other'],
              iconMap: {
                'storm-surge': {
                  blue: '/icons/disaster/storm-blue.png',
                  yellow: '/icons/disaster/storm-yellow.png',
                  orange: '/icons/disaster/storm-orange.png',
                  red: '/icons/disaster/storm-red.png',
                  info: '/icons/disaster/storm-info.png'
                },
                tsunami: {
                  yellow: '/icons/disaster/tsunami-yellow.png',
                  orange: '/icons/disaster/tsunami-orange.png',
                  red: '/icons/disaster/tsunami-red.png',
                  info: '/icons/disaster/tsunami-info.png'
                },
                wave: {
                  blue: '/icons/disaster/wave-blue.png',
                  yellow: '/icons/disaster/wave-yellow.png',
                  orange: '/icons/disaster/wave-orange.png',
                  red: '/icons/disaster/wave-red.png',
                  info: '/icons/disaster/wave-info.png'
                },
                'red-tide': {
                  yellow: '/icons/disaster/redtide-yellow.png',
                  orange: '/icons/disaster/redtide-orange.png',
                  red: '/icons/disaster/redtide-red.png'
                }
              }
            },
            cityOverlays: [
              {
                cityCode: 'zhanjiang',
                cityName: '湛江市',
                center: [110.36, 21.27],
                boundary: [
                  [109.92, 20.98],
                  [110.77, 20.98],
                  [110.77, 21.67],
                  [109.92, 21.67]
                ]
              },
              {
                cityCode: 'maoming',
                cityName: '茂名市',
                center: [110.92, 21.67],
                boundary: [
                  [110.43, 21.26],
                  [111.43, 21.26],
                  [111.43, 22.1],
                  [110.43, 22.1]
                ]
              },
              {
                cityCode: 'yangjiang',
                cityName: '阳江市',
                center: [111.98, 21.86],
                boundary: [
                  [111.54, 21.4],
                  [112.44, 21.4],
                  [112.44, 22.31],
                  [111.54, 22.31]
                ]
              }
            ],
            warningFeed: {
              generatedAt: '2026-03-04T10:20:00+08:00',
              items: [
                {
                  id: 'warn-001',
                  cityCode: 'maoming',
                  cityName: '茂名市',
                  disasterType: 'storm-surge',
                  level: 'orange',
                  publishTime: '2026-03-04T09:45:00+08:00',
                  expireTime: '2026-03-04T15:00:00+08:00',
                  status: 'active'
                },
                {
                  id: 'warn-002',
                  cityCode: 'maoming',
                  cityName: '茂名市',
                  disasterType: 'wave',
                  level: 'red',
                  publishTime: '2026-03-04T09:50:00+08:00',
                  expireTime: '2026-03-04T14:30:00+08:00',
                  status: 'active'
                },
                {
                  id: 'warn-003',
                  cityCode: 'yangjiang',
                  cityName: '阳江市',
                  disasterType: 'tsunami',
                  level: 'yellow',
                  publishTime: '2026-03-04T08:30:00+08:00',
                  expireTime: '2026-03-04T12:30:00+08:00',
                  status: 'active'
                },
                {
                  id: 'warn-004',
                  cityCode: 'zhanjiang',
                  cityName: '湛江市',
                  disasterType: 'red-tide',
                  level: 'orange',
                  publishTime: '2026-03-04T07:20:00+08:00',
                  expireTime: '2026-03-04T11:00:00+08:00',
                  status: 'cancelled'
                }
              ]
            }
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ code: 0, message: 'ok', data: payload }))
          return
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), cesium(), marineMockPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
})

