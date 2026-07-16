import { useMemo, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { EmotionRecord } from '../../db/models';
import { formatLocalDate } from '../../utils/date';

interface EmotionTrendProps {
  records: EmotionRecord[];
  days?: number;
}

export default function EmotionTrend({ records = [], days = 7 }: EmotionTrendProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    // Group by date and calculate average sentiment
    const dateMap = new Map<string, { scores: number[]; emotions: Record<string, number[]> }>();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (!records || records.length === 0) return [];

    for (const record of records) {
      if (record.date < formatLocalDate(startDate)) continue;

      if (!dateMap.has(record.date)) {
        dateMap.set(record.date, { scores: [], emotions: {} });
      }

      const entry = dateMap.get(record.date)!;
      entry.scores.push(record.sentimentScore);

      // Aggregate emotions
      for (const [key, value] of Object.entries(record.emotions)) {
        if (!entry.emotions[key]) entry.emotions[key] = [];
        entry.emotions[key].push(value);
      }
    }

    // Convert to chart data
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      const shortDate = dateStr.slice(5); // MM-DD

      const entry = dateMap.get(dateStr);

      if (entry && entry.scores.length > 0) {
        const avgScore = entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length;

        // Calculate average emotions
        const avgEmotions: Record<string, number> = {};
        for (const [key, values] of Object.entries(entry.emotions)) {
          avgEmotions[key] = values.reduce((a, b) => a + b, 0) / values.length;
        }

        data.push({
          date: shortDate,
          fullDate: dateStr,
          score: Math.round(avgScore * 100) / 100,
          normalized: Math.round(((avgScore + 1) / 2) * 100), // Convert -1~1 to 0~100
          joy: Math.round((avgEmotions.joy || 0) * 100),
          sadness: Math.round((avgEmotions.sadness || 0) * 100),
          anger: Math.round((avgEmotions.anger || 0) * 100),
          fear: Math.round((avgEmotions.fear || 0) * 100),
          count: entry.scores.length,
        });
      } else {
        // 无数据日显示为空隙，而非0%
        data.push({
          date: shortDate,
          fullDate: dateStr,
          score: null,
          normalized: null,
          joy: null,
          sadness: null,
          anger: null,
          fear: null,
          count: 0,
        });
      }
    }

    return data;
  }, [records, days]);

  // 键盘导航处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!chartData || chartData.length === 0) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIdx(prev =>
          prev === null ? 0 : Math.min(prev + 1, chartData.length - 1)
        );
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIdx(prev =>
          prev === null ? chartData.length - 1 : Math.max(prev - 1, 0)
        );
        break;
      case 'Home':
        e.preventDefault();
        setSelectedIdx(0);
        break;
      case 'End':
        e.preventDefault();
        setSelectedIdx(chartData.length - 1);
        break;
      case 'Escape':
        setSelectedIdx(null);
        break;
    }
  }, [chartData]);

  const averageScore = useMemo(() => {
    const validData = chartData.filter(d => d.score !== null);
    if (validData.length === 0) return 0;
    return Math.round(validData.reduce((acc, d) => acc + d.normalized!, 0) / validData.length);
  }, [chartData]);

  const trend = useMemo(() => {
    const validData = chartData.filter(d => d.score !== null);
    if (validData.length < 2) return 'stable';

    const recent = validData.slice(-3);
    const earlier = validData.slice(0, 3);

    const recentAvg = recent.reduce((acc, d) => acc + d.normalized!, 0) / recent.length;
    const earlierAvg = earlier.reduce((acc, d) => acc + d.normalized!, 0) / earlier.length;

    if (recentAvg > earlierAvg + 5) return 'up';
    if (recentAvg < earlierAvg - 5) return 'down';
    return 'stable';
  }, [chartData]);

  const trendConfig = {
    up: { label: '上升趋势', color: 'text-green-600', icon: '↑' },
    down: { label: '下降趋势', color: 'text-red-600', icon: '↓' },
    stable: { label: '稳定', color: 'text-blue-600', icon: '→' },
  };

  const trendInfo = trendConfig[trend];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">近{days}天情绪指数</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{averageScore}</span>
            <span className="text-sm text-slate-400 dark:text-slate-500">/100</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
          trend === 'up' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
          trend === 'down' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
          'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }`}>
          <span>{trendInfo.icon}</span>
          <span>{trendInfo.label}</span>
        </div>
      </div>

      {/* Chart with keyboard navigation */}
      <div
        className="h-48 outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
        tabIndex={0}
        role="img"
        aria-label={`情绪趋势图表，近${days}天数据。使用方向键导航数据点。`}
        onKeyDown={handleKeyDown}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}`, '情绪指数']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="normalized"
              stroke="#818CF8"
              strokeWidth={2}
              fill="url(#colorScore)"
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Emotion Breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: 'joy', label: '喜悦', color: 'bg-yellow-100 text-yellow-700', icon: '😊' },
          { key: 'sadness', label: '悲伤', color: 'bg-blue-100 text-blue-700', icon: '😢' },
          { key: 'anger', label: '愤怒', color: 'bg-red-100 text-red-700', icon: '😠' },
          { key: 'fear', label: '恐惧', color: 'bg-purple-100 text-purple-700', icon: '😰' },
        ].map(({ key, label, color, icon }) => {
          // 只计算有数据的天
          const validDays = chartData.filter(d => d[key as keyof typeof d] !== null && d.count > 0);
          const avg = validDays.length > 0
            ? validDays.reduce((acc, d) => acc + (d[key as keyof typeof d] as number || 0), 0) / validDays.length
            : 0;
          return (
            <div key={key} className={`rounded-lg p-2 text-center ${color}`}>
              <span className="text-lg">{icon}</span>
              <p className="text-xs font-medium mt-1">{label}</p>
              <p className="text-sm font-bold">{validDays.length > 0 ? Math.round(avg) : '--'}%</p>
            </div>
          );
        })}
      </div>

      {/* Data Summary */}
      <div className="text-xs text-slate-400 text-center">
        共 {chartData.filter(d => d.count > 0).length} 天有数据，
        平均每天 {Math.round(chartData.reduce((acc, d) => acc + d.count, 0) / chartData.length)} 条记录
      </div>

      {/* Selected point announcement for screen readers */}
      {selectedIdx !== null && chartData[selectedIdx] && (
        <div
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {chartData[selectedIdx].date}:
          {chartData[selectedIdx].normalized !== null
            ? `情绪指数 ${chartData[selectedIdx].normalized}%`
            : '无数据'
          }
        </div>
      )}

      {/* Screen reader accessible data table */}
      <table className="sr-only" aria-label="情绪趋势数据表">
        <thead>
          <tr>
            <th>日期</th>
            <th>情绪指数</th>
            <th>记录数</th>
          </tr>
        </thead>
        <tbody>
          {chartData.filter(d => d.count > 0).map((d, i) => (
            <tr key={i}>
              <td>{d.date}</td>
              <td>{d.normalized}%</td>
              <td>{d.count}条</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
