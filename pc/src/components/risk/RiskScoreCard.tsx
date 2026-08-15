import { useCallback, useState } from 'react';
import { AlertTriangle, ListTree, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import AnimatedNumber from '../common/AnimatedNumber';
import RiskCalibrationFeedback from '../common/RiskCalibrationFeedback';
import type { RiskLevel } from '../../db/models';
import EvidenceChainView from './EvidenceChainView';
import { buildEvidenceChain, type HasDataMap, type RiskResultLike } from '../../utils/evidenceChain';

// 风险等级配色（与父页 RISK_COLORS 等价，避免 prop drilling 重复传一份对象）
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  medium_low: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  medium: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  high: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
};

interface RiskScoreCardProps {
  riskResult: RiskResultLike & {
    riskLevel: RiskLevel;
    riskLevelInfo: { min: number; max: number; label: string; color: string };
    summary: string;
    timestamp?: number;
    calibration?: {
      applied?: boolean;
      sampleCount?: number;
      note?: string;
    };
  };
  /** 各信号源是否有数据（决定证据链 no_data 判定；缺省按有数据） */
  hasData?: HasDataMap;
}

const LEVEL_ORDER: RiskLevel[] = ['low', 'medium_low', 'medium', 'high', 'critical'];

export default function RiskScoreCard({ riskResult, hasData }: RiskScoreCardProps) {
  const { t } = useLanguage();
  const [chainOpen, setChainOpen] = useState(false);
  const [chain, setChain] = useState<EvidenceChain | null>(null);
  const currentLevelIdx = LEVEL_ORDER.indexOf(riskResult.riskLevel);

  const handleOpenChain = useCallback(() => {
    setChain(
      buildEvidenceChain(
        {
          totalScore: riskResult.totalScore,
          riskLevel: riskResult.riskLevel,
          breakdown: riskResult.breakdown ?? {},
          factors: riskResult.factors ?? [],
          diagnostics: riskResult.diagnostics,
        },
        hasData ?? { emotion: true, behavior: true, assessment: true, chat: true, diary: true }
      )
    );
    setChainOpen(true);
  }, [riskResult, hasData]);

  const hasBreakdown = !!riskResult.breakdown;

  return (
    <div
      className={`rounded-2xl p-6 border relative overflow-hidden ${RISK_COLORS[riskResult.riskLevel].border}`}
      style={{
        // 不透明背景：保证指数在任何图表/底纹上清晰可读（用户反馈）
        background: 'var(--bg-card-solid)',
        boxShadow: `inset 0 4px 0 0 ${riskResult.riskLevelInfo.color}`,
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
      <p className="text-sm text-text-secondary mt-4 p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
        {riskResult.summary}
      </p>

      {/* F2 风险校准：危机场景禁用反馈入口 */}
      {riskResult.riskLevel !== 'critical' && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <RiskCalibrationFeedback riskLevel={riskResult.riskLevel} refId={String(riskResult.timestamp ?? Date.now())} />
          {riskResult.calibration?.note && (
            <span className="text-[10px] text-text-muted truncate max-w-[60%]">{riskResult.calibration.note}</span>
          )}
        </div>
      )}
      {/* 行动指引：高风险时醒目提示热线 + 安全计划入口（SPI 闭环） */}
      {(riskResult.riskLevel === 'high' || riskResult.riskLevel === 'critical') && (
        <div className="mt-3 p-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/30 flex items-start gap-2 fade-in-up">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm min-w-0">
            <p className="font-medium text-red-700 dark:text-red-300">{t('risk.seek_help_title')}</p>
            <p className="text-red-600 dark:text-red-400 mt-0.5">{t('risk.hotline_label')}：<span className="font-semibold">400-161-9995</span> / 12356</p>
            <button
              type="button"
              onClick={() => { window.location.hash = '/safety-plan'; }}
              className="mt-2 inline-flex items-center gap-1.5 text-red-700 dark:text-red-300 font-medium hover:underline cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              {t('safety_plan.open_from_crisis')} ↗
            </button>
          </div>
        </div>
      )}

      {/* 证据链入口：分数可解释，不是黑盒 */}
      {hasBreakdown && (
        <button
          type="button"
          onClick={handleOpenChain}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg border cursor-pointer transition-colors hover:border-primary/30 hover:bg-primary/5"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
        >
          <ListTree className="w-4 h-4" aria-hidden="true" />
          {t('evidence.view')}
        </button>
      )}

      {chainOpen && <EvidenceChainView open chain={chain} onClose={() => setChainOpen(false)} />}
    </div>
  );
}
