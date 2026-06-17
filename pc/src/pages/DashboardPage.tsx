import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../db';
import { useDailyRecords } from '../hooks/useDailyRecords';
import { useLanguage } from '../i18n/useLanguage';
import QuickStats from '../components/dashboard/QuickStats';
import TodayTodos from '../components/dashboard/TodayTodos';
import TodayDiary from '../components/dashboard/TodayDiary';
import LearningCheckin from '../components/dashboard/LearningCheckin';
import WeeklyReview from '../components/dashboard/WeeklyReview';
import EmotionOverview from '../components/dashboard/EmotionOverview';
import { useAI } from '../hooks/useAI';

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { initService } = useAI();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { computeDailyRecord } = useDailyRecords();

  useEffect(() => {
    initService();
  }, [initService]);

  const counts = useLiveQuery(async () => {
    const [t, h, l] = await Promise.all([
      db.tasks.where('scheduledDate').equals(today).count(),
      db.habits.filter(h => !h.archived).count(),
      db.habitLogs.where('date').equals(today).count(),
    ]);
    return { tasks: t, habits: h, logs: l };
  }, []);

  useEffect(() => {
    computeDailyRecord(today);
  }, [today, computeDailyRecord, counts?.tasks, counts?.habits, counts?.logs]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? '夜深了，注意休息' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  const dateDisplay = lang === 'zh-CN'
    ? `${now.getMonth() + 1}月${now.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}`
    : format(now, 'EEE, MMM d');

  return (
    <div className="space-y-6 stagger-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-primary mb-1">{greeting}</p>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            {t('dashboard.today_overview')}
          </h2>
        </div>
        <span className="text-xs text-text-muted font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-hover)' }}>
          {dateDisplay}
        </span>
      </div>

      <QuickStats />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 items-start">
        <div className="space-y-5">
          <TodayTodos />
          <LearningCheckin />
        </div>
        <div className="space-y-5">
          <TodayDiary />
          <EmotionOverview />
        </div>
      </div>

      <WeeklyReview />
    </div>
  );
}