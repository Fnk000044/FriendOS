import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../../db';
import { getToday, formatLocalDate } from '../../utils/date';
import type { Task } from '../../db/models';

interface TaskCalendarProps {
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
}

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  urgent: '#DC2626',
  high: '#D97706',
  medium: '#2563EB',
  low: '#94A3B8',
};

/**
 * 轻量自绘月历视图
 * 按 scheduledDate 聚合任务，日期格内显示任务点（按优先级着色），点击日期筛选当日任务
 */
export default function TaskCalendar({ onSelectDate, selectedDate }: TaskCalendarProps) {
  const today = getToday();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [internalSelected, setInternalSelected] = useState<string>(today);

  const sel = selectedDate ?? internalSelected;

  // 查询当月任务
  const monthStart = formatLocalDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1));
  const monthEnd = formatLocalDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0));

  const monthTasks = useLiveQuery(async () => {
    return db.tasks.where('scheduledDate').between(monthStart, monthEnd, true, true).toArray();
  }, [monthStart, monthEnd]);

  // 当月有情绪记录的日期（角标蓝点）
  const emotionDates = useLiveQuery(async () => {
    const recs = await db.emotionRecords.where('date').between(monthStart, monthEnd, true, true).toArray();
    return new Set(recs.map((r) => r.date));
  }, [monthStart, monthEnd]);

  // 按日期分组
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of monthTasks || []) {
      if (!map[t.scheduledDate]) map[t.scheduledDate] = [];
      map[t.scheduledDate].push(t);
    }
    return map;
  }, [monthTasks]);

  /** 日期角标颜色：绿=全部完成 / 橙=有逾期未完成 / 灰=有任务未完成 / 蓝=仅情绪记录 */
  function badgeColor(date: string): string | null {
    const dayTasks = tasksByDate[date] || [];
    if (dayTasks.length === 0) {
      return emotionDates?.has(date) ? '#3B82F6' : null;
    }
    const pending = dayTasks.filter((t) => t.status === 'pending');
    if (pending.length === 0) return '#22C55E';
    const overdue = pending.some((t) => t.scheduledDate < today);
    return overdue ? '#F59E0B' : '#9CA3AF';
  }

  function badgeTooltip(date: string): string {
    const dayTasks = tasksByDate[date] || [];
    if (dayTasks.length === 0) {
      return emotionDates?.has(date) ? '有情绪记录' : '';
    }
    const done = dayTasks.filter((t) => t.status === 'completed').length;
    return `${dayTasks.length} 个任务 · ${done} 个已完成`;
  }

  // 生成日历网格（含前导空格）
  const days = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=周日
    const totalDays = lastDay.getDate();

    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      cells.push(formatLocalDate(date));
    }
    // 补齐到 6 行（42 格）
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];
  const monthLabel = `${viewMonth.getFullYear()}年${viewMonth.getMonth() + 1}月`;

  const handleSelect = (date: string) => {
    setInternalSelected(date);
    onSelectDate?.(date);
  };

  return (
    <div className="glass-card rounded-2xl p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="上个月"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="下个月"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekLabels.map(w => (
          <div key={w} className="text-center text-[11px] font-medium text-text-muted py-1">{w}</div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[48px]" />;
          const dayNum = parseInt(date.slice(-2), 10);
          const isToday = date === today;
          const isSelected = date === sel;
          const dayTasks = tasksByDate[date] || [];
          const pendingCount = dayTasks.filter(t => t.status === 'pending').length;
          const badge = badgeColor(date);
          const tip = badgeTooltip(date);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(date)}
              title={tip || undefined}
              className={`min-h-[48px] rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                isSelected
                  ? 'bg-primary text-white'
                  : isToday
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-surface-hover text-text-secondary'
              }`}
            >
              <span className={`text-[13px] leading-none ${isSelected ? 'font-semibold' : ''}`}>{dayNum}</span>
              {/* 右上角 8×8 圆角方框角标：绿=全完成 / 橙=有逾期 / 灰=有未完成 / 蓝=情绪记录 */}
              {badge && (
                <span
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-[3px]"
                  style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.95)' : badge }}
                  aria-hidden="true"
                />
              )}
              {pendingCount > 0 && !isSelected && !badge && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* 选中日期的任务列表 */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-sm font-medium text-text-primary mb-2">
          {sel} 的任务（{(tasksByDate[sel] || []).length}）
        </p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {(tasksByDate[sel] || []).length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">当日无任务</p>
          ) : (
            (tasksByDate[sel] || []).map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-hover/50">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[t.priority] }} />
                <span className={`text-sm flex-1 truncate ${t.status === 'completed' ? 'line-through text-text-muted' : 'text-text-secondary'}`}>
                  {t.title}
                </span>
                {t.dueTime && <span className="text-xs text-text-muted">{t.dueTime}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
