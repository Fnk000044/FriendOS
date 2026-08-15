import { useTaskFilterStore, type TaskFilterStatus, type TaskFilterPriority } from '../../stores/taskFilterStore';
import { useLanguage } from '../../i18n/useLanguage';

const statusOptions: { value: TaskFilterStatus; key: 'task.all' | 'task.pending' | 'task.completed' | 'task.overdue' }[] = [
  { value: 'all', key: 'task.all' },
  { value: 'pending', key: 'task.pending' },
  { value: 'completed', key: 'task.completed' },
  { value: 'overdue', key: 'task.overdue' },
];

const priorityOptions: { value: TaskFilterPriority; key: 'task.all' | 'task.urgent' | 'task.high' | 'task.medium' | 'task.low' }[] = [
  { value: 'all', key: 'task.all' },
  { value: 'urgent', key: 'task.urgent' },
  { value: 'high', key: 'task.high' },
  { value: 'medium', key: 'task.medium' },
  { value: 'low', key: 'task.low' },
];

export default function TaskFilters() {
  const { status, priority, setStatus, setPriority } = useTaskFilterStore();
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">{t('task.status_filter')}</span>
        <div className="flex gap-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                status === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-text-muted hover:border-slate-300'
              }`}
              style={status === opt.value ? undefined : { borderColor: 'var(--glass-border)' }}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">{t('task.priority_filter')}</span>
        <div className="flex gap-1">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriority(opt.value)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                priority === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-text-muted hover:border-slate-300'
              }`}
              style={priority === opt.value ? undefined : { borderColor: 'var(--glass-border)' }}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
