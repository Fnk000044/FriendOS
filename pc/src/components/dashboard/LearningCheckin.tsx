import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';
import { useHabits } from '../../hooks/useHabits';
import { CardSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';

export default function LearningCheckin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toggleLog } = useHabits();
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  const checkinData = useLiveQuery(async () => {
    const [allHabits, todayLogs, weekLogs] = await Promise.all([
      db.habits.where('archived').equals(0).toArray(),
      db.habitLogs.where('date').equals(today).toArray(),
      db.habitLogs.where('date').between(weekAgo, today, true, true).toArray(),
    ]);
    return { allHabits, todayLogs, weekLogs };
  }, []);

  if (!checkinData) return <CardSkeleton lines={4} />;

  const { allHabits, todayLogs, weekLogs } = checkinData;

  const loggedIds = new Set(todayLogs.map((l) => l.habitId));
  const todayCompleted = allHabits.filter((h) => loggedIds.has(h.id)).length;
  const total = allHabits.length;

  // 计算本周完成的习惯数（去重）
  const weekLoggedIds = new Set(weekLogs.map((l) => l.habitId));

  const progress = total > 0 ? (todayCompleted / total) * 100 : 0;

  return (
    <div className="glass-card-accent p-5 flex flex-col" style={{ '--accent-color': '#F59E0B' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F59E0B15, #FBBF2415)', color: '#F59E0B' }}>
            <CheckSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.habit_checkin')}</h3>
          {total > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
              {todayCompleted}/{total}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/habits')}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {total === 0 ? (
        <EmptyState title={t('dashboard.no_habits')} />
      ) : (
        <div className="flex-1">
          <div className="space-y-0.5 mb-4">
            {allHabits.map((habit) => {
              const done = loggedIds.has(habit.id);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleLog(habit.id, today)}
                  className="flex items-center gap-2.5 w-full py-2 group rounded-lg px-1.5 transition-all duration-200 hover:bg-surface-hover cursor-pointer"
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-text-muted group-hover:text-amber-500 shrink-0 transition-colors" />
                  )}
                  <span className={`text-sm ${done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    {habit.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                  : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
              }}
            />
          </div>
          {progress === 100 && (
            <p className="text-xs text-green-600 font-medium mt-2 text-center">全部完成！</p>
          )}
        </div>
      )}
    </div>
  );
}