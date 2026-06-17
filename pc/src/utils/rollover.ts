import { db } from '../db';
import { getToday, getDaysAgo, getDaysLater } from './date';

const ROLLOVER_LIMITS: Record<Task['priority'], number> = {
  urgent: 1,
  high: 1,
  medium: 3,
  low: -1, // -1 means no limit
};

interface Task {
  id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  scheduledDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  isRollover: boolean;
  originalDate?: string;
  rolloverCount: number;
}

export async function runRollover(): Promise<number> {
  const lastVisit = localStorage.getItem('lifeos_last_visit');
  const today = getToday();

  if (lastVisit === today) return 0;

  let rolledCount = 0;

  if (lastVisit && lastVisit < today) {
    try {
      const pendingTasks = await db.tasks
        .where('status')
        .equals('pending')
        .and((t: Task) => t.scheduledDate < today && t.scheduledDate >= lastVisit)
        .toArray();

      for (const task of pendingTasks) {
        const limit = ROLLOVER_LIMITS[task.priority];
        const canRollover = limit === -1 || task.rolloverCount < limit;

        if (canRollover) {
          await db.tasks.update(task.id, {
            scheduledDate: today,
            isRollover: true,
            originalDate: task.originalDate || task.scheduledDate,
            rolloverCount: (task.rolloverCount || 0) + 1,
          });
          rolledCount++;
        }
      }
      // 只有在所有任务都成功回滚后才更新 lastVisit
      localStorage.setItem('lifeos_last_visit', today);
    } catch (err) {
      console.error('Rollover failed:', err);
      // 不更新 lastVisit，下次启动时会重试
    }
  } else {
    localStorage.setItem('lifeos_last_visit', today);
  }
  return rolledCount;
}

export function formatTaskDate(dateStr: string): string {
  const today = getToday();
  const yesterday = getDaysAgo(1);
  const tomorrow = getDaysLater(1);

  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  if (dateStr === tomorrow) return '明天';

  // 解析为本地时间，避免 UTC 偏移导致日期错误
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${m}月${d}日`;
}
