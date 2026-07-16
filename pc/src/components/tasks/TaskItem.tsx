import React, { useState, useEffect } from 'react';
import { Circle, CheckCircle2, Clock, ChevronRight, AlarmClock, ListChecks } from 'lucide-react';
import type { Task } from '../../db/models';
import Badge from '../common/Badge';
import { useLanguage } from '../../i18n/useLanguage';
import { getToday } from '../../utils/date';
import { PRIORITY_CONFIG, CATEGORY_COLOR_MAP } from '../../utils/taskConstants';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onClick: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
}

export default React.memo(function TaskItem({ task, onToggle, onClick, onToggleSubtask }: TaskItemProps) {
  const { t } = useLanguage();
  const isCompleted = task.status === 'completed';
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAppearing, setIsAppearing] = useState(true);
  const [showBounce, setShowBounce] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pConfig = PRIORITY_CONFIG[task.priority];
  const priorityColor = task.priority === 'urgent' ? '#DC2626' : task.priority === 'high' ? '#D97706' : task.priority === 'medium' ? '#2563EB' : '#94A3B8';
  const isOverdue = !isCompleted && task.scheduledDate < getToday();
  const categoryTag = task.tags.find((tag) => CATEGORY_COLOR_MAP[tag]);
  const categoryColor = categoryTag ? CATEGORY_COLOR_MAP[categoryTag] : null;

  // 子任务进度
  const subtasks = task.subtasks || [];
  const subtaskTotal = subtasks.length;
  const subtaskDone = subtasks.filter(s => s.done).length;
  const hasSubtasks = subtaskTotal > 0;

  // 截止时间倒计时
  const dueTimeLabel = (() => {
    if (!task.dueTime || isCompleted) return null;
    const [h, m] = task.dueTime.split(':').map(Number);
    const now = new Date();
    const due = new Date();
    due.setHours(h, m, 0, 0);
    const diffMin = Math.round((due.getTime() - now.getTime()) / 60000);
    if (diffMin < 0) return { text: `已逾期 ${Math.abs(diffMin)}分`, color: 'text-red-500' };
    if (diffMin < 60) return { text: `< ${diffMin + 1}分`, color: 'text-red-500' };
    if (diffMin < 180) return { text: `${Math.floor(diffMin / 60)}小时后`, color: 'text-orange-500' };
    return { text: task.dueTime, color: 'text-text-muted' };
  })();

  useEffect(() => {
    const timer = setTimeout(() => setIsAppearing(false), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isCompleting) {
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
        ${isCompleting ? 'bg-green-50/50 dark:bg-green-900/20' : isCompleted ? '' : 'hover:bg-surface-hover cursor-pointer'}
        ${isAppearing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
      style={{
        transition: isAppearing ? 'opacity 200ms ease-out, transform 200ms ease-out' : undefined,
        // 左侧优先级色条加粗
        borderLeft: `3px solid ${priorityColor}${isCompleted ? '40' : ''}`,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        aria-pressed={isCompleted}
        aria-label={isCompleted ? t('task.completed') : t('task.pending')}
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

      <div
        className="flex-1 flex items-start min-w-0 relative cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={(e) => { if (hasSubtasks && expanded) { e.stopPropagation(); } onClick(); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm break-words leading-snug py-0.5 transition-all duration-300 ${
              isCompleted
                ? 'line-through text-text-muted'
                : isCompleting
                  ? 'text-green-600 dark:text-green-400 line-through'
                  : 'text-text-primary'
            }`}>
              {task.title}
            </p>
            <Badge variant={pConfig.variant} size="sm" className="self-center font-semibold shadow-sm shrink-0">{t(pConfig.key)}</Badge>
            {categoryColor && (
              <span
                className="ml-auto shrink-0 px-2 py-0.5 text-[10px] rounded-full text-white font-medium"
                style={{ backgroundColor: categoryColor }}
              >
                {categoryTag}
              </span>
            )}
          </div>

          {/* 子任务进度 + 截止时间 */}
          {(hasSubtasks || dueTimeLabel) && (
            <div className="flex items-center gap-3 mt-1 ml-0.5">
              {hasSubtasks && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                  className="flex items-center gap-1 text-[10px] text-text-muted hover:text-primary transition-colors"
                  aria-label="展开子任务"
                >
                  <ListChecks className="w-3 h-3" />
                  {subtaskDone}/{subtaskTotal}
                  {/* 进度条 */}
                  <span className="inline-block w-12 h-1 bg-surface-hover rounded-full overflow-hidden">
                    <span
                      className="block h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
                    />
                  </span>
                </button>
              )}
              {dueTimeLabel && (
                <span className={`flex items-center gap-0.5 text-[10px] ${dueTimeLabel.color}`}>
                  <AlarmClock className="w-3 h-3" />
                  {dueTimeLabel.text}
                </span>
              )}
            </div>
          )}

          {/* 展开的子任务列表 */}
          {hasSubtasks && expanded && (
            <div className="mt-2 space-y-1 fade-in-up">
              {subtasks.map(s => (
                <button
                  key={s.id}
                  onClick={(e) => { e.stopPropagation(); onToggleSubtask?.(s.id); }}
                  className="flex items-center gap-2 w-full text-left py-1 px-2 rounded hover:bg-surface-hover transition-colors"
                >
                  {s.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  )}
                  <span className={`text-xs ${s.done ? 'line-through text-text-muted' : 'text-text-secondary'}`}>
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
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
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={t('task.detail')}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200"
        >
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
});
