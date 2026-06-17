/**
 * EmotionOverview - Dashboard card showing emotional health status
 * Displays health index, risk level, and a quick insight.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Heart } from 'lucide-react';
import { db } from '../../db';
import { getDaysAgo } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-600 bg-green-50',
  medium_low: 'text-yellow-600 bg-yellow-50',
  medium: 'text-orange-600 bg-orange-50',
  high: 'text-red-600 bg-red-50',
  critical: 'text-red-700 bg-red-100',
};

const RISK_LABELS: Record<string, string> = {
  low: '良好',
  medium_low: '偏低',
  medium: '中等',
  high: '偏高',
  critical: '危险',
};

export default function EmotionOverview() {
  const { t } = useLanguage();

  const healthProfile = useLiveQuery(
    () => db.healthProfiles.orderBy('date').last(),
    []
  );

  const recentEmotions = useLiveQuery(async () => {
    return db.emotionRecords
      .where('date')
      .aboveOrEqual(getDaysAgo(7))
      .toArray();
  }, []);

  const profile = healthProfile;
  const index = profile?.emotionalHealthIndex ?? null;
  const riskLevel = profile?.riskLevel ?? 'low';
  const insight = profile?.insights?.[0] ?? null;

  const { avgSentiment, trendIcon } = useMemo(() => {
    const avg = recentEmotions && recentEmotions.length > 0
      ? recentEmotions.reduce((sum, e) => sum + e.sentimentScore, 0) / recentEmotions.length
      : 0;
    const icon = avg > 0.1
      ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
      : avg < -0.1
      ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
      : <Minus className="w-3.5 h-3.5 text-slate-400" />;
    return { avgSentiment: avg, trendIcon: icon };
  }, [recentEmotions]);

  return (
    <div className="glass-card-accent p-5" style={{ '--accent-color': '#EC4899' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EC489915, #F472B615)', color: '#EC4899' }}>
            <Heart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">情绪健康</h3>
        </div>
        {profile && (
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${RISK_COLORS[riskLevel] || 'text-slate-500 bg-slate-50'}`}>
            {RISK_LABELS[riskLevel] || riskLevel}
          </span>
        )}
      </div>

      {index !== null ? (
        <>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={index >= 70 ? '#22c55e' : index >= 40 ? '#f59e0b' : '#ef4444'} />
                    <stop offset="100%" stopColor={index >= 70 ? '#16a34a' : index >= 40 ? '#d97706' : '#dc2626'} />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bg-hover)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="url(#healthGrad)"
                  strokeWidth="3"
                  strokeDasharray={`${(index / 100) * 94.25} 94.25`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{index}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>情绪指数</span>
                {trendIcon}
              </div>
              {insight && (
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t pt-2.5" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
            <span className="font-medium">近7天分析 {recentEmotions?.length ?? 0} 条</span>
            <a href="#/emotion" className="text-primary hover:underline font-medium">查看详情 →</a>
          </div>
        </>
      ) : (
        <div className="text-center py-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04), rgba(244,114,182,0.02))' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(236,72,153,0.08)' }}>
            <Activity className="w-5 h-5" style={{ color: '#EC4899' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>暂无数据</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>写日记后自动分析</p>
        </div>
      )}
    </div>
  );
}
