import React, { useState, useEffect } from 'react';
import { Circle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import type { Task } from '../../db/models';
import Badge from '../common/Badge';
import { useLanguage } from '../../i18n/useLanguage';
import { getToday } from '../../utils/date';
import { PRIORITY_CONFIG, CATEGORY_COLOR_MAP } from '../../utils/taskConstants';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onClick: () => void;
}

export default React.memo(function TaskItem({ task, onToggle, onClick }: TaskItemProps) {
  const { t } = useLanguage();
  const isCompleted = task.status === 'completed';
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAppearing, setIsAppearing] = useState(true);
  const pConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = !isCompleted && task.scheduledDate < getToday();
  const categoryTag = task.tags.find((tag) => CATEGORY_COLOR_MAP[tag]);
  const categoryColor = categoryTag ? CATEGORY_COLOR_MAP[categoryTag] : null;

  useEffect(() => {
    const timer = setTimeout(() => setIsAppearing(false), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isCompleting) {
      const timer = setTimeout(() => {
        onToggle();
        setIsCompleting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCompleting, onToggle]);

  const handleToggle = () => {
    if (!isCompleted && !isCompleting) {
      setIsCompleting(true);
    } else {
      onToggle();
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
        ${isCompleting ? 'bg-slate-50/50 opacity-60 scale-95' : isCompleted ? '' : 'hover:bg-surface-hover cursor-pointer'}
        ${isAppearing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
    >
      <button onClick={(e) => { e.stopPropagation(); handleToggle(); }} className="shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-primary" />
        ) : (
          <Circle className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 flex items-start min-w-0 relative" onClick={onClick}>
        <p className={`text-sm break-words leading-snug py-0.5 max-w-[45%] ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {task.title}
        </p>
        <Badge variant={pConfig.variant} size="sm" className="absolute left-1/2 -translate-x-1/2 self-center font-semibold shadow-sm">{t(pConfig.key)}</Badge>
        {categoryColor && (
          <span
            className="ml-auto shrink-0 px-2 py-0.5 text-[10px] rounded-full text-white font-medium"
            style={{ backgroundColor: categoryColor }}
          >
            {categoryTag}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.isRollover && task.originalDate && (
          <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {t('task.from')} {task.originalDate} {t('task.rolled_over')}
          </span>
        )}
        {isOverdue && (
          <span className="text-[10px] text-red-500">{t('task.expired')}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
});
