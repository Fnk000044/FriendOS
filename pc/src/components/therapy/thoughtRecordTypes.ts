import type { TranslationKey } from '../../i18n/translations';

/**
 * CBT 思维记录的数据结构与常量定义
 *
 * 从 ThoughtRecord.tsx 抽出，便于多个步骤子组件共享类型与选项表，
 * 同时让 ThoughtRecord 主组件更聚焦于流程编排。
 */

export interface ThoughtRecordData {
  situation: string;
  automaticThought: string;
  emotions: string[];
  emotionIntensity: number;
  evidenceFor: string;
  evidenceAgainst: string;
  alternativeThought: string;
  newEmotionIntensity: number;
  alternativeBelief: number; // 替代思维信念度（0-100%）
  behaviorExperiment: string; // 行为实验计划
  followUpEmotion: number; // 后续情绪评分
}

export const INITIAL_THOUGHT_RECORD_DATA: ThoughtRecordData = {
  situation: '',
  automaticThought: '',
  emotions: [],
  emotionIntensity: 50,
  evidenceFor: '',
  evidenceAgainst: '',
  alternativeThought: '',
  newEmotionIntensity: 30,
  alternativeBelief: 50,
  behaviorExperiment: '',
  followUpEmotion: 30,
};

// CBT思维记录完整流程（7步）
export const STEPS: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { titleKey: 'therapy.tr_step0_title', descKey: 'therapy.tr_step0_desc' },
  { titleKey: 'therapy.tr_step1_title', descKey: 'therapy.tr_step1_desc' },
  { titleKey: 'therapy.tr_step2_title', descKey: 'therapy.tr_step2_desc' },
  { titleKey: 'therapy.tr_step3_title', descKey: 'therapy.tr_step3_desc' },
  { titleKey: 'therapy.tr_step4_title', descKey: 'therapy.tr_step4_desc' },
  { titleKey: 'therapy.tr_step5_title', descKey: 'therapy.tr_step5_desc' },
  { titleKey: 'therapy.tr_step6_title', descKey: 'therapy.tr_step6_desc' },
];

// CBT认知扭曲列表（15种，参考 Burns, 1980, Feeling Good）
export const DISTORTIONS: TranslationKey[] = [
  'therapy.tr_dist_catastrophizing',
  'therapy.tr_dist_all_or_nothing',
  'therapy.tr_dist_overgeneralization',
  'therapy.tr_dist_mind_reading',
  'therapy.tr_dist_should',
  'therapy.tr_dist_emotional_reasoning',
  'therapy.tr_dist_selective_abstraction',
  'therapy.tr_dist_labeling',
  'therapy.tr_dist_disqualifying_positive',
  'therapy.tr_dist_magnification',
  'therapy.tr_dist_personalization',
  'therapy.tr_dist_blaming',
  'therapy.tr_dist_unfair_comparison',
  'therapy.tr_dist_regret',
  'therapy.tr_dist_pessimistic_prediction',
];

/**
 * 校验某步骤是否满足"下一步"前置条件
 */
export function canProceedStep(step: number, data: ThoughtRecordData): boolean {
  switch (step) {
    case 0: return data.situation.trim().length > 0;
    case 1: return data.automaticThought.trim().length > 0;
    case 2: return data.emotions.length > 0;
    case 3: return data.evidenceFor.trim().length > 0 || data.evidenceAgainst.trim().length > 0;
    case 4: return data.alternativeThought.trim().length > 0;
    case 5: return true; // 信念度总是有值
    case 6: return true; // 行为实验可选
    default: return false;
  }
}
