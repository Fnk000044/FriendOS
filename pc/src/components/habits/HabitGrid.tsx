<<<<<<< HEAD
import { useMemo, useState } from 'react';
=======
import { useMemo } from 'react';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../../db';
import { useHabits } from '../../hooks/useHabits';
import HabitCard from './HabitCard';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
<<<<<<< HEAD
import ConfirmDialog from '../common/ConfirmDialog';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { useLanguage } from '../../i18n/useLanguage';

interface HabitGridProps {
  onEditHabit: (id: string) => void;
}

export default function HabitGrid({ onEditHabit }: HabitGridProps) {
  const { t } = useLanguage();
  const { toggleLog, deleteHabit } = useHabits();
  const today = format(new Date(), 'yyyy-MM-dd');
<<<<<<< HEAD
  // P2-8：window.confirm → ConfirmDialog
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  const gridData = useLiveQuery(async () => {
    const [habits, todayLogs] = await Promise.all([
      db.habits.filter((h) => !h.archived).toArray(),
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

  const handleToggleDate = async (habitId: string, date: string) => {
    await toggleLog(habitId, date);
  };

  const handleDelete = (habitId: string) => {
<<<<<<< HEAD
    setPendingDelete(habitId);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    await deleteHabit(id);
=======
    if (window.confirm(t('common.delete_confirm'))) {
      deleteHabit(habitId);
    }
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  };

  if (!habits) return <LoadingSpinner text={t('habit.loading')} />;

  if (habits.length === 0) {
    return <EmptyState title={t('habit.no_habits')} description={t('habit.no_habits_desc')} />;
  }

  return (
<<<<<<< HEAD
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            isLogged={loggedHabitIds.has(habit.id)}
            streak={0}
            onToggle={() => handleToggle(habit.id)}
            onToggleDate={(date) => handleToggleDate(habit.id, date)}
            onEdit={() => onEditHabit(habit.id)}
            onDelete={handleDelete}
          />
        ))}
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        title={t('common.delete_confirm_title')}
        message={t('common.delete_confirm')}
      />
    </>
=======
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          isLogged={loggedHabitIds.has(habit.id)}
          streak={0}
          onToggle={() => handleToggle(habit.id)}
          onToggleDate={(date) => handleToggleDate(habit.id, date)}
          onEdit={() => onEditHabit(habit.id)}
          onDelete={handleDelete}
        />
      ))}
    </div>
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  );
}
