import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
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
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="taskTotalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="taskCompletedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="total" name={t('report.total')} stroke="#CBD5E1" fill="url(#taskTotalGrad)" strokeWidth={1.5} />
          <Area type="monotone" dataKey="completed" name={t('report.completed')} stroke="#14B8A6" fill="url(#taskCompletedGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default TaskChart;
