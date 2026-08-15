/**
 * Emotion Trend Analysis Service
 * 基于情绪记录的时间序列数据，检测情绪趋势方向
 * 使用移动平均 + 短期斜率 + 波动率分析
 * 参考 Predicting_College_Mental_Health_ML_2025.pdf 的特征工程思路
 */

import { db } from '../../db';
import { getDaysAgo } from '../../utils/date';

export interface TrendResult {
  direction: 'improving' | 'stable' | 'declining';
  recentAvg: number;
  trendAvg: number;
  changePercent: number;
  /** 置信度 0-1，基于样本量和一致性 */
  confidence: number;
}

/**
 * 分析情绪趋势方向
 * @param days 分析天数（默认 7）
 */
export async function analyzeEmotionTrend(days: number = 7): Promise<TrendResult | null> {
  const thirtyDaysAgo = getDaysAgo(30);
  const records = await db.emotionRecords
    .where('date')
    .aboveOrEqual(thirtyDaysAgo)
    .toArray();

  if (records.length < 7) return null;

  const dailyMood = new Map<string, number[]>();
  for (const r of records) {
    if (!dailyMood.has(r.date)) dailyMood.set(r.date, []);
    const moodScore = ((r.sentimentScore + 1) / 2) * 4 + 1;
    dailyMood.get(r.date)!.push(moodScore);
  }

  const dailyAvg: { date: string; avg: number }[] = [];
  for (const [date, scores] of dailyMood) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    dailyAvg.push({ date, avg });
  }
  dailyAvg.sort((a, b) => a.date.localeCompare(b.date));

  if (dailyAvg.length < 7) return null;

  // 改用 7 日移动平均，比前后半段均值更平滑、对噪声更鲁棒
  const windowSize = Math.min(7, Math.floor(dailyAvg.length / 2));
  const movingAvg: number[] = [];
  for (let i = 0; i < dailyAvg.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = dailyAvg.slice(start, i + 1);
    movingAvg.push(slice.reduce((s, d) => s + d.avg, 0) / slice.length);
  }

  // 最近一个窗口的均值 vs 前一个窗口的均值
  const recentAvg = movingAvg[movingAvg.length - 1];
  const compareIdx = Math.max(0, movingAvg.length - windowSize - 1);
  const prevAvg = movingAvg[compareIdx];

  const changePercent = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

  // 斜率检测：最近窗口的线性回归斜率（基于移动平均序列）
  const recentSeries = movingAvg.slice(-Math.min(windowSize, movingAvg.length));
  let slope = 0;
  if (recentSeries.length >= 2) {
    const n = recentSeries.length;
    const meanX = (n - 1) / 2;
    const meanY = recentSeries.reduce((s, v) => s + v, 0) / n;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - meanX) * (recentSeries[i] - meanY);
      denominator += (i - meanX) * (i - meanX);
    }
    slope = denominator > 0 ? numerator / denominator : 0;
  }

  // 波动率：移动平均序列的标准差（比原始序列更稳定）
  const globalMean = movingAvg.reduce((s, v) => s + v, 0) / movingAvg.length;
  const variance = movingAvg.reduce((s, v) => s + (v - globalMean) ** 2, 0) / movingAvg.length;
  const volatility = Math.sqrt(variance);

  let direction: 'improving' | 'stable' | 'declining' = 'stable';
  if (changePercent > 5 || (changePercent > 2 && slope > 0.1)) direction = 'improving';
  else if (changePercent < -5 || (changePercent < -2 && slope < -0.1)) direction = 'declining';

  // 置信度：基于样本量、一致性和波动率
  // 改进：对长周期数据更敏感（不再 14 天即满分封顶）
  let confidence = Math.min(1, Math.log2(dailyAvg.length + 1) / Math.log2(30)) * 0.7;
  confidence += (1 - Math.min(volatility / 2, 1)) * 0.3;   // 低波动率 = 高置信度
  confidence = Math.round(Math.min(1, confidence) * 100) / 100;

  return {
    direction,
    recentAvg: Math.round(recentAvg * 10) / 10,
    trendAvg: Math.round(prevAvg * 10) / 10,
    changePercent: Math.round(changePercent * 10) / 10,
    confidence,
  };
}
