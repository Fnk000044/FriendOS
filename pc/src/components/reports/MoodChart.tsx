import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useLanguage } from '../../i18n/useLanguage';

interface MoodChartProps {
  data: { date: string; mood: number | null }[];
}

const MoodChart = React.memo(function MoodChart({ data }: MoodChartProps) {
  const { t } = useLanguage();
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    mood: d.mood,
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t('report.mood_chart')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
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
          <Line
            type="monotone"
            dataKey="mood"
            name={t('report.mood_chart')}
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: '#F59E0B', r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default MoodChart;
