import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';
import { getToday } from '../../utils/date';

interface StatItemProps {
  label: string;
  value: number;
  color?: string;
  sectionId?: string;
  onClick?: () => void;
}

function StatItem({ label, value, color = 'text-text-primary', sectionId, onClick }: StatItemProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      className={`flex flex-col items-center px-4 py-3 min-w-[80px] rounded-lg border border-transparent ${onClick ? 'cursor-pointer hover:shadow-lg transition-all' : ''}`}
      style={onClick ? { '--tw-hover-bg': 'var(--bg-hover)', '--tw-hover-border-color': 'var(--glass-border)' } as React.CSSProperties : undefined}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span className={`text-2xl font-semibold ${color}`}>{value}</span>
      <span className="text-xs text-text-muted mt-1">{label}</span>
    </Component>
  );
}

interface TaskStatsProps {
  taskGroups?: { today: any[]; pending: any[]; completed: any[]; rollover: any[] };
}

export default function TaskStats({ taskGroups }: TaskStatsProps) {
  const { t } = useLanguage();

  // 使用传入的分组数据，避免重复查询
  const stats = taskGroups
    ? {
        all: taskGroups.today.length + taskGroups.pending.length + taskGroups.completed.length,
        today: taskGroups.today.length,
        pending: taskGroups.pending.length,
        completed: taskGroups.completed.length,
        rollover: taskGroups.rollover.length,
      }
    : { all: 0, today: 0, pending: 0, completed: 0, rollover: 0 };

  const scrollToSection = (id: string) => {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="flex items-center justify-center gap-2 glass-card p-2">
      <StatItem label={t('task.stats.all')} value={stats.all} onClick={() => scrollToSection('section-today')} />
      <div className="w-px h-8" style={{ background: 'var(--glass-border)' }} />
      <StatItem label={t('task.stats.today')} value={stats.today} color="text-primary" onClick={() => scrollToSection('section-today')} />
      <div className="w-px h-8" style={{ background: 'var(--glass-border)' }} />
      <StatItem label={t('task.stats.pending')} value={stats.pending} onClick={() => scrollToSection('section-pending')} />
      <div className="w-px h-8" style={{ background: 'var(--glass-border)' }} />
      <StatItem label={t('task.stats.completed')} value={stats.completed} color="text-green-500" onClick={() => scrollToSection('section-completed')} />
      <div className="w-px h-8" style={{ background: 'var(--glass-border)' }} />
      <StatItem label={t('task.stats.rollover')} value={stats.rollover} color="text-amber-500" onClick={() => scrollToSection('section-rollover')} />
    </div>
  );
}
