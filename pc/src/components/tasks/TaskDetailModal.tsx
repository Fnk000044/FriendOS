import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import TagInput from '../common/TagInput';
import { useTasks } from '../../hooks/useTasks';
import { useLanguage } from '../../i18n/useLanguage';
import { PRIORITY_KEYS, PRIORITY_DEFAULT_COLORS, PRIORITY_ACTIVE_COLORS } from '../../utils/taskConstants';
import type { Task, SubTask } from '../../db/models';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const priorities: Task['priority'][] = ['urgent', 'high', 'medium', 'low'];

const categories = [
  { id: '工作', label: '工作', color: '#3B82F6' },
  { id: '学习', label: '学习', color: '#8B5CF6' },
  { id: '生活', label: '生活', color: '#22C55E' },
  { id: '健康', label: '健康', color: '#F59E0B' },
  { id: '自定义', label: '自定义', color: '#6B7280' },
];

export default function TaskDetailModal({ task, open, onClose }: TaskDetailModalProps) {
  const { t } = useLanguage();
  const { createTask, updateTask, deleteTask, createRecurringTasks } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState('');
  const [repeatEnd, setRepeatEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: boolean; interval?: boolean; endDate?: boolean; dueTime?: boolean }>({});
  const [shaking, setShaking] = useState(false);

  // 新增字段：截止时间 + 提醒 + 子任务
  const [dueTime, setDueTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const isNew = !task;

  // 仅在 modal 打开时（open 从 false→true）加载/重置字段，
  // 关闭时不执行 reset——Modal 组件会在退出动画后卸载组件自然清理，
  // 避免"内容先变空再淡出"的闪屏现象
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setScheduledDate(task.scheduledDate);
      setTags(task.tags || []);
      setRepeatEnabled(!!task.repeatInterval);
      setRepeatInterval(task.repeatInterval ? String(task.repeatInterval) : '');
      setRepeatEnd(task.repeatEnd || '');
      setDueTime(task.dueTime || '');
      setReminderEnabled(task.reminderEnabled ?? false);
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
      setTags([]);
      setRepeatEnabled(false);
      setRepeatInterval('');
      setRepeatEnd('');
      setDueTime('');
      setReminderEnabled(false);
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
    setErrors({});
    setShaking(false);
  }, [task, open]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    if (categoryId === '自定义') return;
    setTags((prev) =>
      prev.includes(categoryId) ? prev.filter((t) => t !== categoryId) : [...prev, categoryId]
    );
  }, []);

  const handleCustomTagAdd = useCallback(() => {
    setCustomTag((prev) => {
      const tag = prev.trim();
      if (tag) {
        setTags((prevTags) => prevTags.includes(tag) ? prevTags : [...prevTags, tag]);
      }
      return '';
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;

    const newErrors = { title: false, interval: false, endDate: false, dueTime: false };
    let hasError = false;

    if (!title.trim()) {
      newErrors.title = true;
      hasError = true;
    }

    // 截止时间必填（避免无截止时间的任务堆积）
    if (!dueTime) {
      newErrors.dueTime = true;
      hasError = true;
    }

    if (isNew && repeatEnabled) {
      if (!repeatInterval || parseInt(repeatInterval) < 1) {
        newErrors.interval = true;
        hasError = true;
      }
      if (!repeatEnd) {
        newErrors.endDate = true;
        hasError = true;
      }
      if (repeatEnd && repeatEnd < scheduledDate) {
        newErrors.endDate = true;
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      setShaking(false);
      setTimeout(() => {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }, 10);
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const intervalNum = repeatEnabled && repeatInterval ? parseInt(repeatInterval) : undefined;
        if (repeatEnabled && repeatEnd && intervalNum) {
          await createRecurringTasks(
            { title: title.trim(), description, priority, tags, dueTime: dueTime || undefined, reminderEnabled, subtasks },
            intervalNum,
            scheduledDate,
            repeatEnd,
          );
        } else {
          await createTask({ title: title.trim(), description, priority, scheduledDate, tags, dueTime: dueTime || undefined, reminderEnabled, subtasks });
        }
      } else {
        await updateTask(task.id, {
          title: title.trim(),
          description,
          priority,
          scheduledDate,
          tags,
          dueTime: dueTime || undefined,
          reminderEnabled,
          subtasks,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [saving, title, isNew, repeatEnabled, repeatInterval, repeatEnd, scheduledDate, description, priority, tags, task, dueTime, reminderEnabled, subtasks, createRecurringTasks, createTask, updateTask, onClose]);

  // 子任务操作（编辑态本地管理，保存时统一写入）
  const handleAddSubtask = useCallback(() => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    setSubtasks(prev => [...prev, { id: crypto.randomUUID(), title: trimmed, done: false }]);
    setNewSubtaskTitle('');
  }, [newSubtaskTitle]);

  const handleToggleSubtaskLocal = useCallback((id: string) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
  }, []);

  const handleDeleteSubtaskLocal = useCallback((id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!task) return;
    await deleteTask(task.id);
    onClose();
  }, [task, deleteTask, onClose]);

  return (
    <Modal open={open} onClose={onClose} title={isNew ? t('task.new_task') : t('task.detail')}>
      <div className="space-y-4">
        <Input
            label={`${t('task.title_label')} *`}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: false }); }}
            error={errors.title ? t('task.title_required') : ''}
            shake={errors.title && shaking}
          />
        <Textarea label={t('task.description_label')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">{t('task.priority_label')}</label>
            <div className="flex gap-1.5">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    priority === p ? PRIORITY_ACTIVE_COLORS[p] : PRIORITY_DEFAULT_COLORS[p]
                  }`}
                  style={priority === p ? undefined : { borderColor: 'var(--glass-border)' }}
                >
                  {t(PRIORITY_KEYS[p])}
                </button>
              ))}
            </div>
          </div>
          <Input
            label={t('task.scheduled_date_label')}
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>

        {/* 截止时间 + 提醒开关 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">截止时间 <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-btn border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.dueTime ? 'border-red-400' : ''}`}
              style={{ background: 'var(--bg-card-solid)', borderColor: errors.dueTime ? '#F87171' : 'var(--border-input)' }}
            />
            {errors.dueTime && <p className="text-xs text-red-500">请选择截止时间</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">到期提醒</label>
            <label className="flex items-center gap-2 h-[42px] text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                disabled={!dueTime}
                className="rounded border-slate-300 text-primary focus:ring-primary/30 disabled:opacity-40"
              />
              {dueTime ? '到期前 5 分钟通知' : '需先设截止时间'}
            </label>
          </div>
        </div>

        {/* 子任务清单 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">子任务清单</label>
          {subtasks.length > 0 && (
            <div className="space-y-1">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-hover/50 group">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtaskLocal(s.id)}
                    className="shrink-0"
                    aria-label={s.done ? '标记未完成' : '标记完成'}
                  >
                    {s.done ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-text-muted" />}
                  </button>
                  <span className={`text-sm flex-1 ${s.done ? 'line-through text-text-muted' : 'text-text-secondary'}`}>{s.title}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtaskLocal(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all"
                    aria-label="删除子任务"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
              placeholder="添加子任务后回车"
              className="flex-1 px-3 py-1.5 text-sm border rounded-btn outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card-solid)', color: 'var(--text-primary)' }}
            />
            <Button variant="secondary" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isNew && (
          <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary/30"
              />
              {t('task.repeat_toggle')}
            </label>
            {repeatEnabled && (
              <div className="flex gap-3 pl-5">
                <div className="flex-1">
                  <label className="text-xs text-text-muted block mb-1">{t('task.repeat_interval')}</label>
                  <input
                    type="number"
                    min={1}
                    value={repeatInterval}
                    onChange={(e) => { setRepeatInterval(e.target.value); setErrors({ ...errors, interval: false }); }}
                    placeholder="1"
                    className={`w-full px-3 py-1.5 text-sm border rounded-btn outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 ${errors.interval ? 'border-red-500' : ''} ${errors.interval && shaking ? 'animate-shake' : ''}`}
                    style={errors.interval ? undefined : { borderColor: 'var(--glass-border)' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted block mb-1">{t('task.repeat_end')}</label>
                  <input
                    type="date"
                    value={repeatEnd}
                    onChange={(e) => { setRepeatEnd(e.target.value); setErrors({ ...errors, endDate: false }); }}
                    className={`w-full px-3 py-1.5 text-sm border rounded-btn outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 ${errors.endDate ? 'border-red-500' : ''} ${errors.endDate && shaking ? 'animate-shake' : ''}`}
                    style={errors.endDate ? undefined : { borderColor: 'var(--glass-border)' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">分类标签</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = tags.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'text-text-secondary hover:border-primary hover:text-primary'
                  }`}
                  style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : { borderColor: 'var(--glass-border)' }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          {tags.includes('自定义') && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustomTagAdd(); } }}
                placeholder="输入自定义标签后回车"
                className="flex-1 px-3 py-1.5 text-sm border rounded-btn outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card-solid)', color: 'var(--text-primary)' }}
              />
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.filter((t) => !categories.map((c) => c.id).includes(t) && t !== '自定义').map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                {tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-primary-dark">×</button>
              </span>
            ))}
          </div>
        </div>

        {!isNew && task.isRollover && task.originalDate && (
          <p className="text-xs text-amber-500">{t('task.rollover_notice', { date: task.originalDate })}</p>
        )}

        <div className="flex justify-between pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          {!isNew ? <Button variant="danger" onClick={handleDelete}>{t('task.delete')}</Button> : <div />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>{t('task.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : (isNew ? t('task.create') : t('task.save'))}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
