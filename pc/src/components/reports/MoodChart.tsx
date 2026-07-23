import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useLanguage } from '../../i18n/useLanguage';

interface MoodChartProps {
  data: { date: string; mood: number | null }[];
}

// 折线图 + 散点比面积图更直白反映每日心情变化趋势（1-5 分）
const MoodChart = React.memo(function MoodChart({ data }: MoodChartProps) {
  const { t } = useLanguage();
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    mood: d.mood,
  }));

  const hasData = chartData.some((d) => d.mood !== null);

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t('report.mood_chart')}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200} debounce={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="#94A3B8" />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
            />
            {/* 中位线（3 分 = 中性）作为参考 */}
            <ReferenceLine y={3} stroke="#E2E8F0" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="mood"
              name={t('report.mood_chart')}
              stroke="#F59E0B"
              strokeWidth={2}
              // 每个数据点画散点（更清楚看到每日实际值）
              dot={{ fill: '#F59E0B', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
          暂无心情数据
        </div>
      )}
    </div>
  );
});

export default MoodChart;
