/**
<<<<<<< HEAD
 * FeedbackService — 统一反馈入口（唯一写入点）
 *
 * 历史上存在两个职责重叠的 FeedbackService（services/FeedbackService.ts 与
 * services/feedback/FeedbackService.ts），导致双写 / 漏加密风险。
 * 现合并为唯一入口：
 * - 所有反馈写入统一走 SelfEvolutionService.recordFeedback()，
 *   由其在写 feedbackLogs 前对 text/correction 做 encryptField，并触发参数重算。
 * - 旧 services/FeedbackService.ts 仅保留向后兼容的 re-export。
 */

import { db } from '../../db';
import type { FeedbackType } from '../../db/models';
import { recordFeedback } from '../selfevolution/SelfEvolutionService';

export type { FeedbackType };
=======
 * EarlyWarningService 反馈接线
 *
 * EarlyWarningCard 下方"准不准"按钮的回调函数，将预测结果写入 FeedbackLog 表，
 * 用于后续离线评估准确率与模型迭代。
 *
 * 调用方：EarlyWarningCard / RiskDashboardPage 中的反馈按钮
 */

import { db } from '../../db';

export type FeedbackType = 'sentiment' | 'ai_response' | 'recommendation' | 'early_warning';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
export type FeedbackAccuracy = 'accurate' | 'inaccurate';

export interface FeedbackPayload {
  type: FeedbackType;
<<<<<<< HEAD
  /** 预测内容摘要 / 原预测标签 */
  predicted?: string;
  /** 兼容旧字段：用户实际感受/纠正（自由文本，加密到 text） */
  feedback?: string;
  /** 用户自由文本（加密） */
  text?: string;
  accurate: FeedbackAccuracy;
  /** 关联记录 ID（如 emotionRecord id / riskScore timestamp） */
  refId?: string;
  targetId?: string;
  /** 用户纠正内容（加密） */
  correction?: string;
  /** 纠正后的枚举标签（sentiment 4 分类） */
  correctedLabel?: string;
  direction?: 'overestimate' | 'underestimate';
  scope?: 'emotion' | 'behavior' | 'diary' | 'assessment' | 'chat';
  forecastValue?: number;
  actualValue?: number;
  horizon?: number;
}

/**
 * 记录一条反馈（唯一写入点）。
 * text/correction 写前 encryptField；写入后触发 SelfEvolutionService 重算。
 */
export async function logFeedback(payload: FeedbackPayload): Promise<void> {
  await recordFeedback({
    type: payload.type,
    predicted: payload.predicted || '',
    feedback: payload.accurate,
    text: payload.text ?? payload.feedback,
    refId: payload.refId,
    targetId: payload.targetId,
    correction: payload.correction,
    correctedLabel: payload.correctedLabel,
    direction: payload.direction,
    scope: payload.scope,
    forecastValue: payload.forecastValue,
    actualValue: payload.actualValue,
    horizon: payload.horizon,
  });
=======
  // 预测内容摘要
  predicted?: string;
  // 用户实际感受/纠正
  feedback?: string;
  accurate: FeedbackAccuracy;
  // 关联记录 ID（如 emotionRecord id / riskScore timestamp）
  refId?: string;
}

/**
 * 记录一条反馈到 FeedbackLog 表
 */
export async function logFeedback(payload: FeedbackPayload): Promise<void> {
  try {
    await db.feedbackLogs.add({
      id: crypto.randomUUID(),
      type: payload.type,
      predicted: payload.predicted || '',
      feedback: payload.accurate,
      accurate: payload.accurate,
      refId: payload.refId || '',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[FeedbackService] logFeedback failed:', err);
  }
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}

/**
 * 统计某类预测的准确率（用于离线评估报告）
 */
export async function getAccuracyStats(type: FeedbackType): Promise<{
  total: number;
  accurate: number;
  inaccurate: number;
  accuracy: number;
}> {
  try {
    const all = await db.feedbackLogs.where('type').equals(type).toArray();
<<<<<<< HEAD
    const accurate = all.filter((f) => f.feedback === 'accurate').length;
=======
    const accurate = all.filter(f => f.feedback === 'accurate').length;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    const inaccurate = all.length - accurate;
    return {
      total: all.length,
      accurate,
      inaccurate,
      accuracy: all.length > 0 ? accurate / all.length : 0,
    };
  } catch {
    return { total: 0, accurate: 0, inaccurate: 0, accuracy: 0 };
  }
}
