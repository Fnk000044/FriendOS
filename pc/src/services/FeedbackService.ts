/**
 * Feedback Service
 * 收集用户对 AI 分析结果的反馈，用于后续优化
 */

import { db } from '../db';

/**
 * 保存用户反馈
 */
export async function saveFeedback(
  type: 'sentiment' | 'ai_response' | 'recommendation',
  text: string,
  predicted: string,
  feedback: 'accurate' | 'inaccurate',
  targetId?: string
): Promise<void> {
  try {
    await db.feedbackLogs.add({
      id: crypto.randomUUID(),
      type,
      targetId,
      text: text.slice(0, 500),
      predicted,
      feedback,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[FeedbackService] Failed to save feedback:', err);
  }
}

/**
 * 获取反馈统计
 */
export async function getFeedbackStats(): Promise<{
  total: number;
  accurate: number;
  inaccurate: number;
  accuracyRate: number;
}> {
  try {
    const all = await db.feedbackLogs.toArray();
    const accurate = all.filter(f => f.feedback === 'accurate').length;
    const inaccurate = all.filter(f => f.feedback === 'inaccurate').length;
    const total = all.length;
    const accuracyRate = total > 0 ? Math.round((accurate / total) * 100) : 0;

    return { total, accurate, inaccurate, accuracyRate };
  } catch (err) {
    console.error('[FeedbackService] Failed to get stats:', err);
    return { total: 0, accurate: 0, inaccurate: 0, accuracyRate: 0 };
  }
}
