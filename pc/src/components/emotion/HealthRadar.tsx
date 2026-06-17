import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

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
    { dimension: '情绪', value: dimensions.mood, fullMark: 100 },
    { dimension: '活力', value: dimensions.energy, fullMark: 100 },
    { dimension: '社交', value: dimensions.social, fullMark: 100 },
    { dimension: '自我关怀', value: dimensions.selfCare, fullMark: 100 },
    { dimension: '作息', value: dimensions.sleep, fullMark: 100 },
    { dimension: '压力', value: 100 - dimensions.stress, fullMark: 100 }, // Invert stress (lower is better)
  ];

  const averageScore = Math.round(
    data.reduce((acc, d) => acc + d.value, 0) / data.length
  );

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: '优秀', color: 'text-green-600' };
    if (score >= 60) return { label: '良好', color: 'text-blue-600' };
    if (score >= 40) return { label: '一般', color: 'text-yellow-600' };
    return { label: '需关注', color: 'text-red-600' };
  };

  const scoreInfo = getScoreLabel(averageScore);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
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
          <span className={`text-4xl font-bold ${scoreInfo.color}`}>{averageScore}</span>
          <span className="text-sm text-slate-400">/100</span>
        </div>
        <p className={`text-sm font-medium mt-1 ${scoreInfo.color}`}>{scoreInfo.label}</p>
      </div>

      {/* Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}`, '']}
            />
            <Radar
              name="心理健康"
              dataKey="value"
              stroke="#818CF8"
              strokeWidth={2}
              fill="#818CF8"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension Details */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'mood', label: '情绪', icon: '😊', color: 'bg-yellow-50' },
          { key: 'stress', label: '压力', icon: '😤', color: 'bg-red-50', invert: true },
          { key: 'energy', label: '活力', icon: '⚡', color: 'bg-green-50' },
          { key: 'social', label: '社交', icon: '👥', color: 'bg-blue-50' },
          { key: 'sleep', label: '作息', icon: '😴', color: 'bg-purple-50' },
          { key: 'selfCare', label: '自我关怀', icon: '💆', color: 'bg-pink-50' },
        ].map(({ key, label, icon, color, invert }) => {
          const value = dimensions[key as keyof typeof dimensions];
          const displayValue = invert ? 100 - value : value;
          return (
            <div key={key} className={`rounded-lg p-3 ${color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="text-xs font-medium text-slate-600">{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-800">{displayValue}</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-solid)' }}>
                <div
                  className={`h-full rounded-full transition-all ${
                    displayValue >= 80 ? 'bg-green-500' :
                    displayValue >= 60 ? 'bg-blue-500' :
                    displayValue >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${displayValue}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
