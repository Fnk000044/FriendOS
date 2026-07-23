import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis, Label,
} from 'recharts';
import type { DayChartData } from '../../utils/reports';

interface CorrelationChartProps {
  data: DayChartData[];
  /** 相关系数 (-1..1)，null 表示样本不足 */
  correlation: number | null;
}

/**
 * 多维度相关性散点图：心情 (X) vs 任务完成率 (Y)
 *
 * 每个点代表一天，颜色用习惯完成率（第三维度）着色。
 * 用于直观发现"心情好→任务完成高""习惯坚持→情绪稳定"等模式。
 */
const CorrelationChart = React.memo(function CorrelationChart({ data, correlation }: CorrelationChartProps) {
  const points = useMemo(() => {
    return data
      .filter((d) => d.mood !== null && d.tasksTotal > 0)
      .map((d) => ({
        mood: d.mood!,
        taskRate: Math.round((d.tasksCompleted / d.tasksTotal) * 100),
        habitRate: Math.round(d.habitsRate * 100),
        date: d.date.slice(5),
      }));
  }, [data]);

  const corrLabel = useMemo(() => {
    if (correlation === null) return '样本不足';
    const sign = correlation >= 0 ? '+' : '';
    const strength =
      Math.abs(correlation) >= 0.7 ? '强' :
      Math.abs(correlation) >= 0.4 ? '中等' :
      Math.abs(correlation) >= 0.2 ? '弱' : '极弱';
    const direction = correlation >= 0 ? '正相关' : '负相关';
    return `${sign}${correlation.toFixed(2)} (${strength}${direction})`;
  }, [correlation]);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">心情 × 任务完成率</h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--bg-hover)',
            color: correlation !== null && correlation >= 0
              ? 'var(--color-success, #22C55E)'
              : 'var(--color-info, #3B82F6)',
          }}
        >
          {corrLabel}
        </span>
      </div>
      {points.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
          需同时记录日记心情与任务的天数 ≥ 1
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, #F1F5F9)" />
            <XAxis
              type="number"
              dataKey="mood"
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }}
            >
              <Label value="心情 (1-5)" position="bottom" offset={5} style={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }} />
            </XAxis>
            <YAxis
              type="number"
              dataKey="taskRate"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }}
            />
            <ZAxis type="number" dataKey="habitRate" range={[40, 200]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--glass-border, #E2E8F0)',
                background: 'var(--bg-card-solid, #fff)',
                fontSize: '12px',
                color: 'var(--text-primary, #0F172A)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'mood') return [value, '心情'];
                if (name === 'taskRate') return [`${value}%`, '任务完成率'];
                if (name === 'habitRate') return [`${value}%`, '习惯完成率'];
                return [value, name];
              }}
              labelFormatter={() => ''}
            />
            <Scatter
              data={points}
              fill="var(--color-primary, #14B8A6)"
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

export default CorrelationChart;
