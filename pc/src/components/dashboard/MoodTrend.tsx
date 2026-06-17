import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { db } from '../../db';
import { MOOD_EMOJIS } from '../../utils/constants';
import { useLanguage } from '../../i18n/useLanguage';

export default function MoodTrend() {
  const { t, lang } = useLanguage();
  const today = new Date();
  const startDate = subDays(today, 6);

  const diaries = useLiveQuery(
    () => db.diaries
      .where('date')
      .between(format(startDate, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'), true, true)
      .toArray(),
  );

  const days = eachDayOfInterval({ start: startDate, end: today });
  const diaryMap = new Map((diaries || []).map((d) => [d.date, d]));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3">{t('dashboard.mood_trend')}</h3>
      <div className="flex items-end justify-between gap-1 h-16">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const diary = diaryMap.get(dateStr);
          const mood = diary?.mood;

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1 flex-1">
              {mood ? (
                <span className="text-lg">{MOOD_EMOJIS[mood]}</span>
              ) : (
                <span className="text-lg opacity-20">—</span>
              )}
              <span className="text-[10px] text-text-muted">{format(day, lang === 'zh-CN' ? 'E' : 'EEE')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
