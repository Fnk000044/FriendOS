import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useLanguage } from '../../i18n/useLanguage';

interface TaskChartProps {
  data: { date: string; tasksCompleted: number; tasksTotal: number }[];
}

const TaskChart = React.memo(function TaskChart({ data }: TaskChartProps) {
  const { t } = useLanguage();
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    completed: d.tasksCompleted,
    total: d.tasksTotal,
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t('report.task_chart')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="total" name={t('report.total')} fill="#E2E8F0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name={t('report.completed')} fill="#14B8A6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default TaskChart;
