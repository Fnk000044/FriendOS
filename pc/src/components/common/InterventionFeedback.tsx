import { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { recordFeedback } from '../../services/selfevolution/SelfEvolutionService';
import type { InterventionType } from '../../services/selfevolution/types';

interface InterventionFeedbackProps {
  /** 干预类型（对应 therapyRecords.type / 推荐 refId） */
  interventionType: InterventionType;
  refId?: string;
}

const OPTIONS: Array<{ value: 'helpful' | 'neutral' | 'not_helpful'; labelKey: 'feedback.intervention_helpful' | 'feedback.intervention_neutral' | 'feedback.intervention_not_helpful' }> = [
  { value: 'helpful', labelKey: 'feedback.intervention_helpful' },
  { value: 'neutral', labelKey: 'feedback.intervention_neutral' },
  { value: 'not_helpful', labelKey: 'feedback.intervention_not_helpful' },
];

/**
 * F3 干预有效性：练习结束页「有帮助 / 一般 / 没帮助」一次点选（内联静默）。
 * 显式反馈作为 EMA 的 r 信号并入干预有效率（refId = 干预类型）。
 */
export default function InterventionFeedback({ interventionType, refId }: InterventionFeedbackProps) {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState<null | 'helpful' | 'neutral' | 'not_helpful'>(null);

  const handle = async (value: 'helpful' | 'neutral' | 'not_helpful') => {
    setSubmitted(value);
    try {
      await recordFeedback({
        type: 'recommendation',
        predicted: interventionType,
        feedback: value === 'helpful' ? 'accurate' : 'inaccurate',
        correction: value,
        refId: refId || interventionType,
      });
    } catch {
      /* ignore */
    }
  };

  if (submitted) {
    return <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('feedback.thanks')}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5" role="group" aria-label={t('feedback.correct_title')}>
      <span className="text-xs text-text-muted">{t('feedback.correct_title')}</span>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => handle(o.value)}
          className="btn-press px-2.5 py-1 text-[11px] rounded-full border hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
        >
          {t(o.labelKey)}
        </button>
      ))}
    </span>
  );
}
