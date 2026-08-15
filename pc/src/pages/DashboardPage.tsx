import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../db';
import { useDailyRecords } from '../hooks/useDailyRecords';
import { generateHealthProfile } from '../services/emotion/HealthProfileService';
import DashboardGreeting from '../components/dashboard/DashboardGreeting';
import QuickStats from '../components/dashboard/QuickStats';
import TodayTodos from '../components/dashboard/TodayTodos';
import TodayDiary from '../components/dashboard/TodayDiary';
import LearningCheckin from '../components/dashboard/LearningCheckin';
import WeeklyReview from '../components/dashboard/WeeklyReview';
import EmotionOverview from '../components/dashboard/EmotionOverview';
import InterventionRecommendations from '../components/dashboard/InterventionRecommendations';
import BehaviorInsightCard from '../components/dashboard/BehaviorInsightCard';
import RiskBanner from '../components/common/RiskBanner';
import DiagnosticsPanel from '../components/settings/DiagnosticsPanel';
import SelfEvolutionPanel from '../components/selfevolution/SelfEvolutionPanel';

// 首屏自检面板：首次启动展示，可关闭；之后可从设置页重新打开
const DIAG_DISMISS_KEY = 'friendos_diagnostics_dismissed';

export default function DashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { computeDailyRecord } = useDailyRecords();
  const [diagDismissed, setDiagDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(DIAG_DISMISS_KEY) === '1'
  );

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

  return (
    <div className="space-y-6 stagger-in">
      <DashboardGreeting />

      {/* 启动自检面板（首次启动展示，可关闭；设置页可再次打开） */}
      {!diagDismissed && (
        <DiagnosticsPanel
          onClose={() => {
            try { localStorage.setItem(DIAG_DISMISS_KEY, '1'); } catch { /* ignore */ }
            setDiagDismissed(true);
          }}
        />
      )}

      <QuickStats />

      {/* 主动风险预警横幅 + 行为洞察 */}
      <div className="space-y-4">
        <RiskBanner />
        <BehaviorInsightCard />
      </div>

      {/* 知己度：让用户感知「反馈是有效的」正向飞轮 */}
      <SelfEvolutionPanel />

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