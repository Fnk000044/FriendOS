/**
 * Emotion Trajectory Prediction Service
 * 基于情绪记录的时间序列数据，预测未来情绪走势
 * 使用移动平均 + 周期性分析，不需要复杂 ML
 */

import { db } from '../../db';
import { getToday, getDaysAgo } from '../../utils/date';

export interface PredictionPoint {
  date: string;
  predicted: number;  // 1-5
  confidence: number; // 0-1
}

/**
 * 预测未来 N 天的情绪走势
 * @param days 预测天数（默认 7）
 * @returns 预测数据点数组
 */
export async function predictEmotionTrend(days: number = 7): Promise<PredictionPoint[]> {
  // 获取最近 30 天的情绪记录
  const thirtyDaysAgo = getDaysAgo(30);
  const records = await db.emotionRecords
    .where('date')
    .aboveOrEqual(thirtyDaysAgo)
    .toArray();

  if (records.length < 7) return []; // 数据不足

  // 按日期聚合每日情绪
  const dailyMood = new Map<string, number[]>();
  for (const r of records) {
    if (!dailyMood.has(r.date)) dailyMood.set(r.date, []);
    // 将 sentimentScore (-1~1) 映射到 mood (1-5)
    const moodScore = ((r.sentimentScore + 1) / 2) * 4 + 1;
    dailyMood.get(r.date)!.push(moodScore);
  }

  // 计算每日平均情绪
  const dailyAvg: { date: string; avg: number; dow: number }[] = [];
  for (const [date, scores] of dailyMood) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const dow = new Date(date).getDay(); // 0=周日
    dailyAvg.push({ date, avg, dow });
  }
  dailyAvg.sort((a, b) => a.date.localeCompare(b.date));

  if (dailyAvg.length < 7) return [];

  // 计算周期性模式（周末 vs 工作日）
  const weekdayAvg = dailyAvg.filter(d => d.dow >= 1 && d.dow <= 5);
  const weekendAvg = dailyAvg.filter(d => d.dow === 0 || d.dow === 6);
  const weekdayMean = weekdayAvg.length > 0
    ? weekdayAvg.reduce((s, d) => s + d.avg, 0) / weekdayAvg.length
    : 3;
  const weekendMean = weekendAvg.length > 0
    ? weekendAvg.reduce((s, d) => s + d.avg, 0) / weekendAvg.length
    : 3;

  // 7 日移动平均
  const recent7 = dailyAvg.slice(-7);
  const ma7 = recent7.reduce((s, d) => s + d.avg, 0) / recent7.length;

  // 趋势斜率（最近 7 天的线性回归）
  const n = recent7.length;
  const xMean = (n - 1) / 2;
  const yMean = ma7;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (recent7[i].avg - yMean);
    den += (i - xMean) * (i - xMean);
  }
  const slope = den !== 0 ? num / den : 0;

  // 生成预测
  const predictions: PredictionPoint[] = [];
  const today = new Date();

  for (let i = 1; i <= days; i++) {
    const predDate = new Date(today);
    predDate.setDate(predDate.getDate() + i);
    const dow = predDate.getDay();

    // 基础预测 = 移动平均 + 趋势外推
    let predicted = ma7 + slope * (7 + i);

    // 周期性调整
    const periodicity = dow >= 1 && dow <= 5
      ? weekdayMean - (weekdayMean + weekendMean) / 2
      : weekendMean - (weekdayMean + weekendMean) / 2;
    predicted += periodicity * 0.3;

    // 限制在 1-5 范围
    predicted = Math.max(1, Math.min(5, predicted));

    // 置信度随天数递减
    const confidence = Math.max(0.3, 1 - i * 0.1);

    predictions.push({
      date: predDate.toISOString().split('T')[0],
      predicted: Math.round(predicted * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  return predictions;
}

/**
 * 检测情绪趋势方向
 */
export function detectTrendDirection(
  predictions: PredictionPoint[],
  recentAvg: number
): 'improving' | 'stable' | 'declining' {
  if (predictions.length === 0) return 'stable';

  const predAvg = predictions.reduce((s, p) => s + p.predicted, 0) / predictions.length;
  const diff = predAvg - recentAvg;

  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}
