import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import topLevelAwait from 'vite-plugin-top-level-await'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0', // 允许所有IP访问
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'vue', 
            'pinia', 
            'vue-router', 
            'element-plus'
          ],
          'crypto': [
            'crypto-js', 
            'jsencrypt'
          ]
        }
      }
    },
    outDir: '../server/web_dist', // 构建输出目录
  },
  optimizeDeps: {
    exclude: ['@fingerprintjs/fingerprintjs']
  }
})
