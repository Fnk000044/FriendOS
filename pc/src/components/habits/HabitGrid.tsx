import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../../db';
import { useHabits } from '../../hooks/useHabits';
import HabitCard from './HabitCard';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import { useLanguage } from '../../i18n/useLanguage';

interface HabitGridProps {
  onEditHabit: (id: string) => void;
}

export default function HabitGrid({ onEditHabit }: HabitGridProps) {
  const { t } = useLanguage();
  const { toggleLog, deleteHabit } = useHabits();
  const today = format(new Date(), 'yyyy-MM-dd');

  const gridData = useLiveQuery(async () => {
    const [habits, todayLogs] = await Promise.all([
      db.habits.filter(h => !h.archived).toArray(),
      db.habitLogs.where('date').equals(today).toArray(),
    ]);
    return { habits, todayLogs };
  }, []);

  const habits = gridData?.habits;
  const loggedHabitIds = useMemo(
    () => new Set((gridData?.todayLogs || []).map((l) => l.habitId)),
    [gridData],
  );

  const handleToggle = async (habitId: string) => {
    await toggleLog(habitId, today);
  };

  const handleDelete = (habitId: string) => {
    if (window.confirm(t('common.delete_confirm'))) {
      deleteHabit(habitId);
    }
  };

  if (!habits) return <LoadingSpinner text={t('habit.loading')} />;

  if (habits.length === 0) {
    return <EmptyState title={t('habit.no_habits')} description={t('habit.no_habits_desc')} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          isLogged={loggedHabitIds.has(habit.id)}
          streak={0}
          onToggle={() => handleToggle(habit.id)}
          onEdit={() => onEditHabit(habit.id)}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
