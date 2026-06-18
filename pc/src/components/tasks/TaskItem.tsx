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
  const [showBounce, setShowBounce] = useState(false);
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
      // 触发弹跳动画
      setShowBounce(true);
      const timer = setTimeout(() => {
        onToggle();
        setIsCompleting(false);
        setShowBounce(false);
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
        ${isCompleting ? 'bg-green-50/50' : isCompleted ? '' : 'hover:bg-surface-hover cursor-pointer'}
        ${isAppearing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
      style={{
        transition: isAppearing ? 'opacity 200ms ease-out, transform 200ms ease-out' : undefined,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        className={`shrink-0 transition-transform duration-200 ${showBounce ? 'scale-125' : 'scale-100'}`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className={`w-5 h-5 transition-colors duration-200 ${
            isCompleting ? 'text-green-400' : 'text-text-muted group-hover:text-primary'
          }`} />
        )}
      </button>

      <div className="flex-1 flex items-start min-w-0 relative" onClick={onClick}>
        <p className={`text-sm break-words leading-snug py-0.5 max-w-[45%] transition-all duration-300 ${
          isCompleted
            ? 'line-through text-text-muted'
            : isCompleting
              ? 'text-green-600 line-through'
              : 'text-text-primary'
        }`}>
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
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
});
