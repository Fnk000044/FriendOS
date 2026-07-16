/**
 * EarlyWarningService 反馈接线
 *
 * EarlyWarningCard 下方"准不准"按钮的回调函数，将预测结果写入 FeedbackLog 表，
 * 用于后续离线评估准确率与模型迭代。
 *
 * 调用方：EarlyWarningCard / RiskDashboardPage 中的反馈按钮
 */

import { db } from '../../db';

export type FeedbackType = 'sentiment' | 'ai_response' | 'recommendation' | 'early_warning';
export type FeedbackAccuracy = 'accurate' | 'inaccurate';

export interface FeedbackPayload {
  type: FeedbackType;
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
      feedback: payload.feedback || '',
      accurate: payload.accurate,
      refId: payload.refId || '',
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[FeedbackService] logFeedback failed:', err);
  }
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
    const accurate = all.filter(f => f.accurate === 'accurate').length;
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
