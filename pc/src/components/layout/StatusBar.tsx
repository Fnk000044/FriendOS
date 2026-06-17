import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';

export default function StatusBar() {
  const location = useLocation();
  const { t } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [currentTime, setCurrentTime] = useState(() => format(new Date(), 'HH:mm'));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(format(new Date(), 'HH:mm')), 60000);
    return () => clearInterval(timer);
  }, []);
  const pathname = location.pathname;

  // 性能优化：按路由条件执行查询，减少不必要的数据库访问
  const needsTasks = pathname === '/' || pathname === '/tasks';
  const needsDiaries = pathname === '/diary';
  const needsHabits = pathname === '/habits';
  const needsEmotions = pathname === '/emotion';
  const needsTherapies = pathname === '/therapy';

  const tasks = useLiveQuery(
    () => needsTasks ? db.tasks.where('scheduledDate').equals(today).toArray() : [],
    [today, needsTasks]
  );
  const diariesCount = useLiveQuery(
    () => needsDiaries ? db.diaries.count() : 0,
    [needsDiaries]
  );
  const habits = useLiveQuery(
    () => needsHabits ? db.habits.filter(h => !h.archived).toArray() : [],
    [needsHabits]
  );
  const todayLogs = useLiveQuery(
    () => needsHabits ? db.habitLogs.where('date').equals(today).toArray() : [],
    [today, needsHabits]
  );
  const emotionsCount = useLiveQuery(
    () => needsEmotions ? db.emotionRecords.count() : 0,
    [needsEmotions]
  );
  const therapiesCount = useLiveQuery(
    () => needsTherapies ? db.therapyRecords.count() : 0,
    [needsTherapies]
  );

  const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const completedHabits = todayLogs?.length || 0;
  const totalHabits = habits?.length || 0;

  // Get status text based on current page
  const getStatusText = () => {
    switch (pathname) {
      case '/':
        return `今日任务: ${pendingTasks} 待完成, ${completedTasks} 已完成`;
      case '/tasks':
        return `${pendingTasks} 个待办任务`;
      case '/diary':
        return `共 ${diariesCount || 0} 篇日记`;
      case '/habits':
        return `今日习惯: ${completedHabits}/${totalHabits} 已完成`;
      case '/emotion':
        return `共 ${emotionsCount || 0} 条情感记录`;
      case '/therapy':
        return `共 ${therapiesCount || 0} 条练习记录`;
      case '/memories':
        return '记忆库';
      case '/reports':
        return '数据报表';
      case '/settings':
        return '应用设置';
      case '/sync':
        return '数据同步';
      case '/assistant':
        return 'AI 助理';
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
