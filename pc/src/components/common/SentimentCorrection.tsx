import { useEffect, useState } from 'react';
import { PencilLine } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import { shouldReduceMotion } from '../../utils/reduceMotion';
import { recordFeedback } from '../../services/selfevolution/SelfEvolutionService';

type SentimentClass = 'negative' | 'neutral' | 'positive' | 'crisis';

const OPTIONS: Array<{ value: SentimentClass; labelKey: 'feedback.correct_negative' | 'feedback.correct_neutral' | 'feedback.correct_positive' | 'feedback.correct_crisis'; color: string }> = [
  { value: 'negative', labelKey: 'feedback.correct_negative', color: '#EF4444' },
  { value: 'neutral', labelKey: 'feedback.correct_neutral', color: '#94A3B8' },
  { value: 'positive', labelKey: 'feedback.correct_positive', color: '#22C55E' },
  { value: 'crisis', labelKey: 'feedback.correct_crisis', color: '#DC2626' },
];

interface SentimentCorrectionProps {
  /** 主导 4 分类预测标签（来自 SentimentResult.predictedClass） */
  predictedClass?: SentimentClass;
  /** 是否为危机场景（危机/高风险时禁用纠错，铁律） */
  crisis?: boolean;
  /** 关联记录 ID（如 diary id / emotionRecord id） */
  refId?: string;
  /** 样本不足标注（样本数 < 阈值时提示） */
  insufficient?: boolean;
}

/**
 * F1 情感纠错：情感徽标旁「不对？」→ 4 选 1 情绪快选（内联静默，一次点击完成）。
 * - 危机场景禁用纠错入口
 * - 一次点击即提交，之后显示「谢谢反馈」
 */
export default function SentimentCorrection({
  predictedClass = 'neutral',
  crisis = false,
  refId,
  insufficient = false,
}: SentimentCorrectionProps) {
  const { t } = useLanguage();
  const reduce = shouldReduceMotion();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 危机场景直接禁用，不允许展开
  useEffect(() => {
    if (crisis) setOpen(false);
  }, [crisis]);

  if (crisis) {
    return (
      <span className="text-[10px] text-text-muted" title={t('feedback.disabled_crisis')}>
        {t('feedback.disabled_crisis')}
      </span>
    );
  }

  const handleSelect = async (value: SentimentClass) => {
    setSubmitted(true);
    setOpen(false);
    try {
      await recordFeedback({
        type: 'sentiment',
        predicted: predictedClass,
        feedback: 'inaccurate',
        correctedLabel: value,
        refId,
        text: undefined,
      });
    } catch {
      /* 写入失败不打断交互 */
    }
  };

  if (submitted) {
    return (
      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('feedback.thanks')}</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn-press inline-flex items-center gap-0.5 text-[10px] text-text-muted hover:text-primary transition-colors cursor-pointer"
      >
        <PencilLine className="w-3 h-3" aria-hidden="true" />
        {t('feedback.correct_title')}
      </button>

      {open && (
        <span
          className="inline-flex items-center gap-1 p-1 rounded-full"
          style={{ background: 'var(--bg-hover)' }}
          role="group"
          aria-label={t('feedback.correct_title')}
        >
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => handleSelect(o.value)}
              className="btn-press px-2 py-0.5 text-[10px] rounded-full border transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--glass-border)',
                color: o.color,
              }}
              onMouseEnter={(e) => {
                if (reduce) return;
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-solid)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {t(o.labelKey)}
            </button>
          ))}
        </span>
      )}

      {insufficient && (
        <span className="text-[10px] text-text-muted opacity-70">{t('selfevo.sample_insufficient')}</span>
      )}
    </span>
  );
}
