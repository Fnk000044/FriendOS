import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';

interface HabitChartProps {
  data: { date: string; habitsRate: number }[];
}

const HabitChart = React.memo(function HabitChart({ data }: HabitChartProps) {
  const { t } = useLanguage();

  if (data.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">{t('report.habit_chart')}</h3>
        <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
          {t('report.no_data')}
        </div>
      </div>
    );
  }

  const latestRate = Math.round(data[data.length - 1].habitsRate);
  const avgRate = Math.round(data.reduce((sum, d) => sum + d.habitsRate, 0) / data.length);
  const trend = data.length >= 2
    ? Math.round(data[data.length - 1].habitsRate - data[data.length - 2].habitsRate)
    : 0;

  const radius = 60;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (latestRate / 100) * circumference;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t('report.habit_chart')}</h3>
      <div className="h-[200px] flex items-center justify-center gap-8">
        <div className="relative">
          <svg width={140} height={140} viewBox="0 0 140 140">
            <circle
              cx={70} cy={70} r={radius}
              fill="none"
              stroke="var(--glass-border)"
              strokeWidth={stroke}
            />
            <circle
              cx={70} cy={70} r={radius}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text-primary">{latestRate}%</span>
            <span className="text-xs text-text-muted">{t('report.today')}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-muted">{t('report.avg_rate')}</p>
            <p className="text-lg font-semibold text-text-primary">{avgRate}%</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">{t('report.trend')}</p>
            <p className={`text-lg font-semibold ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-text-muted'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HabitChart;
