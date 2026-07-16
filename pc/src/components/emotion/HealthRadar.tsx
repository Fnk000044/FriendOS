import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Smile, Brain, Zap, Users, Moon, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HealthRadarProps {
  dimensions: {
    mood: number;
    stress: number;
    energy: number;
    social: number;
    sleep: number;
    selfCare: number;
  };
  hasData?: boolean;
}

export default function HealthRadar({ dimensions, hasData = true }: HealthRadarProps) {
  const data = [
    { dimension: '情绪', value: dimensions.mood, fullMark: 100, color: 'var(--color-mood)' },
    { dimension: '活力', value: dimensions.energy, fullMark: 100, color: 'var(--color-energy)' },
    { dimension: '社交', value: dimensions.social, fullMark: 100, color: 'var(--color-social)' },
    { dimension: '自我关怀', value: dimensions.selfCare, fullMark: 100, color: 'var(--color-selfcare)' },
    { dimension: '作息', value: dimensions.sleep, fullMark: 100, color: 'var(--color-sleep)' },
    { dimension: '压力', value: 100 - dimensions.stress, fullMark: 100, color: 'var(--color-stress)' }, // Invert stress
  ];

  const averageScore = Math.round(
    data.reduce((acc, d) => acc + d.value, 0) / data.length
  );

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: '优秀', color: 'var(--color-success)' };
    if (score >= 60) return { label: '良好', color: 'var(--color-info)' };
    if (score >= 40) return { label: '一般', color: 'var(--color-warning)' };
    return { label: '需关注', color: 'var(--color-danger)' };
  };

  const scoreInfo = getScoreLabel(averageScore);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">暂无数据</p>
        <p className="text-xs mt-1">写日记后自动分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-center">
        <div className="inline-flex items-baseline gap-1">
          <span className="text-4xl font-bold" style={{ color: scoreInfo.color }}>{averageScore}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/100</span>
        </div>
        <p className="text-sm font-medium mt-1" style={{ color: scoreInfo.color }}>{scoreInfo.label}</p>
      </div>

      {/* Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="var(--color-grid)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card-solid)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number) => [`${value}`, '']}
            />
            <Radar
              name="心理健康"
              dataKey="value"
              stroke="var(--color-radar-stroke)"
              strokeWidth={2}
              fill="var(--color-radar-fill)"
              fillOpacity={1}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension Details */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'mood', label: '情绪', Icon: Smile, bg: 'var(--color-mood-bg)', color: 'var(--color-mood)' },
          { key: 'stress', label: '压力', Icon: Brain, bg: 'var(--color-stress-bg)', color: 'var(--color-stress)', invert: true },
          { key: 'energy', label: '活力', Icon: Zap, bg: 'var(--color-energy-bg)', color: 'var(--color-energy)' },
          { key: 'social', label: '社交', Icon: Users, bg: 'var(--color-social-bg)', color: 'var(--color-social)' },
          { key: 'sleep', label: '作息', Icon: Moon, bg: 'var(--color-sleep-bg)', color: 'var(--color-sleep)' },
          { key: 'selfCare', label: '自我关怀', Icon: Heart, bg: 'var(--color-selfcare-bg)', color: 'var(--color-selfcare)' },
        ].map(({ key, label, Icon, bg, color, invert }) => {
          const value = dimensions[key as keyof typeof dimensions];
          const displayValue = invert ? 100 - value : value;
          return (
            <div key={key} className="rounded-lg p-3" style={{ backgroundColor: bg }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{displayValue}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-solid)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${displayValue}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
