import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useLanguage } from '../../i18n/useLanguage';

interface HabitChartProps {
  data: { date: string; habitsRate: number }[];
}

const HabitChart = React.memo(function HabitChart({ data }: HabitChartProps) {
  const { t } = useLanguage();
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    rate: Math.round(d.habitsRate),
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t('report.habit_chart')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94A3B8" unit="%" />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="rate" name={t('report.habit_chart')} fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default HabitChart;
