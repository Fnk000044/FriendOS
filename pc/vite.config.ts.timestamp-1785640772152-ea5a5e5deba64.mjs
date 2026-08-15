// vite.config.ts
import { defineConfig } from "file:///E:/FriendOS/pc/node_modules/vite/dist/node/index.js";
import react from "file:///E:/FriendOS/pc/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "E:\\FriendOS\\pc";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  server: {
    port: 5173,
    open: false
  },
  // esbuild：生产构建 drop console.log/debugger（保留 error/warn 便于排查）
  // 14 处 console.log 残留主要在 seedDemoData 调试路径，生产无意义且泄漏细节
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["debugger"] : [],
    pure: process.env.NODE_ENV === "production" ? ["console.log", "console.debug"] : []
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Target Electron's Chromium version
    target: "chrome120",
    // Enable CSS code splitting
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks for better caching
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["lucide-react"],
          "vendor-data": ["dexie", "dexie-react-hooks", "zustand"],
          "vendor-charts": ["recharts"]
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1e3
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxGcmllbmRPU1xcXFxwY1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcRnJpZW5kT1NcXFxccGNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0ZyaWVuZE9TL3BjL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIGJhc2U6ICcuLycsXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogNTE3MyxcclxuICAgIG9wZW46IGZhbHNlLFxyXG4gIH0sXHJcbiAgLy8gZXNidWlsZFx1RkYxQVx1NzUxRlx1NEVBN1x1Njc4NFx1NUVGQSBkcm9wIGNvbnNvbGUubG9nL2RlYnVnZ2VyXHVGRjA4XHU0RkREXHU3NTU5IGVycm9yL3dhcm4gXHU0RkJGXHU0RThFXHU2MzkyXHU2N0U1XHVGRjA5XHJcbiAgLy8gMTQgXHU1OTA0IGNvbnNvbGUubG9nIFx1NkI4Qlx1NzU1OVx1NEUzQlx1ODk4MVx1NTcyOCBzZWVkRGVtb0RhdGEgXHU4QzAzXHU4QkQ1XHU4REVGXHU1Rjg0XHVGRjBDXHU3NTFGXHU0RUE3XHU2NUUwXHU2MTBGXHU0RTQ5XHU0RTE0XHU2Q0M0XHU2RjBGXHU3RUM2XHU4MjgyXHJcbiAgZXNidWlsZDoge1xyXG4gICAgZHJvcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/IFsnZGVidWdnZXInXSA6IFtdLFxyXG4gICAgcHVyZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5kZWJ1ZyddIDogW10sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgIC8vIFRhcmdldCBFbGVjdHJvbidzIENocm9taXVtIHZlcnNpb25cclxuICAgIHRhcmdldDogJ2Nocm9tZTEyMCcsXHJcbiAgICAvLyBFbmFibGUgQ1NTIGNvZGUgc3BsaXR0aW5nXHJcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIC8vIFNwbGl0IHZlbmRvciBjb2RlIGludG8gc2VwYXJhdGUgY2h1bmtzIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgJ3ZlbmRvci1yZWFjdCc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgICd2ZW5kb3ItdWknOiBbJ2x1Y2lkZS1yZWFjdCddLFxyXG4gICAgICAgICAgJ3ZlbmRvci1kYXRhJzogWydkZXhpZScsICdkZXhpZS1yZWFjdC1ob29rcycsICd6dXN0YW5kJ10sXHJcbiAgICAgICAgICAndmVuZG9yLWNoYXJ0cyc6IFsncmVjaGFydHMnXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIEluY3JlYXNlIGNodW5rIHNpemUgd2FybmluZyBsaW1pdFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa08sU0FBUyxvQkFBb0I7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUZ4QixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBLEVBR0EsU0FBUztBQUFBLElBQ1AsTUFBTSxRQUFRLElBQUksYUFBYSxlQUFlLENBQUMsVUFBVSxJQUFJLENBQUM7QUFBQSxJQUM5RCxNQUFNLFFBQVEsSUFBSSxhQUFhLGVBQWUsQ0FBQyxlQUFlLGVBQWUsSUFBSSxDQUFDO0FBQUEsRUFDcEY7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQTtBQUFBLElBRWIsUUFBUTtBQUFBO0FBQUEsSUFFUixjQUFjO0FBQUEsSUFDZCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGNBQWM7QUFBQSxVQUNaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxhQUFhLENBQUMsY0FBYztBQUFBLFVBQzVCLGVBQWUsQ0FBQyxTQUFTLHFCQUFxQixTQUFTO0FBQUEsVUFDdkQsaUJBQWlCLENBQUMsVUFBVTtBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsdUJBQXVCO0FBQUEsRUFDekI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
