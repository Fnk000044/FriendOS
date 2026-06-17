import { useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useLanguage } from '../../i18n/useLanguage';
import { PRIORITY_KEYS, PRIORITY_DEFAULT_COLORS, PRIORITY_ACTIVE_COLORS } from '../../utils/taskConstants';
import type { Task } from '../../db/models';

interface TaskInputProps {
  onCreated?: () => void;
}

const priorities: Task['priority'][] = ['urgent', 'high', 'medium', 'low'];

export default function TaskInput({ onCreated }: TaskInputProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [saving, setSaving] = useState(false);
  const { createTask } = useTasks();
  const { t } = useLanguage();

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    await createTask({ title: title.trim(), priority });
    setTitle('');
    setPriority('medium');
    setSaving(false);
    onCreated?.();
  }, [title, priority, saving, createTask, onCreated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-btn border px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all"
        style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--glass-border)' }}
      >
        <Plus className="w-5 h-5 text-text-muted shrink-0" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('task.input_placeholder')}
          className="flex-1 outline-none text-sm bg-transparent placeholder:text-text-muted"
        />
        {saving && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
      </div>
      <div className="flex gap-1.5 mt-2">
        {priorities.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
              priority === p ? PRIORITY_ACTIVE_COLORS[p] : PRIORITY_DEFAULT_COLORS[p]
            }`}
          >
            {t(PRIORITY_KEYS[p])}
          </button>
        ))}
      </div>
    </div>
  );
}
