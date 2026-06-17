import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';

export default function WeeklyReview() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  const weeklyDiaries = useLiveQuery(
    () => db.diaries.where('date').between(weekAgo, today, true, true).toArray(),
  );

  const count = weeklyDiaries?.length || 0;

  return (
    <div className="glass-card-accent p-5 flex flex-col" style={{ '--accent-color': '#3B82F6' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F615, #60A5FA15)', color: '#3B82F6' }}>
            <ClipboardList className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.weekly_review_entries')}</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
            {count}
          </span>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {count === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">
          {t('dashboard.no_diary_today')}
        </p>
      ) : (
        <div className="flex-1 space-y-1 max-h-36 overflow-y-auto">
          {weeklyDiaries!.slice(0, 5).map((diary) => (
            <div key={diary.id} className="flex items-center gap-2.5 text-xs py-2 px-2 rounded-lg transition-colors duration-150 hover:bg-surface-hover">
              <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                {format(new Date(diary.date), 'MM/dd')}
              </span>
              <span className="text-text-secondary truncate">
                {diary.title || diary.content.slice(0, 30)}
                {(diary.title || diary.content).length > 30 ? '...' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}