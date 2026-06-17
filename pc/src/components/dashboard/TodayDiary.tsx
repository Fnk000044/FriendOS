import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, PenLine } from 'lucide-react';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';

export default function TodayDiary() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayDiary = useLiveQuery(
    () => db.diaries.where('date').equals(today).first(),
  );

  return (
    <div className="glass-card-accent p-5 flex flex-col" style={{ '--accent-color': '#8B5CF6' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF615, #A78BFA15)', color: '#8B5CF6' }}>
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.today_diary')}</h3>
        </div>
        <button
          onClick={() => navigate('/diary')}
          className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          {t('dashboard.view_all')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {!todayDiary ? (
        <div className="text-center py-8 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(167,139,250,0.02))' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <PenLine className="w-5 h-5" style={{ color: '#8B5CF6' }} />
          </div>
          <p className="text-xs text-text-muted mb-3">{t('dashboard.no_diary_today')}</p>
          <button
            onClick={() => navigate('/diary/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 hover:shadow-md text-white"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
          >
            <PenLine className="w-3.5 h-3.5" />
            {t('dashboard.write_diary')}
          </button>
        </div>
      ) : (
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-2 font-medium">
            {format(new Date(todayDiary.date), 'HH:mm')}
          </p>
          {todayDiary.title && (
            <p className="text-sm font-semibold text-text-primary mb-1.5">{todayDiary.title}</p>
          )}
          <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
            {todayDiary.content.slice(0, 100)}
            {todayDiary.content.length > 100 ? '...' : ''}
          </p>
        </div>
      )}
    </div>
  );
}