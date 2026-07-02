import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays } from 'date-fns';
import { db } from '../../db';
import { CheckSquare, BookOpen, Target, ClipboardList } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import AnimatedNumber from '../common/AnimatedNumber';
import { StatCardSkeleton } from '../common/Skeleton';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  statusText: string;
  color: string;
}

function StatCard({ icon, label, value, statusText, color }: StatCardProps) {
  return (
    <div className="glass-card-accent p-4 flex flex-col h-full" style={{ '--accent-color': color } as React.CSSProperties}>
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}12`, color }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      </div>
      <div className="flex-1 flex items-end">
        <AnimatedNumber value={value} className="text-3xl font-bold tabular-nums" />
      </div>
      <div className="mt-3 pt-2.5 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="text-xs text-text-muted font-medium">{statusText}</span>
      </div>
    </div>
  );
}

export default function QuickStats() {
  const { t } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  // 性能优化：合并为单个 useLiveQuery，减少数据库查询次数
  const data = useLiveQuery(async () => {
    const [todayTasks, todayDiary, studyHabits, todayLogs, weeklyDiaries] = await Promise.all([
      db.tasks.where('scheduledDate').equals(today).toArray(),
      db.diaries.where('date').equals(today).first(),
      db.habits.filter((h) => !h.archived).toArray(),
      db.habitLogs.where('date').equals(today).toArray(),
      db.diaries.where('date').between(weekAgo, today, true, true).toArray(),
    ]);
    return { todayTasks, todayDiary, studyHabits, todayLogs, weeklyDiaries };
  }, [today, weekAgo]);

  const todayTasks = data?.todayTasks;
  const todayDiary = data?.todayDiary;
  const studyHabits = data?.studyHabits;
  const todayLogs = data?.todayLogs;
  const weeklyDiaries = data?.weeklyDiaries;

  // 加载中时显示骨架屏，避免闪现 0 值
  if (data === undefined) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-stretch stagger-in">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  const pendingCount = todayTasks?.filter((t) => t.status === 'pending').length || 0;
  const totalCount = todayTasks?.length || 0;
  const diaryWritten = todayDiary ? 1 : 0;
  const studyLoggedToday = todayLogs?.filter((log) =>
    studyHabits?.some((h) => h.id === log.habitId)
  ).length || 0;
  const studyTotal = studyHabits?.length || 0;
  const studyPending = studyTotal - studyLoggedToday;
  const weekDiaryCount = weeklyDiaries?.length || 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-stretch stagger-in">
      <StatCard
        icon={<CheckSquare className="w-4 h-4" />}
        label={t('dashboard.stats_today_task')}
        value={pendingCount}
        statusText={pendingCount > 0 ? `未完成（${pendingCount}）` : `已完成`}
        color="#14B8A6"
      />
      <StatCard
        icon={<BookOpen className="w-4 h-4" />}
        label={t('dashboard.today_diary')}
        value={diaryWritten}
        statusText={diaryWritten ? '已记录' : '未记录'}
        color="#8B5CF6"
      />
      <StatCard
        icon={<Target className="w-4 h-4" />}
        label={t('dashboard.study_checkin')}
        value={studyLoggedToday}
        statusText={studyPending > 0 ? `未完成（${studyPending}）` : `已完成`}
        color="#F59E0B"
      />
      <StatCard
        icon={<ClipboardList className="w-4 h-4" />}
        label={t('dashboard.weekly_review_entries')}
        value={weekDiaryCount}
        statusText={`本周记录`}
        color="#3B82F6"
      />
    </div>
  );
}