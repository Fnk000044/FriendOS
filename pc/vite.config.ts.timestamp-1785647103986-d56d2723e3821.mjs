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
    // 构建环境适配：emptyOutDir=false，dist 由构建前脚本/手动清空，
    // 避免 vite 内部 rmSync 触发沙箱 safe-delete 拦截导致构建失败
    emptyOutDir: false,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxGcmllbmRPU1xcXFxwY1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcRnJpZW5kT1NcXFxccGNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0ZyaWVuZE9TL3BjL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIGJhc2U6ICcuLycsXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogNTE3MyxcclxuICAgIG9wZW46IGZhbHNlLFxyXG4gIH0sXHJcbiAgLy8gZXNidWlsZFx1RkYxQVx1NzUxRlx1NEVBN1x1Njc4NFx1NUVGQSBkcm9wIGNvbnNvbGUubG9nL2RlYnVnZ2VyXHVGRjA4XHU0RkREXHU3NTU5IGVycm9yL3dhcm4gXHU0RkJGXHU0RThFXHU2MzkyXHU2N0U1XHVGRjA5XHJcbiAgLy8gMTQgXHU1OTA0IGNvbnNvbGUubG9nIFx1NkI4Qlx1NzU1OVx1NEUzQlx1ODk4MVx1NTcyOCBzZWVkRGVtb0RhdGEgXHU4QzAzXHU4QkQ1XHU4REVGXHU1Rjg0XHVGRjBDXHU3NTFGXHU0RUE3XHU2NUUwXHU2MTBGXHU0RTQ5XHU0RTE0XHU2Q0M0XHU2RjBGXHU3RUM2XHU4MjgyXHJcbiAgZXNidWlsZDoge1xyXG4gICAgZHJvcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/IFsnZGVidWdnZXInXSA6IFtdLFxyXG4gICAgcHVyZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5kZWJ1ZyddIDogW10sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICAvLyBcdTY3ODRcdTVFRkFcdTczQUZcdTU4ODNcdTkwMDJcdTkxNERcdUZGMUFlbXB0eU91dERpcj1mYWxzZVx1RkYwQ2Rpc3QgXHU3NTMxXHU2Nzg0XHU1RUZBXHU1MjREXHU4MTFBXHU2NzJDL1x1NjI0Qlx1NTJBOFx1NkUwNVx1N0E3QVx1RkYwQ1xyXG4gICAgLy8gXHU5MDdGXHU1MTREIHZpdGUgXHU1MTg1XHU5MEU4IHJtU3luYyBcdTg5RTZcdTUzRDFcdTZDOTlcdTdCQjEgc2FmZS1kZWxldGUgXHU2MkU2XHU2MjJBXHU1QkZDXHU4MUY0XHU2Nzg0XHU1RUZBXHU1OTMxXHU4RDI1XHJcbiAgICBlbXB0eU91dERpcjogZmFsc2UsXHJcbiAgICAvLyBUYXJnZXQgRWxlY3Ryb24ncyBDaHJvbWl1bSB2ZXJzaW9uXHJcbiAgICB0YXJnZXQ6ICdjaHJvbWUxMjAnLFxyXG4gICAgLy8gRW5hYmxlIENTUyBjb2RlIHNwbGl0dGluZ1xyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBTcGxpdCB2ZW5kb3IgY29kZSBpbnRvIHNlcGFyYXRlIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmdcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAndmVuZG9yLXVpJzogWydsdWNpZGUtcmVhY3QnXSxcclxuICAgICAgICAgICd2ZW5kb3ItZGF0YSc6IFsnZGV4aWUnLCAnZGV4aWUtcmVhY3QtaG9va3MnLCAnenVzdGFuZCddLFxyXG4gICAgICAgICAgJ3ZlbmRvci1jaGFydHMnOiBbJ3JlY2hhcnRzJ10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBJbmNyZWFzZSBjaHVuayBzaXplIHdhcm5pbmcgbGltaXRcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtPLFNBQVMsb0JBQW9CO0FBQy9QLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFGeEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNQLE1BQU0sUUFBUSxJQUFJLGFBQWEsZUFBZSxDQUFDLFVBQVUsSUFBSSxDQUFDO0FBQUEsSUFDOUQsTUFBTSxRQUFRLElBQUksYUFBYSxlQUFlLENBQUMsZUFBZSxlQUFlLElBQUksQ0FBQztBQUFBLEVBQ3BGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUE7QUFBQTtBQUFBLElBR1IsYUFBYTtBQUFBO0FBQUEsSUFFYixRQUFRO0FBQUE7QUFBQSxJQUVSLGNBQWM7QUFBQSxJQUNkLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBLFFBRU4sY0FBYztBQUFBLFVBQ1osZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGFBQWEsQ0FBQyxjQUFjO0FBQUEsVUFDNUIsZUFBZSxDQUFDLFNBQVMscUJBQXFCLFNBQVM7QUFBQSxVQUN2RCxpQkFBaUIsQ0FBQyxVQUFVO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
