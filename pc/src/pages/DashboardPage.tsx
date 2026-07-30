import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../db';
import { useDailyRecords } from '../hooks/useDailyRecords';
import { useLanguage } from '../i18n/useLanguage';
import { useClock, getGreeting } from '../hooks/useClock';
import { generateHealthProfile } from '../services/emotion/HealthProfileService';
import QuickStats from '../components/dashboard/QuickStats';
import TodayTodos from '../components/dashboard/TodayTodos';
import TodayDiary from '../components/dashboard/TodayDiary';
import LearningCheckin from '../components/dashboard/LearningCheckin';
import WeeklyReview from '../components/dashboard/WeeklyReview';
import EmotionOverview from '../components/dashboard/EmotionOverview';
import InterventionRecommendations from '../components/dashboard/InterventionRecommendations';
import BehaviorInsightCard from '../components/dashboard/BehaviorInsightCard';
import RiskBanner from '../components/common/RiskBanner';

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { computeDailyRecord } = useDailyRecords();

  // 首次加载（无数据时）自动生成基线健康画像，避免仪表盘空态循环
  useEffect(() => {
    generateHealthProfile().catch((err) =>
      console.warn('[DashboardPage] generateHealthProfile failed:', err)
    );
  }, []);

  const counts = useLiveQuery(async () => {
    const [t, h, l] = await Promise.all([
      db.tasks.where('scheduledDate').equals(today).count(),
      db.habits.filter((h) => !h.archived).count(),
      db.habitLogs.where('date').equals(today).count(),
    ]);
    return { tasks: t, habits: h, logs: l };
  }, []);

  useEffect(() => {
    computeDailyRecord(today);
  }, [today, computeDailyRecord, counts?.tasks, counts?.habits, counts?.logs]);

  // 实时时钟：问候语和日期随时间自动更新（跨时段不再需要刷新页面）
  const now = useClock();
  const greeting = getGreeting(now, lang);

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

      {/* 主动风险预警横幅 + 行为洞察 */}
      <div className="space-y-4">
        <RiskBanner />
        <BehaviorInsightCard />
      </div>

      {/* 主内容区：严格两列网格，整齐对齐，所有卡片等高 */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 items-stretch">
        <TodayTodos />
        <EmotionOverview />
        <InterventionRecommendations />
        <TodayDiary />
        <LearningCheckin />
        <WeeklyReview />
      </div>
    </div>
  );
}