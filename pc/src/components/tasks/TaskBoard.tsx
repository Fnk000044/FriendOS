import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Circle, CheckCircle2, GripVertical } from 'lucide-react';
import { db } from '../../db';
import { getToday } from '../../utils/date';
import type { Task } from '../../db/models';
import Badge from '../common/Badge';
import { useTasks } from '../../hooks/useTasks';
import { useLanguage } from '../../i18n/useLanguage';
import { PRIORITY_CONFIG } from '../../utils/taskConstants';

/**
 * 看板视图：3 列 待办 / 进行中 / 已完成
 *
 * 注意：当前 Task.status 只有 pending/completed/cancelled，
 * 看板的"进行中"列暂用 overdue pending（scheduledDate < today）作为近似。
 * 卡片可跨列拖拽改状态（HTML5 原生 dragdrop，无需额外库）。
 */
const PRIORITY_COLORS: Record<Task['priority'], string> = {
  urgent: '#DC2626',
  high: '#D97706',
  medium: '#2563EB',
  low: '#94A3B8',
};

export default function TaskBoard({ onTaskClick }: { onTaskClick: (task: Task) => void }) {
  const { t } = useLanguage();
  const { toggleTask } = useTasks();
  const today = getToday();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const allTasks = useLiveQuery(async () => {
    return db.tasks.where('scheduledDate').between(
      // 最近 30 天的任务都进看板
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      today,
      true,
      true,
    ).toArray();
  }, [today]);

  const columns = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const done: Task[] = [];
    for (const t of allTasks || []) {
      if (t.status === 'completed') done.push(t);
      else if (t.scheduledDate < today) inProgress.push(t);
      else todo.push(t);
    }
    return { todo, inProgress, done };
  }, [allTasks, today]);

  const handleDrop = async (targetColumn: 'todo' | 'inProgress' | 'done', taskId: string) => {
    setDraggingId(null);
    const task = (allTasks || []).find(t => t.id === taskId);
    if (!task) return;

    if (targetColumn === 'done' && task.status !== 'completed') {
      await toggleTask(task.id, task.status);
    } else if (targetColumn !== 'done' && task.status === 'completed') {
      await toggleTask(task.id, task.status);
    }
    // todo <-> inProgress 之间不需要改 status（都是 pending），只是视觉分组
  };

  const columnsConfig = [
    { key: 'todo' as const, title: '待办', tasks: columns.todo, accent: 'var(--color-info)' },
    { key: 'inProgress' as const, title: '进行中', tasks: columns.inProgress, accent: 'var(--color-warning)' },
    { key: 'done' as const, title: '已完成', tasks: columns.done, accent: 'var(--color-success)' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columnsConfig.map(col => (
        <div
          key={col.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleDrop(col.key, draggingId || ''); }}
          className="glass-card rounded-2xl p-4 min-h-[300px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.accent }} />
              {col.title}
            </h3>
            <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-full">{col.tasks.length}</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {col.tasks.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">暂无</p>
            ) : (
              col.tasks.map(task => {
                const pConfig = PRIORITY_CONFIG[task.priority];
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggingId(task.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => onTaskClick(task)}
                    className={`p-3 rounded-lg border cursor-move transition-all hover:shadow-md ${
                      draggingId === task.id ? 'opacity-50' : 'opacity-100'
                    }`}
                    style={{
                      background: 'var(--bg-card-solid)',
                      borderColor: 'var(--glass-border)',
                      borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id, task.status); }}
                        className="shrink-0 mt-0.5"
                        aria-label={task.status === 'completed' ? '标记未完成' : '标记完成'}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-text-muted hover:text-primary" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant={pConfig.variant} size="sm">{t(pConfig.key)}</Badge>
                          {task.dueTime && <span className="text-[10px] text-text-muted">{task.dueTime}</span>}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className="text-[10px] text-text-muted">
                              {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-text-muted/50 shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
