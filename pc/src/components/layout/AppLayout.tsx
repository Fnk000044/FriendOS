import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import StatusBar from './StatusBar';
import { useUIStore } from '../../stores/uiStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useAppearanceStore } from '../../stores/useAppearanceStore';
import { useDemoModeStore } from '../../stores/demoModeStore';
import { useLanguage } from '../../i18n/useLanguage';

export default function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const location = useLocation();
  const { t } = useLanguage();
  // 激活主题 store（初始化时自动 applyTheme + 监听系统变化）
  useThemeStore((s) => s.resolved);
  // 激活外观 store（初始化时自动 applyAppearance + 订阅变化触发重渲染）
  // 订阅 reduceMotion，开启时跳过页面切换入场动画类，避免重挂载造成的瞬时闪烁
  const reduceMotion = useAppearanceStore((s) => s.reduceMotion);
  // 演示模式状态（激活时顶部横幅全局可见）
  const demoActive = useDemoModeStore((s) => s.status === 'active');

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
        {/* 演示模式横幅：激活时全局可见 */}
        {demoActive && (
          <div
            className="mx-4 md:mx-7 mb-2 rounded-xl px-4 py-2 text-xs font-medium flex items-center gap-2"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.4)',
              color: '#b45309',
            }}
            role="status"
            aria-label={t('settings.demo_banner')}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden="true" />
            {t('settings.demo_banner')}
          </div>
        )}
        <Header />
        <div className="flex" style={{ height: 'calc(100vh - 32px - var(--header-height) - 28px)' }}>
          <main className="flex-1 px-4 md:px-7 py-6 max-w-7xl mx-auto min-w-0 overflow-y-auto" role="main" aria-label="主内容区">
            <div key={location.pathname} className={reduceMotion ? 'h-full' : 'page-transition-enter h-full'}>
              <Outlet />
            </div>
          </main>
        </div>
        <StatusBar />
      </div>
    </div>
  );
}