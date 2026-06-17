import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';
import { useHabits } from '../../hooks/useHabits';
import { CardSkeleton } from '../common/Skeleton';

export default function HabitSummary() {
  const { t } = useLanguage();
  const { toggleLog } = useHabits();
  const today = format(new Date(), 'yyyy-MM-dd');

  const habits = useLiveQuery(
    () => db.habits.filter((h) => !h.archived).toArray(),
  );

  const todayLogs = useLiveQuery(
    () => db.habitLogs.where('date').equals(today).toArray(),
  );

  if (!habits || !todayLogs) return <CardSkeleton lines={3} />;

  const loggedIds = new Set(todayLogs.map((l) => l.habitId));
  const completed = habits.filter((h) => loggedIds.has(h.id)).length;
  const total = habits.length;

  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3">{t('dashboard.habit_summary')}</h3>

      {total === 0 ? (
        <p className="text-xs text-text-muted py-4 text-center">{t('dashboard.no_habits')}</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl font-bold text-primary">{completed}</div>
            <div className="text-xs text-text-muted">
              / {total} {t('dashboard.completed')}
            </div>
            <div className="text-xs text-text-muted ml-auto">
              {Math.round(completionRate)}%
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {habits.map((habit) => {
              const done = loggedIds.has(habit.id);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleLog(habit.id, today)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs hover:opacity-80 transition-opacity cursor-pointer"
                  style={{
                    backgroundColor: done ? `${habit.color}15` : '#F1F5F9',
                    color: done ? habit.color : '#94A3B8',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: done ? habit.color : '#CBD5E1' }} />
                  {habit.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
