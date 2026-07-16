import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export interface RiskRadarDimension {
  /** 维度名称（已 i18n） */
  dimension: string;
  /** 健康指数（0-100，已反转：值越高越健康） */
  value: number;
  fullMark?: number;
}

interface RiskRadarProps {
  data: RiskRadarDimension[];
  hasData?: boolean;
}

const tooltipContentStyle = {
  backgroundColor: 'var(--bg-card-solid, #fff)',
  border: '1px solid var(--glass-border, #E2E8F0)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary, #0F172A)',
};

/**
 * 风险维度雷达图
 *
 * 抽自 RiskDashboardPage 的内联雷达图，复用 HealthRadar 的 CSS 变量主题色，
 * 替代原先硬编码的 #14B8A6。当数据缺失时显示友好的空态提示。
 */
export default function RiskRadar({ data, hasData = true }: RiskRadarProps) {
  if (!hasData || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">暂无数据</p>
        <p className="text-xs mt-1">记录日记/评估后将自动生成</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--color-grid, #E2E8F0)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 12, fill: 'var(--text-muted, #64748B)' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'var(--text-muted, #94A3B8)' }}
          />
          <Tooltip
            contentStyle={tooltipContentStyle}
            formatter={(value: number) => [`${value}`, '健康指数']}
          />
          <Radar
            name="健康指数"
            dataKey="value"
            stroke="var(--color-radar-stroke, #818CF8)"
            strokeWidth={2}
            fill="var(--color-radar-stroke, #818CF8)"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
