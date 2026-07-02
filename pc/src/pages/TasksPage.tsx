import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Sun, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import TaskStats from '../components/tasks/TaskStats';
import TaskSection from '../components/tasks/TaskSection';
import TaskItem from '../components/tasks/TaskItem';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import { db } from '../db';
import { useTasks } from '../hooks/useTasks';
import { useLanguage } from '../i18n/useLanguage';
import type { Task } from '../db/models';
import { getToday } from '../utils/date';

export default function TasksPage() {
  const { t } = useLanguage();
  const { toggleTask } = useTasks();
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const today = getToday();

  // 性能优化：使用索引查询替代全表扫描，按需加载各分组任务
  const allTasks = useLiveQuery(async () => {
    const [todayPending, overduePending, todayCompleted, rollover] = await Promise.all([
      // 利用复合索引 [status+scheduledDate]
      db.tasks.where('[status+scheduledDate]').equals(['pending', today]).toArray(),
      db.tasks.where('status').equals('pending').filter(t => t.scheduledDate < today).toArray(),
      db.tasks.where('[status+scheduledDate]').equals(['completed', today]).toArray(),
      // 利用 isRollover 索引
      db.tasks.where('isRollover').equals(1).toArray(),
    ]);
    return { today: todayPending, pending: overduePending, completed: todayCompleted, rollover };
  }, [today]);

  const isLoading = allTasks === undefined;
  const sections = allTasks || { today: [], pending: [], completed: [], rollover: [] };

  const handleToggle = (task: Task) => {
    toggleTask(task.id, task.status);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleNewTask = () => {
    // 互斥：打开新建 modal 时清空选中态，避免双 modal 堆叠
    setSelectedTask(null);
    setShowNewModal(true);
  };

  const allEmpty = !isLoading
    && sections.today.length === 0
    && sections.pending.length === 0
    && sections.completed.length === 0
    && sections.rollover.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted">{t('task.title')}</p>
        <Button onClick={handleNewTask}>
          <Plus className="w-4 h-4" />
          {t('task.new_task')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      ) : allEmpty ? (
        <EmptyState
          title={t('task.no_tasks')}
          description={t('task.no_tasks_desc')}
          action={
            <Button onClick={handleNewTask}>
              <Plus className="w-4 h-4" />
              {t('task.new_task')}
            </Button>
          }
        />
      ) : (
        <>
          <TaskStats taskGroups={sections} />

          <TaskSection
            id="section-today"
            title={t('task.stats.today')}
            icon={<Sun className="w-4 h-4 text-primary" />}
            count={sections.today.length}
            stagger
          >
            {sections.today.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </TaskSection>

          <TaskSection
            id="section-pending"
            title={t('task.stats.pending')}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
            count={sections.pending.length}
            stagger
          >
            {sections.pending.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </TaskSection>

          <TaskSection
            id="section-completed"
            title={t('task.stats.completed')}
            icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            count={sections.completed.length}
            stagger
          >
            {sections.completed.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </TaskSection>

          <TaskSection
            id="section-rollover"
            title={t('task.stats.rollover')}
            icon={<RefreshCw className="w-4 h-4 text-purple-500" />}
            count={sections.rollover.length}
            isRollover
          >
            {sections.rollover.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </TaskSection>
        </>
      )}

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <TaskDetailModal
        task={null}
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  );
}