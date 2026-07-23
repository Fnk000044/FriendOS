import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { db } from '../../db';
import { useTasks } from '../../hooks/useTasks';
import { useTaskFilterStore } from '../../stores/taskFilterStore';
import { useLanguage } from '../../i18n/useLanguage';
import type { Task } from '../../db/models';
import TaskItem from './TaskItem';
import TaskDetailModal from './TaskDetailModal';
import EmptyState from '../common/EmptyState';
import { getToday } from '../../utils/date';
import LoadingSpinner from '../common/LoadingSpinner';

function groupTasks(tasks: Task[], t: (key: any) => string, lang: string): { label: string; tasks: Task[] }[] {
  const groups: { label: string; tasks: Task[] }[] = [];
  const today = getToday();

  // 组内排序：紧急 > 高 > 中 > 低，同优先级按截止时间升序，再按日期升序
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
  const sortWithinGroup = (a: Task, b: Task) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (diff !== 0) return diff;
    const aTime = a.dueTime || '99:99';
    const bTime = b.dueTime || '99:99';
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return a.scheduledDate.localeCompare(b.scheduledDate);
  };

  const overdue = tasks.filter((t) => t.status === 'pending' && t.scheduledDate < today)
    .sort(sortWithinGroup);
  if (overdue.length) groups.push({ label: t('task.overdue'), tasks: overdue });

  const todays = tasks.filter((t) => t.scheduledDate === today).sort(sortWithinGroup);
  if (todays.length) groups.push({ label: t('task.today'), tasks: todays });

  const dateFormat = lang === 'zh-CN' ? 'M月d日' : 'MMM d';
  const future = tasks.filter((t) => t.status === 'pending' && t.scheduledDate > today);
  if (future.length) {
    const futureGroups: Record<string, Task[]> = {};
    for (const t of future) {
      if (!futureGroups[t.scheduledDate]) futureGroups[t.scheduledDate] = [];
      futureGroups[t.scheduledDate].push(t);
    }
    for (const [date, ts] of Object.entries(futureGroups).sort()) {
      // 组内必须再排一次，否则会回落到 createdAt 顺序
      groups.push({ label: format(parseISO(date), dateFormat), tasks: ts.sort(sortWithinGroup) });
    }
  }

  const completed = tasks.filter((t) => t.status === 'completed').sort(sortWithinGroup);
  if (completed.length) groups.push({ label: t('task.completed'), tasks: completed });

  return groups;
}

export default function TaskList() {
  const { t, lang } = useLanguage();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { status: statusFilter, priority: priorityFilter, search } = useTaskFilterStore();
  const { toggleTask } = useTasks();

  const allTasks = useLiveQuery(() => db.tasks.orderBy('createdAt').toArray());

  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];

    let list = [...allTasks];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q)));
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter === 'pending') {
      list = list.filter((t) => t.status === 'pending');
    } else if (statusFilter === 'completed') {
      list = list.filter((t) => t.status === 'completed');
    } else if (statusFilter === 'overdue') {
      const today = getToday();
      list = list.filter((t) => t.status === 'pending' && t.scheduledDate < today);
    }

    // Sort: pending first, then by priority (urgent→low), then by dueTime, then by date
    list.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      const diff = order[a.priority] - order[b.priority];
      if (diff !== 0) return diff;
      // 同优先级按截止时间升序（无截止时间排最后）
      const aTime = a.dueTime || '99:99';
      const bTime = b.dueTime || '99:99';
      if (aTime !== bTime) return aTime.localeCompare(bTime);
      return a.scheduledDate.localeCompare(b.scheduledDate);
    });

    return list;
  }, [allTasks, statusFilter, priorityFilter, search]);

  const groups = useMemo(() => groupTasks(filteredTasks, t, lang), [filteredTasks, t, lang]);

  if (!allTasks) return <LoadingSpinner text={t('task.loading')} />;

  if (groups.length === 0) {
    return <EmptyState title={t('task.no_tasks')} description={t('task.no_tasks_desc')} />;
  }

  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
              {group.label}
              <span className="ml-2 font-normal">({group.tasks.length})</span>
            </h3>
            <div className="glass-card divide-y divide-slate-50">
              {group.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id, task.status)}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
