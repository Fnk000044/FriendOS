import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import TagInput from '../common/TagInput';
import { useTasks } from '../../hooks/useTasks';
import { useLanguage } from '../../i18n/useLanguage';
import { PRIORITY_KEYS, PRIORITY_DEFAULT_COLORS, PRIORITY_ACTIVE_COLORS } from '../../utils/taskConstants';
import type { Task } from '../../db/models';

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
  const [errors, setErrors] = useState<{ title?: boolean; interval?: boolean; endDate?: boolean }>({});
  const [shaking, setShaking] = useState(false);

  const isNew = !task;

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setScheduledDate(task.scheduledDate);
        setTags(task.tags || []);
        setRepeatEnabled(!!task.repeatInterval);
        setRepeatInterval(task.repeatInterval ? String(task.repeatInterval) : '');
        setRepeatEnd(task.repeatEnd || '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
        setTags([]);
        setRepeatEnabled(false);
        setRepeatInterval('');
        setRepeatEnd('');
      }
      setErrors({});
      setShaking(false);
    }
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

    const newErrors = { title: false, interval: false, endDate: false };
    let hasError = false;

    if (!title.trim()) {
      newErrors.title = true;
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
            { title: title.trim(), description, priority, tags },
            intervalNum,
            scheduledDate,
            repeatEnd,
          );
        } else {
          await createTask({ title: title.trim(), description, priority, scheduledDate, tags });
        }
      } else {
        await updateTask(task.id, {
          title: title.trim(),
          description,
          priority,
          scheduledDate,
          tags,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [saving, title, isNew, repeatEnabled, repeatInterval, repeatEnd, scheduledDate, description, priority, tags, task, createRecurringTasks, createTask, updateTask, onClose]);

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
                style={{ borderColor: 'var(--glass-border)' }}
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
