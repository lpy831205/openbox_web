import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
    server: {
    host: '0.0.0.0', // 允许所有IP访问
    port: 3000
  }
})
