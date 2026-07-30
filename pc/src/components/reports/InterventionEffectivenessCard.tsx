import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  generateEffectivenessReport,
  getInterventionLabel,
  type EffectivenessReport,
} from '../../services/therapy/EffectivenessService';
import { useLanguage } from '../../i18n/useLanguage';

/**
 * 干预效果统计卡片（Reports 页面用）
 * 展示各干预类型的平均提升分、有效率、个人最有效干预、近期 vs 历史趋势
 */
export default function InterventionEffectivenessCard() {
  const { t } = useLanguage();
  const [report, setReport] = useState<EffectivenessReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateEffectivenessReport()
      .then(setReport)
      .catch((e) => console.error('[InterventionEffectivenessCard] load error:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
        <div className="h-4 w-32 rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>
    );
  }

  if (!report || report.totalSessions === 0) {
    return (
      <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
        <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" aria-hidden="true" />
          干预效果
        </h3>
        <p className="text-xs text-text-muted">还没有干预记录。完成呼吸练习、CBT 思维记录或正念冥想后，这里会显示效果统计。</p>
      </div>
    );
  }

  const trendLabel = report.trend === 'improving' ? '↑ 近期效果在提升' : report.trend === 'declining' ? '↓ 近期效果有所下降' : '— 效果保持稳定';
  const trendColor = report.trend === 'improving' ? '#10b981' : report.trend === 'declining' ? '#ef4444' : 'var(--text-muted)';

  return (
    <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" aria-hidden="true" />
        干预效果
        <span className="text-xs font-normal text-text-muted ml-auto">共 {report.totalSessions} 次</span>
      </h3>

      {/* 个人最有效干预 */}
      {report.topIntervention && (
        <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            你最有效的干预
          </p>
          <p className="text-sm font-medium text-text-primary mt-0.5">
            {getInterventionLabel(report.topIntervention.type)}
            <span className="text-xs text-text-muted ml-2">有效率 {Math.round(report.topIntervention.effectivenessRate * 100)}%</span>
          </p>
        </div>
      )}

      {/* 各类型柱状图（纯 div 实现，不引依赖） */}
      <div className="space-y-2 mb-3">
        {report.byType.map((stat) => {
          const maxImp = Math.max(...report.byType.map(s => Math.abs(s.avgImprovement)), 1);
          const widthPct = Math.abs(stat.avgImprovement) / maxImp * 100;
          const positive = stat.avgImprovement >= 0;
          return (
            <div key={stat.type}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-text-secondary">{getInterventionLabel(stat.type)}</span>
                <span className="text-text-muted">
                  {stat.count} 次 · 有效率 {Math.round(stat.effectivenessRate * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${widthPct}%`,
                      background: positive ? 'var(--color-primary)' : '#f59e0b',
                    }}
                  />
                </div>
                <span className="text-xs font-medium w-12 text-right" style={{ color: positive ? 'var(--color-primary)' : '#f59e0b' }}>
                  {positive ? '+' : ''}{stat.avgImprovement.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 近 7 天 vs 历史趋势 */}
      {report.recent7d.count > 0 && (
        <div className="flex items-center gap-2 text-xs pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: trendColor }} aria-hidden="true" />
          <span style={{ color: trendColor }}>{trendLabel}</span>
          <span className="text-text-muted ml-auto">
            近7天 {report.recent7d.count} 次 · 均提升 {report.recent7d.avgImprovement.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
