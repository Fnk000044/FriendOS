import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, BookOpen, Target,
  Brain, BarChart3, Settings, Sparkles, Smartphone, MessageCircle,
  Activity, Heart, ClipboardList
} from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { useUIStore } from '../../stores/uiStore';
import DailyQuote from '../dashboard/DailyQuote';

const navItems = [
  { to: '/', icon: LayoutDashboard, key: 'nav.dashboard' as const, color: '#14B8A6' },
  { to: '/tasks', icon: CheckSquare, key: 'nav.tasks' as const, color: '#14B8A6' },
  { to: '/diary', icon: BookOpen, key: 'nav.diary' as const, color: '#8B5CF6' },
  { to: '/habits', icon: Target, key: 'nav.habits' as const, color: '#F59E0B' },
  { to: '/memories', icon: Brain, key: 'nav.memories' as const, color: '#6366F1' },
  { to: '/emotion', icon: Activity, key: 'nav.emotion' as const, color: '#F43F5E' },
  { to: '/therapy', icon: Heart, key: 'nav.therapy' as const, color: '#EC4899' },
  { to: '/assistant', icon: MessageCircle, key: 'nav.assistant' as const, color: '#8B5CF6' },
  { to: '/reports', icon: BarChart3, key: 'nav.reports' as const, color: '#3B82F6' },
  { to: '/assessment', icon: ClipboardList, key: 'nav.assessment' as const, color: '#6366F1' },
  { to: '/sync', icon: Smartphone, key: 'nav.sync' as const, color: '#10B981' },
  { to: '/settings', icon: Settings, key: 'nav.settings' as const, color: '#6B7280' },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={`w-[var(--sidebar-width)] h-screen border-r backdrop-blur-glass-strong flex flex-col fixed left-0 top-8 z-30 transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--glass-border)' }}
      role="navigation"
      aria-label="主导航"
    >
      <div
        className="h-[var(--header-height)] flex items-center gap-2.5 px-5 border-b"
        style={{ borderColor: 'var(--glass-border)', background: 'linear-gradient(135deg, rgba(20,184,166,0.04), transparent)' }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14B8A6, #5EEAD4)' }}>
          <Sparkles className="w-4.5 h-4.5 text-white" aria-hidden="true" />
        </div>
        <span className="font-bold text-lg tracking-tight text-text-primary">知己</span>
      </div>
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto" aria-label="页面导航">
        {navItems.map(({ to, icon: Icon, key, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={t(key)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    background: isActive ? `${color}15` : 'transparent',
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? color : undefined }} aria-hidden="true" />
                </div>
                <span>{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-2.5 pb-3">
        <DailyQuote />
      </div>
      <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-xs text-text-muted flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {t('nav.data_local')}
        </p>
      </div>
    </aside>
  );
}