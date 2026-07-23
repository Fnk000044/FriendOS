import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import StatusBar from './StatusBar';
import { useUIStore } from '../../stores/uiStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAppearanceStore } from '../../stores/useAppearanceStore';

export default function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const location = useLocation();
  // 激活主题 store（初始化时自动 applyTheme + 监听系统变化）
  useThemeStore((s) => s.resolved);
  // 激活外观 store（初始化时自动 applyAppearance + 订阅变化触发重渲染）
  useAppearanceStore((s) => ({
    accent: s.accent, fontScale: s.fontScale, reduceMotion: s.reduceMotion,
  }));

  const sidebarMargin = sidebarOpen
    ? (collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)')
    : '0';

  return (
    <div className="min-h-screen relative overflow-hidden noise-overlay" style={{ background: 'var(--bg-gradient)' }}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-60 animate-float"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-1), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-50 animate-float-slow"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-2), transparent 70%)' }}
        />
        <div
          className="absolute -top-24 -right-48 w-[450px] h-[450px] rounded-full opacity-40 animate-float-slower"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-3), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-48 -left-24 w-[500px] h-[500px] rounded-full opacity-40 animate-float"
          style={{ background: 'radial-gradient(circle, var(--bg-decorative-4), transparent 70%)', animationDelay: '-7s' }}
        />
      </div>

      <Sidebar />
      <div className="relative z-10 pt-8 transition-all duration-200 ease-out" style={{ marginLeft: sidebarMargin }}>
        <Header />
        <div className="flex" style={{ height: 'calc(100vh - 32px - var(--header-height) - 28px)' }}>
          <main className="flex-1 px-4 md:px-7 py-6 max-w-7xl mx-auto min-w-0 overflow-y-auto" role="main" aria-label="主内容区">
            <div key={location.pathname} className="page-transition-enter h-full">
              <Outlet />
            </div>
          </main>
        </div>
        <StatusBar />
      </div>
    </div>
  );
}