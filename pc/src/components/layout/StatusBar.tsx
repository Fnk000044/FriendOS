import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';
import { useClock } from '../../hooks/useClock';

interface StatusBarData {
  pendingTasks: number;
  completedTasks: number;
  diariesCount: number;
  completedHabits: number;
  totalHabits: number;
  emotionsCount: number;
  therapiesCount: number;
}

export default function StatusBar() {
  const location = useLocation();
  const { t } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = useClock();
  const currentTime = format(now, 'HH:mm:ss');
  const pathname = location.pathname;

  // 性能优化：按路由条件执行查询，减少不必要的数据库访问
  const needsTasks = pathname === '/' || pathname === '/tasks';
  const needsDiaries = pathname === '/diary';
  const needsHabits = pathname === '/habits';
  const needsEmotions = pathname === '/emotion';
  const needsTherapies = pathname === '/therapy';

  // 性能优化：合并多张表的查询为单个 useLiveQuery，避免 6 次独立订阅
  // 依据路由标志决定每张表是否实际查询，未匹配路由的表返回默认值
  const data = useLiveQuery<StatusBarData>(async () => {
    const [tasks, diariesCount, habits, todayLogs, emotionsCount, therapiesCount] = await Promise.all([
      needsTasks ? db.tasks.where('scheduledDate').equals(today).toArray() : Promise.resolve([]),
      needsDiaries ? db.diaries.count() : Promise.resolve(0),
      needsHabits ? db.habits.filter((h) => !h.archived).toArray() : Promise.resolve([]),
      needsHabits ? db.habitLogs.where('date').equals(today).toArray() : Promise.resolve([]),
      needsEmotions ? db.emotionRecords.count() : Promise.resolve(0),
      needsTherapies ? db.therapyRecords.count() : Promise.resolve(0),
    ]);

    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    return {
      pendingTasks,
      completedTasks,
      diariesCount,
      completedHabits: todayLogs.length,
      totalHabits: habits.length,
      emotionsCount,
      therapiesCount,
    };
  }, [today, needsTasks, needsDiaries, needsHabits, needsEmotions, needsTherapies]);

  const d = data || {
    pendingTasks: 0, completedTasks: 0, diariesCount: 0,
    completedHabits: 0, totalHabits: 0, emotionsCount: 0, therapiesCount: 0,
  };

  // Get status text based on current page
  const getStatusText = () => {
    switch (pathname) {
      case '/':
        return `今日任务: ${d.pendingTasks} 待完成, ${d.completedTasks} 已完成`;
      case '/tasks':
        return `${d.pendingTasks} 个待办任务`;
      case '/diary':
        return `共 ${d.diariesCount} 篇日记`;
      case '/habits':
        return `今日习惯: ${d.completedHabits}/${d.totalHabits} 已完成`;
      case '/emotion':
        return `共 ${d.emotionsCount} 条情感记录`;
      case '/therapy':
        return `共 ${d.therapiesCount} 条练习记录`;
      case '/memories':
        return '记忆库';
      case '/reports':
        return '数据报表';
      case '/settings':
        return '应用设置';
      case '/sync':
        return '数据同步';
      case '/assistant':
<<<<<<< HEAD
        return '知己助理';
=======
        return 'AI 助理';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
      default:
        return '知己 - 你的心理健康助手';
    }
  };

  return (
    <div
      className="h-7 border-t backdrop-blur-glass flex items-center justify-between px-5 text-xs"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="font-medium">{getStatusText()}</span>
      </div>
      <span className="tabular-nums font-medium tracking-wide">{currentTime}</span>
    </div>
  );
}
