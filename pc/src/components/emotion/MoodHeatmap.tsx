import { useState, useEffect, useMemo } from 'react';
import { db } from '../../db';
import { formatLocalDate, getDaysAgo } from '../../utils/date';

/**
 * 情绪热力图（GitHub contribution 风格）
 * - 最近 12 周的日历格
 * - 颜色深浅 = 当天平均心情（1-5 映射 5 级色阶）
 * - 无记录日期为灰色
 * - 点击某天 → tooltip 显示当天心情/日记摘要
 * - 纯 CSS grid 实现
 */

const WEEKS = 12;
const DAYS_PER_WEEK = 7;

// 心情 1-5 → 色阶
const MOOD_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#f59e0b',
  4: '#22c55e',
  5: '#14b8a6',
};
const NO_RECORD_COLOR = 'var(--bg-hover)';

interface DayCell {
  date: string;
  mood: number | null;       // 1-5 平均心情
  diaryTitle?: string;
  emotionScore?: number;
}

const WEEKDAY_LABELS = ['一', '', '三', '', '五', '', '日'];

export default function MoodHeatmap() {
  const [cells, setCells] = useState<DayCell[]>([]);
  const [selected, setSelected] = useState<DayCell | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const since = getDaysAgo(WEEKS * DAYS_PER_WEEK);
        const [diaries, emotions] = await Promise.all([
          db.diaries.where('date').aboveOrEqual(since).toArray(),
          db.emotionRecords.where('date').aboveOrEqual(since).toArray(),
        ]);

        // 按日期聚合：日记 mood + 情感记录 sentimentScore
        const diaryByDate = new Map<string, { mood: number; title?: string }>();
        for (const d of diaries) {
          diaryByDate.set(d.date, { mood: d.mood, title: d.title });
        }
        const emotionByDate = new Map<string, number[]>();
        for (const e of emotions) {
          if (!emotionByDate.has(e.date)) emotionByDate.set(e.date, []);
          emotionByDate.get(e.date)!.push(e.sentimentScore);
        }

        // 生成最近 12 周的格子，从今天往前回溯，按周对齐（周日为一周起点）
        const today = new Date();
        const cells: DayCell[] = [];
        // 找到今天所在周的周日
        const todayDay = today.getDay(); // 0=Sun
        const lastSunday = new Date(today);
        lastSunday.setDate(today.getDate() - todayDay);

        const totalDays = WEEKS * DAYS_PER_WEEK;
        // 从 12 周前的周日开始
        const startSunday = new Date(lastSunday);
        startSunday.setDate(lastSunday.getDate() - (WEEKS - 1) * 7);

        for (let i = 0; i < totalDays; i++) {
          const d = new Date(startSunday);
          d.setDate(startSunday.getDate() + i);
          const dateStr = formatLocalDate(d);
          const diary = diaryByDate.get(dateStr);
          const emoScores = emotionByDate.get(dateStr);

          let mood: number | null = null;
          if (diary) mood = diary.mood;
          else if (emoScores && emoScores.length > 0) {
            // 情感分 -1..1 → 心情 1-5
            const avg = emoScores.reduce((s, v) => s + v, 0) / emoScores.length;
            mood = Math.round(((avg + 1) / 2) * 4 + 1);
          }

          cells.push({
            date: dateStr,
            mood,
            diaryTitle: diary?.title,
            emotionScore: emoScores ? emoScores.reduce((s, v) => s + v, 0) / emoScores.length : undefined,
          });
        }

        setCells(cells);
      } catch (e) {
        console.error('[MoodHeatmap] load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 按周分组（每周 7 天）
  const weeks = useMemo(() => {
    const result: DayCell[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      result.push(cells.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK));
    }
    return result;
  }, [cells]);

  // 月份标签
  const monthLabels = useMemo(() => {
    if (weeks.length === 0) return [];
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      if (week.length === 0) return;
      const firstDay = new Date(week[0].date);
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        labels.push({ weekIndex: i, label: `${m + 1}月` });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="h-4 w-32 rounded bg-[var(--bg-hover)] animate-pulse mb-4" />
        <div className="h-32 rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>
    );
  }

  const recordedCount = cells.filter(c => c.mood !== null).length;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">情绪热力图</h3>
        <span className="text-xs text-text-muted">最近 {WEEKS} 周 · {recordedCount} 天有记录</span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-full">
          {/* 月份标签 */}
          <div className="flex gap-1 pl-6 h-4">
            {weeks.map((_, i) => {
              const ml = monthLabels.find(m => m.weekIndex === i);
              return (
                <div key={i} className="w-3 text-[9px] text-text-muted">
                  {ml?.label || ''}
                </div>
              );
            })}
          </div>

          {/* 热力图主体 */}
          <div className="flex gap-1">
            {/* 星期标签 */}
            <div className="flex flex-col gap-1 w-5">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="h-3 text-[9px] text-text-muted flex items-center">
                  {label}
                </div>
              ))}
            </div>

            {/* 周列 */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((cell, di) => {
                  const isToday = cell.date === formatLocalDate(new Date());
                  const isFuture = new Date(cell.date) > new Date();
                  const color = cell.mood !== null ? MOOD_COLORS[cell.mood] : (isFuture ? 'transparent' : NO_RECORD_COLOR);
                  return (
                    <button
                      key={di}
                      onClick={() => cell.mood !== null && setSelected(cell)}
                      className="w-3 h-3 rounded-sm transition-transform hover:scale-125"
                      style={{
                        background: color,
                        outline: isToday ? '1.5px solid var(--color-primary)' : undefined,
                        cursor: cell.mood !== null ? 'pointer' : 'default',
                      }}
                      title={cell.date}
                      aria-label={`${cell.date} 心情 ${cell.mood ?? '无记录'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 色阶图例 */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-text-muted">
        <span>低</span>
        {[1, 2, 3, 4, 5].map(m => (
          <span key={m} className="w-3 h-3 rounded-sm" style={{ background: MOOD_COLORS[m] }} />
        ))}
        <span>高</span>
        <span className="ml-2 flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ background: NO_RECORD_COLOR }} />
          无记录
        </span>
      </div>

      {/* 选中日期详情 */}
      {selected && (
        <div className="mt-3 p-2.5 rounded-lg flex items-center gap-2 text-xs" style={{ background: 'var(--bg-hover)' }}>
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: MOOD_COLORS[selected.mood!] }} />
          <span className="font-medium text-text-primary">{selected.date}</span>
          <span className="text-text-muted">
            心情 {selected.mood}/5{selected.diaryTitle ? ` · ${selected.diaryTitle}` : ''}
            {selected.emotionScore !== undefined ? ` · 情感分 ${selected.emotionScore.toFixed(2)}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
