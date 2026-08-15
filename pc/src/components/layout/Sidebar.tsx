import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, BookOpen, Target,
  Brain, BarChart3, Settings, Sparkles, Smartphone,
  Activity, Heart, ClipboardList, Shield, MessageCircle,
  ShieldCheck, Lock, Info
} from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { useUIStore } from '../../stores/uiStore';
import DailyQuote from '../dashboard/DailyQuote';
import type { TranslationKey } from '../../i18n/translations';

type NavEntry = { to: string; icon: typeof LayoutDashboard; key: TranslationKey };
type NavGroup = { groupKey: TranslationKey; items: NavEntry[] };

const navGroups: NavGroup[] = [
  {
    groupKey: 'nav.group_daily',
    items: [
      { to: '/', icon: LayoutDashboard, key: 'nav.dashboard' },
      { to: '/chat', icon: MessageCircle, key: 'nav.assistant' },
      { to: '/tasks', icon: CheckSquare, key: 'nav.tasks' },
      { to: '/diary', icon: BookOpen, key: 'nav.diary' },
      { to: '/habits', icon: Target, key: 'nav.habits' },
    ],
  },
  {
    groupKey: 'nav.group_analysis',
    items: [
      { to: '/emotion', icon: Activity, key: 'nav.emotion' },
      { to: '/risk', icon: Shield, key: 'nav.risk' },
      { to: '/reports', icon: BarChart3, key: 'nav.reports' },
    ],
  },
  {
    groupKey: 'nav.group_tools',
    items: [
      { to: '/therapy', icon: Heart, key: 'nav.therapy' },
      { to: '/assessment', icon: ClipboardList, key: 'nav.assessment' },
      { to: '/knowledge', icon: BookOpen, key: 'nav.knowledge' },
      { to: '/safety-plan', icon: ShieldCheck, key: 'nav.safety_plan' },
      { to: '/memories', icon: Brain, key: 'nav.memories' },
    ],
  },
  {
    groupKey: 'nav.group_system',
    items: [
      { to: '/sync', icon: Smartphone, key: 'nav.sync' },
      { to: '/settings', icon: Settings, key: 'nav.settings' },
      { to: '/privacy', icon: ShieldCheck, key: 'nav.privacy_policy' },
      { to: '/about', icon: Info, key: 'nav.about' },
    ],
  },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  const sidebarWidth = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';

  return (
    <aside
      className={`h-screen border-r backdrop-blur-glass-strong flex flex-col fixed left-0 top-8 z-30 transition-all duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{
        width: sidebarWidth,
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--glass-border)',
        transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)',
      }}
      role="navigation"
      aria-label="主导航"
    >
      <div
        className="h-[var(--header-height)] flex items-center border-b overflow-hidden"
        style={{
          borderColor: 'var(--glass-border)',
          background: 'linear-gradient(135deg, rgba(20,184,166,0.04), transparent)',
          padding: collapsed ? '0 14px' : '0 20px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? '0' : '10px',
        }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gradient-primary)' }}>
          <Sparkles className="w-4.5 h-4.5 text-white" aria-hidden="true" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-text-primary whitespace-nowrap">知己</span>
        )}
      </div>
      <nav className="flex-1 py-3 overflow-y-auto" style={{ padding: collapsed ? '12px 8px' : '12px 10px' }} aria-label="页面导航">
        {navGroups.map((group, gi) => (
          <div key={group.groupKey} className={gi > 0 ? 'mt-4' : ''}>
            {!collapsed && (
              <p className="px-3.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t(group.groupKey)}
              </p>
            )}
            {group.items.map(({ to, icon: Icon, key }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                aria-label={t(key)}
                className={({ isActive }) =>
                  `flex items-center rounded-[10px] text-sm font-medium transition-all duration-150 relative ${
                    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[var(--bg-hover)] text-primary font-semibold'
                      : 'text-text-secondary hover:bg-[var(--bg-hover)] hover:text-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !collapsed && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                        style={{ background: 'var(--color-primary)' }}
                      />
                    )}
                    <Icon className="w-5 h-5 shrink-0" style={{ color: isActive ? 'var(--color-primary)' : undefined }} aria-hidden="true" />
                    {!collapsed && <span>{t(key)}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {!collapsed && (
        <div className="px-2.5 pb-3">
          <DailyQuote />
        </div>
      )}
      <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <p className={`text-xs text-text-muted flex items-center ${collapsed ? 'justify-center' : 'gap-1.5'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
          {!collapsed && t('nav.data_local')}
        </p>
      </div>
    </aside>
  );
}
