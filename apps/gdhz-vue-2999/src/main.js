import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { buildModuleUrl } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// 显式设置 Cesium 基础路径，解决资源加载 404 导致的 index.html 回退报错
window.CESIUM_BASE_URL = '/cesium/'
buildModuleUrl.setBaseUrl('/cesium/')

// 导入样式
import './assets/styles/variables.css'
import './assets/styles/animations.css'

// 创建应用
const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)

// 挂载应用
app.mount('#app')
