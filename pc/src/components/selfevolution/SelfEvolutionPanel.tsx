import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Heart, ShieldCheck, Lightbulb, History } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { shouldReduceMotion } from '../../utils/reduceMotion';
import AnimatedNumber from '../common/AnimatedNumber';
import {
  getSelfEvolutionSnapshot,
  SENTIMENT_MIN_SAMPLES,
  RISK_MIN_SAMPLES,
  INTERVENTION_MIN_SAMPLES,
} from '../../services/selfevolution/SelfEvolutionService';
import type { SelfEvolutionSnapshot } from '../../services/selfevolution/types';

/**
 * 知己度模块 —— 0-100 默契指数进度环 + 分维度拆解 + 近 30 天自进化时间线。
 * 让用户明确感知「反馈是有效的」，形成正向飞轮（见评审结论 §3.3）。
 */
export default function SelfEvolutionPanel() {
  const { t } = useLanguage();
  const reduce = shouldReduceMotion();
  const [snapshot, setSnapshot] = useState<SelfEvolutionSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSelfEvolutionSnapshot()
      .then((s) => { if (!cancelled) setSnapshot(s); })
      .catch(() => { /* 读取失败保持空态 */ });
    return () => { cancelled = true; };
  }, []);

  const score = useMemo(() => {
    if (!snapshot) return 0;
    const s = snapshot.sentiment.calibrated
      ? 100
      : Math.min(100, Math.round((snapshot.sentiment.sampleCount / SENTIMENT_MIN_SAMPLES) * 100));
    const r = snapshot.risk.calibrated
      ? 100
      : Math.min(100, Math.round((snapshot.risk.sampleCount / RISK_MIN_SAMPLES) * 100));
    const iTotal = snapshot.intervention.effectiveN.breathing
      + snapshot.intervention.effectiveN.mindfulness
      + snapshot.intervention.effectiveN.thought_record;
    const i = snapshot.intervention.calibrated
      ? 100
      : Math.min(100, Math.round((iTotal / INTERVENTION_MIN_SAMPLES) * 100));
    return Math.round((s + r + i) / 3);
  }, [snapshot]);

  const dimensions = useMemo(() => {
    if (!snapshot) return [];
    return [
      {
        icon: Heart,
        label: t('selfevo.dim_sentiment'),
        calibrated: snapshot.sentiment.calibrated,
        sampleCount: snapshot.sentiment.sampleCount,
        threshold: SENTIMENT_MIN_SAMPLES,
      },
      {
        icon: ShieldCheck,
        label: t('selfevo.dim_risk'),
        calibrated: snapshot.risk.calibrated,
        sampleCount: snapshot.risk.sampleCount,
        threshold: RISK_MIN_SAMPLES,
      },
      {
        icon: Lightbulb,
        label: t('selfevo.dim_intervention'),
        calibrated: snapshot.intervention.calibrated,
        sampleCount: snapshot.intervention.sampleCount,
        threshold: INTERVENTION_MIN_SAMPLES,
      },
    ];
  }, [snapshot, t]);

  const timelineLabels: Record<string, string> = {
    sentiment: t('selfevo.timeline_sentiment'),
    risk_level: t('selfevo.timeline_risk'),
    recommendation: t('selfevo.timeline_intervention'),
    forecast: t('selfevo.timeline_forecast'),
    behavior: t('selfevo.timeline_behavior'),
    early_warning: t('selfevo.timeline_early_warning'),
  };

  const R = 52;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="glass-card glass-glow rounded-2xl p-6 module-fade-in" role="region" aria-label={t('selfevo.title')}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{t('selfevo.title')}</h3>
            <p className="text-xs text-text-muted mt-0.5">{t('selfevo.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* 0-100 进度环 */}
        <div className="relative shrink-0" role="img" aria-label={`${t('selfevo.score')}: ${score}`}>
          <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
            <circle cx="66" cy="66" r={R} fill="none" stroke="var(--bg-hover)" strokeWidth="10" />
            <circle
              cx="66" cy="66" r={R}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * CIRC} ${CIRC}`}
              style={{ transition: reduce ? 'none' : 'stroke-dasharray 0.6s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber value={score} duration={600} className="text-3xl font-bold text-text-primary tabular-nums" />
            <span className="text-[10px] text-text-muted">{t('selfevo.score')}</span>
          </div>
        </div>

        {/* 分维度拆解 */}
        <div className="flex-1 w-full space-y-2.5">
          {dimensions.map((d) => {
            const Icon = d.icon;
            const pct = Math.min(100, Math.round((d.sampleCount / d.threshold) * 100));
            return (
              <div key={d.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    {d.label}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {d.calibrated
                      ? t('selfevo.calibrated', { count: d.sampleCount })
                      : t('selfevo.sample_insufficient')}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.calibrated ? 100 : pct}%`,
                      background: 'var(--gradient-primary)',
                      transition: reduce ? 'none' : 'width 0.5s ease-out',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 近 30 天自进化时间线 */}
      <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <h4 className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-2">
          <History className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
          {t('selfevo.timeline')}
        </h4>
        {!snapshot || snapshot.timeline.length === 0 ? (
          <p className="text-xs text-text-muted">{t('selfevo.timeline_empty')}</p>
        ) : (
          <ul className="timeline-stagger space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {snapshot.timeline.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-[11px] text-text-secondary">
                <span className="truncate">{timelineLabels[item.type] || item.type}</span>
                <span className="text-text-muted shrink-0 ml-2">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 置信度来源 + 免责 */}
      <div className="mt-3 text-[10px] text-text-muted leading-relaxed">
        <p className="font-medium text-text-secondary">{t('selfevo.confidence_source')}：{t('selfevo.confidence_source_desc')}</p>
        <p className="mt-0.5">{t('selfevo.disclaimer')}</p>
      </div>
    </div>
  );
}
