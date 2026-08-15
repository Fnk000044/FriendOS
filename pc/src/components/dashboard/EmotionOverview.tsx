/**
 * EmotionOverview - Dashboard card showing emotional health status
 * Displays health index, risk level, and a quick insight.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, TrendingUp, TrendingDown, Minus, Heart } from 'lucide-react';
import { db } from '../../db';
import { getDaysAgo } from '../../utils/date';
import { useLanguage } from '../../i18n/useLanguage';
import AnimatedNumber from '../common/AnimatedNumber';
import { CardSkeleton } from '../common/Skeleton';

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
  medium_low: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
  medium: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
  high: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  critical: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50',
};

// 急停色值：使用 CSS 变量作为情绪概览的主色
const ACCENT_PINK = '#EC4899';
const ACCENT_PINK_LIGHT = 'rgba(236, 72, 153, 0.15)';

export default function EmotionOverview() {
  const { t } = useLanguage();

  // 合并两个查询为单个 useLiveQuery，减少 Dexie 订阅
  const data = useLiveQuery(async () => {
    const [healthProfile, recentEmotions] = await Promise.all([
      db.healthProfiles.orderBy('date').last(),
      db.emotionRecords
        .where('date')
        .aboveOrEqual(getDaysAgo(7))
        .toArray(),
    ]);
    return { healthProfile, recentEmotions };
  }, []);

  const healthProfile = data?.healthProfile;
  const recentEmotions = data?.recentEmotions;

  const profile = healthProfile;
  const isLoading = data === undefined;
  const index = profile?.emotionalHealthIndex ?? null;
  const riskLevel = profile?.riskLevel ?? 'low';
  const insight = profile?.insights?.[0] ?? null;

  const RISK_LABELS: Record<string, string> = {
    low: t('emotion.risk_low'),
    medium_low: t('emotion.risk_medium_low'),
    medium: t('emotion.risk_medium'),
    high: t('emotion.risk_high'),
    critical: t('emotion.risk_critical'),
  };

  const { trendIcon } = useMemo(() => {
    const avg = recentEmotions && recentEmotions.length > 0
      ? recentEmotions.reduce((sum, e) => sum + e.sentimentScore, 0) / recentEmotions.length
      : 0;
    const icon = avg > 0.1
      ? <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
      : avg < -0.1
      ? <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
      : <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />;
    return { trendIcon: icon };
  }, [recentEmotions]);

  return (
    <div className="glass-card-accent p-5" style={{ '--accent-color': '#EC4899' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EC489915, #F472B615)', color: '#EC4899' }}>
            <Heart className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{t('emotion.health_title')}</h3>
        </div>
        {profile && (
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${RISK_COLORS[riskLevel] || 'text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800'}`}>
            {RISK_LABELS[riskLevel] || riskLevel}
          </span>
        )}
      </div>

      {isLoading ? (
        <CardSkeleton lines={4} />
      ) : index !== null ? (
        <>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36" role="img" aria-label={`${t('emotion.health_index')} ${index}`}>
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={index >= 70 ? 'var(--color-success)' : index >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'} />
                    <stop offset="100%" stopColor={index >= 70 ? 'var(--color-success)' : index >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'} stopOpacity={0.7} />
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
                <AnimatedNumber
                  value={index}
                  duration={700}
                  className="text-lg font-bold tabular-nums"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('emotion.health_index')}</span>
                {trendIcon}
              </div>
              {insight && (
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t pt-2.5" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
            <span className="font-medium">{t('emotion.recent_7d_count', { count: recentEmotions?.length ?? 0 })}</span>
            <a href="#/emotion" className="text-primary hover:underline font-medium">{t('emotion.view_detail')}</a>
          </div>
        </>
      ) : (
        <div className="text-center py-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04), rgba(244,114,182,0.02))' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(236,72,153,0.08)' }}>
            <Activity className="w-5 h-5" style={{ color: '#EC4899' }} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{t('emotion.no_data')}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('emotion.no_data_hint')}</p>
        </div>
      )}
    </div>
  );
}
