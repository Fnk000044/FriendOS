import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  // esbuild：生产构建 drop console.log/debugger（保留 error/warn 便于排查）
  // 14 处 console.log 残留主要在 seedDemoData 调试路径，生产无意义且泄漏细节
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : [],
  },
  build: {
    outDir: 'dist',
<<<<<<< HEAD
    // 构建环境适配：emptyOutDir=false，dist 由构建前脚本/手动清空，
    // 避免 vite 内部 rmSync 触发沙箱 safe-delete 拦截导致构建失败
    emptyOutDir: false,
=======
    emptyOutDir: true,
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    // Target Electron's Chromium version
    target: 'chrome120',
    // Enable CSS code splitting
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-data': ['dexie', 'dexie-react-hooks', 'zustand'],
          'vendor-charts': ['recharts'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
})
