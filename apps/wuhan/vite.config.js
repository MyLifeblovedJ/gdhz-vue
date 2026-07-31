import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

const devHost = process.env.VITE_HOST || '0.0.0.0'
const devPort = Number.parseInt(process.env.VITE_PORT || '2888', 10)
const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), cesium()],
  server: {
    host: devHost,
    port: Number.isFinite(devPort) ? devPort : 2888,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BFF_PROXY_TARGET || 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
})
