/**
<<<<<<< HEAD
 * FeedbackService（旧入口，向后兼容 re-export）
 *
 * 统一反馈入口已迁移至 services/feedback/FeedbackService.ts（唯一写入点，
 * 写前加密 text/correction 并触发自进化重算）。本文件保留 saveFeedback /
 * getFeedbackStats 两个历史调用方（FeedbackButtons 等）的兼容签名。
 */

import { db } from '../db';
import { logFeedback } from './feedback/FeedbackService';
import type { FeedbackType } from '../db/models';

/**
 * 保存用户反馈（兼容旧签名）。
 * @deprecated 新代码请使用 services/feedback/FeedbackService.logFeedback 或
 *             services/selfevolution/SelfEvolutionService.recordFeedback。
 */
export async function saveFeedback(
  type: FeedbackType,
=======
 * Feedback Service
 * 收集用户对 AI 分析结果的反馈，用于后续优化
 */

import { db } from '../db';

/**
 * 保存用户反馈
 */
export async function saveFeedback(
  type: 'sentiment' | 'ai_response' | 'recommendation',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  text: string,
  predicted: string,
  feedback: 'accurate' | 'inaccurate',
  targetId?: string
): Promise<void> {
<<<<<<< HEAD
  await logFeedback({
    type,
    predicted,
    text: text ? text.slice(0, 500) : undefined,
    accurate: feedback,
    targetId,
  });
}

/**
 * 获取反馈统计（兼容旧签名）。
=======
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
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
 */
export async function getFeedbackStats(): Promise<{
  total: number;
  accurate: number;
  inaccurate: number;
  accuracyRate: number;
}> {
  try {
    const all = await db.feedbackLogs.toArray();
<<<<<<< HEAD
    const accurate = all.filter((f) => f.feedback === 'accurate').length;
    const inaccurate = all.filter((f) => f.feedback === 'inaccurate').length;
    const total = all.length;
    const accuracyRate = total > 0 ? Math.round((accurate / total) * 100) : 0;
=======
    const accurate = all.filter(f => f.feedback === 'accurate').length;
    const inaccurate = all.filter(f => f.feedback === 'inaccurate').length;
    const total = all.length;
    const accuracyRate = total > 0 ? Math.round((accurate / total) * 100) : 0;

>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    return { total, accurate, inaccurate, accuracyRate };
  } catch (err) {
    console.error('[FeedbackService] Failed to get stats:', err);
    return { total: 0, accurate: 0, inaccurate: 0, accuracyRate: 0 };
  }
}
