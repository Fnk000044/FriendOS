import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Menu, MessageCircle, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useLanguage } from '../../i18n/useLanguage';

const pageTitles: Record<string, string> = {
  '/': 'nav.dashboard',
  '/tasks': 'nav.tasks',
  '/diary': 'nav.diary',
  '/habits': 'nav.habits',
  '/memories': 'nav.memories',
  '/emotion': 'nav.emotion',
  '/therapy': 'nav.therapy',
  '/assistant': 'nav.assistant',
  '/reports': 'nav.reports',
  '/settings': 'nav.settings',
  '/sync': 'nav.sync',
  '/assessment': 'nav.assessment',
};

export default function Header() {
  const location = useLocation();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const aiAssistantOpen = useUIStore((s) => s.aiAssistantOpen);
  const toggleAiAssistant = useUIStore((s) => s.toggleAiAssistant);
  const { t, lang } = useLanguage();
  const titleKey = pageTitles[location.pathname];
  const title = titleKey ? t(titleKey as any) : '知己';
  const isAssistantPage = location.pathname === '/assistant';

  const today = new Date();
  const dateDisplay = lang === 'zh-CN'
    ? `${today.getMonth() + 1}月${today.getDate()}日 周${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}`
    : format(today, 'EEE, MMM d');

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
  const sidebarLabel = !sidebarOpen ? '显示侧边栏' : sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏';

  return (
    <header
      className="h-[var(--header-height)] border-b backdrop-blur-glass flex items-center justify-between px-6 sticky top-0 z-20"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--glass-border)', boxShadow: 'var(--glass-glow)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={handleSidebarToggle}
          aria-label={sidebarLabel}
          className="p-2 rounded-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200"
        >
          <SidebarIcon className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-text-primary tracking-tight">{title}</h1>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--glass-border)' }} />
        <span className="text-xs text-text-muted font-medium">
          {dateDisplay}
        </span>
      </div>
      {!isAssistantPage && (
        <button
          onClick={toggleAiAssistant}
          aria-label="AI 助理"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
            aiAssistantOpen
              ? 'text-white shadow-lg'
              : 'text-primary hover:shadow-md'
          }`}
          style={aiAssistantOpen
            ? { background: 'linear-gradient(135deg, #14B8A6, #0F766E)' }
            : { background: 'var(--color-primary-glow)' }
          }
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>AI 助理</span>
        </button>
      )}
    </header>
  );
}
