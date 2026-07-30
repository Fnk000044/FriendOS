import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import AnimatedNumber from '../common/AnimatedNumber';
import type { RiskLevel } from '../../db/models';

// 风险等级配色（与父页 RISK_COLORS 等价，避免 prop drilling 重复传一份对象）
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  medium_low: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  medium: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  high: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
};

interface RiskScoreCardProps {
  riskResult: {
    totalScore: number;
    riskLevel: RiskLevel;
    riskLevelInfo: { min: number; max: number; label: string; color: string };
    summary: string;
  };
}

const LEVEL_ORDER: RiskLevel[] = ['low', 'medium_low', 'medium', 'high', 'critical'];

export default function RiskScoreCard({ riskResult }: RiskScoreCardProps) {
  const { t } = useLanguage();
  const currentLevelIdx = LEVEL_ORDER.indexOf(riskResult.riskLevel);

  return (
    <div
      className={`rounded-2xl p-6 border relative overflow-hidden ${RISK_COLORS[riskResult.riskLevel].border}`}
      style={{
        background: `linear-gradient(135deg, ${RISK_COLORS[riskResult.riskLevel].bg.replace(/bg-/g, '').replace(/-50/g, '/15').replace(/-100/g, '/25')}, transparent)`,
      }}
    >
      {/* 顶部 5 格风险等级条（critical 闪烁 pulseGlow） */}
      <div className="flex gap-1 mb-4" role="img" aria-label={`${t('risk.risk_level')}: ${riskResult.riskLevelInfo.label}`}>
        {LEVEL_ORDER.map((level, i) => {
          const isActive = i <= currentLevelIdx;
          const isCritical = riskResult.riskLevel === 'critical' && level === 'critical';
          return (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                isActive
                  ? level === 'low' ? 'bg-green-500'
                    : level === 'medium_low' ? 'bg-yellow-500'
                    : level === 'medium' ? 'bg-orange-500'
                    : level === 'high' ? 'bg-red-500'
                    : 'bg-red-600'
                  : 'bg-surface-hover'
              } ${isCritical ? 'animate-pulse' : ''}`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{t('risk.composite_index')}</p>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={riskResult.totalScore}
              duration={800}
              className={`text-5xl font-bold ${RISK_COLORS[riskResult.riskLevel].text}`}
            />
            <span className="text-lg text-text-muted">/100</span>
          </div>
          <p className={`text-sm font-medium mt-2 ${RISK_COLORS[riskResult.riskLevel].text}`}>
            {riskResult.riskLevelInfo.label}{t('risk.level_suffix')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-muted mb-2">{t('risk.risk_level')}</p>
          <div className="flex gap-1 justify-end" role="img" aria-label={`${t('risk.risk_level')}: ${riskResult.riskLevelInfo.label}`}>
            {LEVEL_ORDER.map(level => (
              <div
                key={level}
                className={`w-8 h-2 rounded-full ${
                  level === riskResult.riskLevel ? RISK_COLORS[level].bg.replace('50', '400') : 'bg-surface-hover'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-text-secondary mt-4 p-3 bg-white/50 dark:bg-white/5 rounded-lg">
        {riskResult.summary}
      </p>
      {/* 行动指引：高风险时醒目提示热线 */}
      {(riskResult.riskLevel === 'high' || riskResult.riskLevel === 'critical') && (
        <div className="mt-3 p-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/30 flex items-start gap-2 fade-in-up">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-red-700 dark:text-red-300">{t('risk.seek_help_title')}</p>
            <p className="text-red-600 dark:text-red-400 mt-0.5">{t('risk.hotline_label')}：<span className="font-semibold">400-161-9995</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
