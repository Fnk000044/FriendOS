import type { TranslationKey } from '../i18n/translations';

/**
 * 方法说明（摘要 + 弹窗全文）——来源：docs/risk_methodology.md
 * 用户决策：默认显示 1-2 行摘要，点击打开弹窗查看完整方法说明（不做折叠）。
 */

export type MethodNoteKind = 'evidence' | 'prediction';

interface MethodNoteContent {
  /** 摘要（1-2 行，直接展示） */
  summaryKey: TranslationKey;
  /** 弹窗全文：段落列表（titleKey + bodyKey 成对） */
  sections: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey }>;
}

export const METHOD_NOTES: Record<MethodNoteKind, MethodNoteContent> = {
  evidence: {
    summaryKey: 'method.evidence_summary',
    sections: [
      { titleKey: 'method.position_title', bodyKey: 'method.position_body' },
      { titleKey: 'method.boundary_title', bodyKey: 'method.boundary_body' },
      { titleKey: 'method.weight_title', bodyKey: 'method.weight_body' },
      { titleKey: 'method.threshold_title', bodyKey: 'method.threshold_body' },
    ],
  },
  prediction: {
    summaryKey: 'method.prediction_summary',
    sections: [
      { titleKey: 'method.position_title', bodyKey: 'method.position_body' },
      { titleKey: 'method.boundary_title', bodyKey: 'method.boundary_body' },
      { titleKey: 'method.trend_title', bodyKey: 'method.trend_body' },
    ],
  },
};
