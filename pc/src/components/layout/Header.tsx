import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, PanelLeftClose, PanelLeft, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useLanguage } from '../../i18n/useLanguage';
import { useClock, formatClockDisplay } from '../../hooks/useClock';
import { useThemeStore, type ThemeMode } from '../../stores/useThemeStore';

const pageTitles: Record<string, string> = {
  '/': 'nav.dashboard',
  '/risk': 'nav.risk',
  '/tasks': 'nav.tasks',
  '/diary': 'nav.diary',
  '/diary/new': 'diary.write',
  '/habits': 'nav.habits',
  '/memories': 'nav.memories',
  '/emotion': 'nav.emotion',
  '/therapy': 'nav.therapy',
  '/reports': 'nav.reports',
  '/settings': 'nav.settings',
  '/sync': 'nav.sync',
  '/assessment': 'nav.assessment',
  '/privacy': 'nav.privacy_policy',
  '/safety-plan': 'nav.safety_plan',
  '/knowledge': 'nav.knowledge',
};

export default function Header() {
  const location = useLocation();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const { t, lang } = useLanguage();
  const titleKey = pageTitles[location.pathname];
  const title = titleKey ? t(titleKey as any) : '知己';

  // 实时时钟：精确到秒，每秒刷新，与本地系统时间同步
  const now = useClock();
  const dateDisplay = formatClockDisplay(now, lang);

  // 主题切换
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeOptions: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: '浅色', icon: Sun },
    { key: 'dark', label: '深色', icon: Moon },
    { key: 'system', label: '跟随系统', icon: Monitor },
  ];

  // 合并按钮逻辑：
  // - 侧边栏隐藏 → Menu 图标，点击显示侧边栏
  // - 侧边栏显示+展开 → PanelLeftClose，点击折叠
  // - 侧边栏显示+折叠 → PanelLeft，点击展开
  const handleSidebarToggle = () => {
    if (!sidebarOpen) {
      toggleSidebar();
    } else {
      toggleSidebarCollapsed();
    }
  };

  const SidebarIcon = !sidebarOpen ? Menu : sidebarCollapsed ? PanelLeft : PanelLeftClose;
  const sidebarLabel = !sidebarOpen ? t('header.sidebar_show') : sidebarCollapsed ? t('header.sidebar_expand') : t('header.sidebar_collapse');

  return (
    <header
      className="h-[var(--header-height)] border-b backdrop-blur-glass flex items-center justify-between px-6 sticky top-0 z-20"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--glass-border)', boxShadow: 'var(--glass-glow)' }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSidebarToggle}
          aria-label={sidebarLabel}
          className="p-2 rounded-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200"
        >
          <SidebarIcon className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-text-primary tracking-tight">{title}</h1>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--glass-border)' }} />
        <span className="text-xs text-text-muted font-medium tabular-nums">
          {dateDisplay}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* 主题切换 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowThemeMenu(v => !v)}
            aria-label="主题切换"
            className="p-2 rounded-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200 cursor-pointer"
          >
            {themeMode === 'dark' ? <Moon className="w-4 h-4" /> : themeMode === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>
          {showThemeMenu && (
            <div
              className="absolute right-0 top-full mt-1 z-30 w-32 glass-card rounded-lg shadow-xl border py-1"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              {themeOptions.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setThemeMode(key); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer hover:bg-surface-hover ${
                    themeMode === key ? 'text-primary font-medium' : 'text-text-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
