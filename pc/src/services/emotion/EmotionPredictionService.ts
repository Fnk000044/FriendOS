/**
 * Emotion Trend Analysis Service
 * 基于情绪记录的时间序列数据，检测情绪趋势方向
 * 使用移动平均 + 周期性分析
 */

import { db } from '../../db';
import { getDaysAgo } from '../../utils/date';

export interface TrendResult {
  direction: 'improving' | 'stable' | 'declining';
  recentAvg: number;
  trendAvg: number;
  changePercent: number;
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

  const recent7 = dailyAvg.slice(-7);
  const recentAvg = recent7.reduce((s, d) => s + d.avg, 0) / recent7.length;

  const prev7 = dailyAvg.slice(-14, -7);
  const prevAvg = prev7.length > 0
    ? prev7.reduce((s, d) => s + d.avg, 0) / prev7.length
    : recentAvg;

  const changePercent = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

  let direction: 'improving' | 'stable' | 'declining' = 'stable';
  if (changePercent > 5) direction = 'improving';
  else if (changePercent < -5) direction = 'declining';

  return {
    direction,
    recentAvg: Math.round(recentAvg * 10) / 10,
    trendAvg: Math.round(prevAvg * 10) / 10,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}
