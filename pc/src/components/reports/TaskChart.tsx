import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useLanguage } from '../../i18n/useLanguage';

interface TaskChartProps {
  data: { date: string; tasksCompleted: number; tasksTotal: number }[];
}

// 柱状图比面积图更直白反映每日任务完成 vs 总数对比
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
      <ResponsiveContainer width="100%" height={200} debounce={200}>
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
            cursor={{ fill: 'rgba(20, 184, 166, 0.08)' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* 总数：浅色背景柱 */}
          <Bar dataKey="total" name={t('report.total')} fill="#CBD5E1" radius={[4, 4, 0, 0]} />
          {/* 完成：实色柱叠在背景柱上 */}
          <Bar dataKey="completed" name={t('report.completed')} fill="#14B8A6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default TaskChart;
