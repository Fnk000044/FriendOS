import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { useTasks } from '../../hooks/useTasks';
import { Circle, CheckSquare, ChevronRight, Plus } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Badge from '../common/Badge';
import { CardSkeleton } from '../common/Skeleton';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { PRIORITY_CONFIG, CATEGORY_COLOR_MAP } from '../../utils/taskConstants';

export default function TodayTodos() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toggleTask, createTask } = useTasks();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const tasks = useLiveQuery(
    () => db.tasks
      .where('scheduledDate')
      .equals(today)
      .toArray(),
  );

  if (!tasks) return <CardSkeleton lines={4} />;

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle,
      scheduledDate: today,
      priority: 'medium',
      tags: [],
    });
    setNewTaskTitle('');
    setShowAddModal(false);
  }

  const handleToggle = (taskId: string, status: 'pending' | 'completed' | 'cancelled') => {
    if (status === 'pending') {
      setToggling((prev) => ({ ...prev, [taskId]: true }));
      setTimeout(() => {
        toggleTask(taskId, status);
        setToggling((prev) => ({ ...prev, [taskId]: false }));
      }, 300);
    } else {
      toggleTask(taskId, status);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="glass-card-accent p-5 flex flex-col" style={{ '--accent-color': '#14B8A6' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14B8A615, #5EEAD415)', color: '#14B8A6' }}>
            <CheckSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.today_todos')}</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
            {completedTasks.length}/{tasks.length}
          </span>
        </div>
        <button onClick={() => navigate('/tasks')} className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium">
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-text-muted py-4 text-center">{t('dashboard.no_todos')}</p>
      ) : (
        <div className="flex-1">
          <div className="space-y-1">
            {tasks.slice(0, 8).map((task) => {
              const isCompleted = task.status === 'completed';
              const isToggling = toggling[task.id];
              const category = task.tags.find((tag) => DEFAULT_CATEGORIES.some((c) => c.name === tag));
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2.5 py-2 group rounded-lg px-1 transition-all duration-200 hover:bg-surface-hover ${
                    isToggling ? 'opacity-50 scale-[0.98]' : ''
                  }`}
                >
                  <button onClick={() => handleToggle(task.id, task.status)} className="shrink-0 cursor-pointer p-0.5">
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-primary transition-colors" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 flex items-center min-w-0 gap-2">
                    <p className={`text-sm truncate ${isCompleted ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                      {task.title}
                    </p>
                    {category && (
                      <span className="shrink-0 px-2 py-0.5 text-[10px] rounded-full text-white font-medium" style={{ backgroundColor: CATEGORY_COLOR_MAP[category] }}>
                        {category}
                      </span>
                    )}
                    <Badge variant={PRIORITY_CONFIG[task.priority].variant} size="sm" className="shrink-0 ml-auto font-medium">
                      {t(PRIORITY_CONFIG[task.priority].key)}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {tasks.length > 8 && (
              <p className="text-xs text-text-muted text-center pt-1">
                {t('task.more', { count: tasks.length - 8 })}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-3 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('task.new_task')}
          </button>
        </div>
      )}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('task.new_task')}
      >
        <div className="space-y-3">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={t('task.input_placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAddTask}
              className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              {t('task.create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}