import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLanguage } from '../../i18n/useLanguage';

interface RiskTrendChartProps {
  data: { date: string; score: number; color?: string }[];
}

// tooltip 内容样式：使用 CSS 变量以适配深色模式
const tooltipContentStyle = {
  backgroundColor: 'var(--bg-card-solid, #fff)',
  border: '1px solid var(--glass-border, #E2E8F0)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary, #0F172A)',
};

export default function RiskTrendChart({ data }: RiskTrendChartProps) {
  const { t } = useLanguage();

  return (
    <div className="glass-card rounded-2xl p-6" role="figure" aria-label={t('risk.dashboard_title')}>
      <h3 className="text-lg font-semibold text-text-primary mb-4">{t('risk.trend_title')}</h3>
      {data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, #E2E8F0)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'var(--text-muted, #94A3B8)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                formatter={(value: number) => {
                  const level = value < 30 ? t('risk.level_low') : value < 60 ? t('risk.level_medium') : t('risk.level_high');
                  return [`${value} (${level})`, t('risk.risk_index')];
                }}
              />
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="score"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#riskGradient)"
                dot={{ r: 3, fill: '#fff', stroke: '#EF4444', strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-text-muted">
          <p>{t('risk.no_trend_data')}</p>
        </div>
      )}
    </div>
  );
}
