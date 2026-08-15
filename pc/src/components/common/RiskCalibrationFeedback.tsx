import { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { recordFeedback } from '../../services/selfevolution/SelfEvolutionService';

interface RiskCalibrationFeedbackProps {
  /** 当前风险等级（predicted 标签） */
  riskLevel: string;
  /** 关联记录 ID（如时间戳） */
  refId?: string;
}

/**
 * F2 风险校准：风险等级旁「偏高 / 正好 / 偏低」轻量按钮（内联静默）。
 * - 「正好」仅记录确认，不调整参数
 * - 「偏高」→ direction=overestimate（下调 δ/λ）；「偏低」→ underestimate
 * - 一次点击完成，危机场景由父级隐藏（critical 不显示）
 */
export default function RiskCalibrationFeedback({ riskLevel, refId }: RiskCalibrationFeedbackProps) {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState<null | 'overestimate' | 'underestimate' | 'just'>(null);

  const handle = async (kind: 'overestimate' | 'underestimate' | 'just') => {
    setSubmitted(kind);
    try {
      if (kind === 'just') {
        await recordFeedback({
          type: 'risk_level',
          predicted: riskLevel,
          feedback: 'accurate',
          refId,
        });
      } else {
        await recordFeedback({
          type: 'risk_level',
          predicted: riskLevel,
          feedback: 'inaccurate',
          direction: kind,
          refId,
        });
      }
    } catch {
      /* ignore */
    }
  };

  if (submitted) {
    return <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('feedback.thanks')}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1" role="group" aria-label={t('feedback.correct_title')}>
      <button
        type="button"
        onClick={() => handle('overestimate')}
        className="btn-press px-2 py-0.5 text-[10px] rounded-full border text-amber-600 dark:text-amber-400 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        {t('feedback.risk_over')}
      </button>
      <button
        type="button"
        onClick={() => handle('just')}
        className="btn-press px-2 py-0.5 text-[10px] rounded-full border text-emerald-600 dark:text-emerald-400 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        {t('feedback.risk_just')}
      </button>
      <button
        type="button"
        onClick={() => handle('underestimate')}
        className="btn-press px-2 py-0.5 text-[10px] rounded-full border text-sky-600 dark:text-sky-400 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        {t('feedback.risk_under')}
      </button>
    </span>
  );
}
