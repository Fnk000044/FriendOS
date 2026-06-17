import { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface TaskSectionProps {
  id?: string;
  title: string;
  icon?: ReactNode;
  count: number;
  showAddButton?: boolean;
  onAdd?: () => void;
  children: ReactNode;
  emptyText?: string;
  isRollover?: boolean;
}

export default function TaskSection({
  id,
  title,
  icon,
  count,
  showAddButton,
  onAdd,
  children,
  emptyText,
  isRollover,
}: TaskSectionProps) {
  const { t } = useLanguage();

  return (
    <div id={id} className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-text-primary">{title}</h3>
          <span className="text-xs text-text-muted">({count})</span>
        </div>
        {showAddButton && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-btn hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            {t('task.new_task')}
          </button>
        )}
      </div>
      <div className="divide-y" style={{ '--tw-divide-opacity': '0.3', '--tw-divide-color': 'var(--glass-border)' } as React.CSSProperties}>
        {count === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted text-center">
            {emptyText || t('task.no_tasks')}
          </p>
        ) : (
          children
        )}
      </div>
      {isRollover && count > 0 && (
        <div className="px-4 py-2 bg-amber-50 text-amber-600 text-xs text-center">
          {t('task.rolled_to_tomorrow')}
        </div>
      )}
    </div>
  );
}
