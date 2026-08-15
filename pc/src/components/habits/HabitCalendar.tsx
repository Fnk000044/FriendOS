import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../../db';
import { getToday, formatLocalDate } from '../../utils/date';

interface HabitCalendarProps {
  /** 习惯 ID，用于查询打卡记录 */
  habitId: string;
  /** 习惯颜色，用于给已打卡日期点着色 */
  color: string;
  /** 点击日期格的回调（用于补卡/取消） */
  onToggleDate?: (date: string) => void;
}

/**
 * 习惯打卡月历视图
 *
 * 自绘 7 列网格（参照 TaskCalendar.tsx），按 habitId 查询该习惯全部打卡记录，
 * 按当前视图月份过滤，已打卡日期用 habit.color 着色。
 * 点击任意非未来日期格可补卡/取消（复用 useHabits.toggleLog）。
 */
export default function HabitCalendar({ habitId, color, onToggleDate }: HabitCalendarProps) {
  const today = getToday();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // 查询该习惯全部打卡记录（habitId 已建索引，高效）
  const allLogs = useLiveQuery(
    () => db.habitLogs.where('habitId').equals(habitId).toArray(),
    [habitId]
  );

  // 已打卡日期集合（yyyy-MM-dd）
  const loggedDates = useMemo(() => {
    const set = new Set<string>();
    for (const log of allLogs || []) set.add(log.date);
    return set;
  }, [allLogs]);

  // 生成日历网格（含前导空格，补齐到完整周）
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
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];
  const monthLabel = `${viewMonth.getFullYear()}年${viewMonth.getMonth() + 1}月`;

  const monthLoggedCount = useMemo(() => {
    const monthStart = formatLocalDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1));
    const monthEnd = formatLocalDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0));
    let count = 0;
    for (const d of loggedDates) {
      if (d >= monthStart && d <= monthEnd) count++;
    }
    return count;
  }, [loggedDates, viewMonth]);

  return (
    <div className="mt-3">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-text-secondary">{monthLabel}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted">
            本月已打卡 {monthLoggedCount} 天
          </span>
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="p-1 rounded hover:bg-surface-hover transition-colors"
              aria-label="上个月"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-text-muted" />
            </button>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="p-1 rounded hover:bg-surface-hover transition-colors"
              aria-label="下个月"
            >
              <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekLabels.map(w => (
          <div key={w} className="text-center text-[10px] font-medium text-text-muted py-0.5">{w}</div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[28px]" />;
          const dayNum = parseInt(date.slice(-2), 10);
          const isToday = date === today;
          const isLogged = loggedDates.has(date);
          const isFuture = date > today;

          return (
            <button
              key={i}
              type="button"
              disabled={isFuture}
              onClick={() => onToggleDate?.(date)}
              className={`min-h-[28px] rounded-md flex items-center justify-center transition-all relative ${
                isFuture
                  ? 'cursor-not-allowed opacity-30'
                  : 'hover:bg-surface-hover cursor-pointer'
              }`}
              aria-label={`${date}${isLogged ? ' 已打卡' : ''}`}
              aria-pressed={isLogged}
            >
              <span
                className={`text-[11px] leading-none ${
                  isLogged ? 'font-semibold' : isToday ? 'font-medium' : ''
                }`}
                style={{
                  color: isLogged ? color : isToday ? 'var(--color-primary)' : 'var(--text-secondary)',
                }}
              >
                {dayNum}
              </span>
              {isLogged && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              {isToday && !isLogged && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
