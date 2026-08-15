/**
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
  text: string,
  predicted: string,
  feedback: 'accurate' | 'inaccurate',
  targetId?: string
): Promise<void> {
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
 */
export async function getFeedbackStats(): Promise<{
  total: number;
  accurate: number;
  inaccurate: number;
  accuracyRate: number;
}> {
  try {
    const all = await db.feedbackLogs.toArray();
    const accurate = all.filter((f) => f.feedback === 'accurate').length;
    const inaccurate = all.filter((f) => f.feedback === 'inaccurate').length;
    const total = all.length;
    const accuracyRate = total > 0 ? Math.round((accurate / total) * 100) : 0;
    return { total, accurate, inaccurate, accuracyRate };
  } catch (err) {
    console.error('[FeedbackService] Failed to get stats:', err);
    return { total: 0, accurate: 0, inaccurate: 0, accuracyRate: 0 };
  }
}
