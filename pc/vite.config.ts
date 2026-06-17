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
  build: {
    outDir: 'dist',
    emptyOutDir: true,
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
