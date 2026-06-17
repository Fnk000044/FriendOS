import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

export default function RecentDiary() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const entries = useLiveQuery(
    () => db.diaries.orderBy('date').reverse().limit(3).toArray(),
  );

  if (!entries || entries.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">{t('dashboard.recent_diary')}</h3>
        <p className="text-xs text-text-muted py-4 text-center">{t('diary.no_entries')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.recent_diary')}</h3>
        <button onClick={() => navigate('/diary')} className="text-xs text-primary hover:underline cursor-pointer">
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3 inline" />
        </button>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => navigate(`/diary/${entry.id}`)}
            className="cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">
                {format(parseISO(entry.date), lang === 'zh-CN' ? 'M月d日' : 'MMM d')}
              </p>
              <span className="text-sm">{['😡', '😞', '😐', '😊', '😄'][entry.mood - 1]}</span>
            </div>
            <p className="text-sm text-text-primary truncate group-hover:text-primary transition-colors">
              {entry.title || entry.content.slice(0, 60)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
