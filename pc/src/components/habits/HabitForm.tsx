import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { useHabits } from '../../hooks/useHabits';
import { useLanguage } from '../../i18n/useLanguage';

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
}

const colors = ['#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#22C55E', '#6366F1'];

export default function HabitForm({ open, onClose }: HabitFormProps) {
  const { t } = useLanguage();
  const { createHabit } = useHabits();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await createHabit({ name: name.trim(), description, color });
    setSaving(false);
    setName('');
    setDescription('');
    setColor(colors[0]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('habit.create')}>
      <div className="space-y-4">
        <Input label={t('habit.name')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('habit.name_placeholder')} />
        <Textarea label={t('habit.desc')} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">{t('habit.color')}</label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>{t('habit.cancel')}</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>{t('habit.create_btn')}</Button>
        </div>
      </div>
    </Modal>
  );
}
