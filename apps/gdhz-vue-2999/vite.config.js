import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

const devHost = process.env.VITE_HOST || '0.0.0.0'
const devPort = Number.parseInt(process.env.VITE_PORT || '2999', 10)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium()],
  server: {
    host: devHost,
    port: Number.isFinite(devPort) ? devPort : 2999,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BFF_PROXY_TARGET || 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
})
