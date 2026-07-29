import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/redeem': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/devices': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/dashboard': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/weather': {
        target: 'https://uapis.cn',
        changeOrigin: true,
        rewrite: (requestPath) =>
          requestPath.replace(/^\/api\/weather/, '/api/v1/misc/weather'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;\n`,
      },
    },
  },
})
