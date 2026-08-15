import { useState } from 'react';
import { Plus } from 'lucide-react';
import HabitGrid from '../components/habits/HabitGrid';
import HabitForm from '../components/habits/HabitForm';
import Button from '../components/common/Button';
import { useLanguage } from '../i18n/useLanguage';

export default function HabitsPage() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-muted">{t('habit.title')}</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          {t('habit.create')}
        </Button>
      </div>

      <HabitGrid onEditHabit={() => {}} />
      <HabitForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
