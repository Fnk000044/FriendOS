/**
 * selfevolution/types.ts — 本地自进化模块的渲染层类型
 *
 * 这些类型是「渲染层 → 主进程」校准参数的契约（结构上与 src/types/electron.d.ts
 * 中的全局接口一致，便于跨源根对齐）。主进程服务保持无状态纯函数，只接收
 * 解密后的纯数值校准参数，不接触 PII 与加密密钥。
 */

/**
 * 情感先验校准（crisis 通道冻结，不在此结构中出现）
 * 主进程 SentimentService 在 softmax 前对 logits 加先验偏移 z' = z + β。
 * crisisFeedback：方案A 个人化误报样本（仅用于无 L1 硬词时的降级，见 crisisDecision.cjs）。
 */
export interface SentimentCalibration {
  priors: { neg: number; neu: number; pos: number };
  temperature?: number;
  sampleCount: number;
  crisisFeedback?: Array<{ text: string; verdict: 'false_alarm' }>;
}

/**
 * 风险个性化（assessment/chat 冻结 λ=1，仅 emotion/behavior/diary 可个性化）
 */
export interface RiskPersonalization {
  weightFactors: { emotion: number; behavior: number; diary: number };
  offset: number;
  sampleCount: number;
}

/**
 * 预测校准（7 日情绪偏差 + Platt 概率重标定）
 */
export interface ForecastCalibration {
  horizonBias: number[]; // 长度 7
  probA: number;
  probB: number;
  sampleCount: number;
}

/**
 * 干预 EMA 校准（带遗忘因子的有效率）
 */
export interface InterventionCalibration {
  emaEffectiveness: { breathing: number; mindfulness: number; thought_record: number };
  effectiveN: { breathing: number; mindfulness: number; thought_record: number };
  sampleCount: number;
}

export type InterventionType = 'breathing' | 'mindfulness' | 'thought_record';

/**
 * 知己度模块所需的聚合快照（渲染层展示用，无 PII）
 */
export interface SelfEvolutionSnapshot {
  hasModel: boolean;
  /** 情绪理解维度：样本数 + 是否已生效 */
  sentiment: { sampleCount: number; calibrated: boolean };
  /** 风险判断维度：样本数 + 是否已生效 */
  risk: { sampleCount: number; calibrated: boolean };
  /** 干预推荐维度：各类型有效样本数 + 是否已生效 */
  intervention: { sampleCount: number; calibrated: boolean; effectiveN: InterventionCalibration['effectiveN'] };
  /** 近 30 天自进化时间线（按时间升序） */
  timeline: Array<{
    id: string;
    type: string;
    labelKey: string;
    createdAt: number;
  }>;
  lastUpdated: number;
}

export type { SelfEvoModel } from '../../db/models';
