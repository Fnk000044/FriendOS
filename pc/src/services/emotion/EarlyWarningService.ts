import { db } from '../../db';
import { getDaysAgo, getToday, formatLocalDate } from '../../utils/date';

/**
 * Early Risk Prediction Service
 * 基于时间序列的早期风险预测
 *
 * 方法: 滑动窗口特征 + 偏离基线异常检测 + 趋势预测
 * 参考: Predicting College Mental Health (2025), ML-based early warning
 *
 * 职责边界（与 EmotionPredictionService 区分）：
 * - EmotionPredictionService：单序列趋势方向（improving/stable/declining）+ 置信度
 * - EarlyWarningService：多窗口特征向量 + 预警等级 + 距临界点天数估算
 */

// ── 特征提取 ──────────────────────────────────────────────

interface RiskFeatures {
  // 情绪特征
  moodMean: number;
  moodVariance: number;
  moodTrend: number;          // 斜率
  moodDipDays: number;        // 连续低落天数

  // 行为特征
  diarySkipDays: number;      // 连续不写日记天数
  taskCompletionRate: number;
  habitCompletionRate: number;
  lateNightFrequency: number; // 熬夜频率（0-1）

  // 综合（来自 HealthProfile.dimensions，回退 0.5）
  socialScore: number;
  energyScore: number;
  sleepScore: number;
}

export type { RiskFeatures };

/**
 * 计算区间 [startDate, endDate) 内的线性回归斜率
 */
function linearRegression(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - meanX) * (values[i] - meanY);
    denominator += (i - meanX) ** 2;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * 从指定 [start, end) 区间提取特征向量
 * @param startDaysAgo 起始距今 N 天
 * @param windowDays 窗口宽度（天）
 */
export async function extractFeatures(startDaysAgo: number, windowDays: number = 3): Promise<RiskFeatures | null> {
  const startDate = getDaysAgo(startDaysAgo);
  const endDateExclusive = getDaysAgo(startDaysAgo - windowDays); // 窗口右端
  const today = getToday();

  const [emotions, behaviors, tasks, diaries, habitLogs, healthProfile] = await Promise.all([
    db.emotionRecords.where('date').aboveOrEqual(startDate).toArray(),
    db.behaviorRecords.where('date').aboveOrEqual(startDate).toArray(),
    db.tasks.where('scheduledDate').aboveOrEqual(startDate).toArray(),
    db.diaries.where('date').aboveOrEqual(startDate).toArray(),
    db.habitLogs.where('date').aboveOrEqual(startDate).toArray(),
    db.healthProfiles.orderBy('date').reverse().first(),
  ]);

  // 仅保留落在窗口内的记录（endDateExclusive <= date < today 的右开区间）
  // Task 用 scheduledDate；HabitLog/Emotion/Behavior/Diary 用 date
  const inWindow = <T extends { date: string }>(arr: T[]) =>
    arr.filter(r => r.date >= startDate && r.date < endDateExclusive && r.date <= today);
  const tasksInWindow = tasks.filter(r =>
    r.scheduledDate >= startDate && r.scheduledDate < endDateExclusive && r.scheduledDate <= today
  );

  const winEmotions = inWindow(emotions).sort((a, b) => a.date.localeCompare(b.date));
  const winBehaviors = inWindow(behaviors);
  const winDiaries = inWindow(diaries);
  const winHabitLogs = inWindow(habitLogs);
  const winTasks = tasksInWindow;

  if (winEmotions.length < 3 && winBehaviors.length < 3) return null;

  // 1. 情绪特征
  const moodScores = winEmotions.map(e => e.sentimentScore);
  const moodMean = moodScores.length > 0
    ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
    : 0;
  const moodVariance = moodScores.length > 0
    ? moodScores.reduce((s, v) => s + (v - moodMean) ** 2, 0) / moodScores.length
    : 0;

  const moodTrend = moodScores.length >= 4
    ? linearRegression(moodScores)
    : 0;

  // 连续低落天数（按日期升序后从最近一天向前数）
  const sortedByDateDesc = [...winEmotions].sort((a, b) => b.date.localeCompare(a.date));
  let moodDipDays = 0;
  for (const e of sortedByDateDesc) {
    if (e.sentimentScore < -0.2) moodDipDays++;
    else break;
  }

  // 2. 行为特征：连续不写日记（仅统计窗口内 + 当天）
  const diaryDates = new Set(winDiaries.map(d => d.date));
  let diarySkipDays = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = getDaysAgo(i);
    if (!diaryDates.has(d)) diarySkipDays++;
  }

  // 任务完成率（窗口内）
  const completedTasks = winTasks.filter(t => t.status === 'completed').length;
  const taskCompletionRate = winTasks.length > 0 ? completedTasks / winTasks.length : 0;

  // 习惯完成率（窗口内：count > 0 视为已打卡）
  const habitCompletionRate = winHabitLogs.length > 0
    ? winHabitLogs.filter(h => h.count > 0).length / winHabitLogs.length
    : 0.5;

  // 熬夜频率：行为记录 activeHours 命中 0-5 点的比例
  // 说明：activeHours 来源于日记写作时间戳，仅作熬夜行为的间接代理指标，
  // 未覆盖真实睡眠时长（需接入可穿戴设备/屏幕时间 API 才能准确量化）。
  const lateNightCount = winBehaviors.filter(r =>
    r.activeHours && r.activeHours.some(h => h >= 0 && h < 5)
  ).length;
  const lateNightFrequency = winBehaviors.length > 0 ? lateNightCount / winBehaviors.length : 0;

  // 睡眠推断：基于深夜写作时间窗口，参考无感识别研究报告 r≈0.43
  // 若日记写作时间集中在 0-2 点，推断就寝时间偏晚，sleepScore 相应下调
  // 缺失 activeHours 时回退到 HealthProfile.sleep
  const dims = healthProfile?.dimensions;
  let socialScore = dims?.social ?? 0.5;
  let energyScore = dims?.energy ?? 0.5;
  let sleepScore = dims?.sleep ?? 0.5;
  // 深夜频率 > 0.3 时，按比例下调 sleepScore（最多降 0.3）
  if (lateNightFrequency > 0.3) {
    sleepScore = Math.max(0.1, sleepScore - lateNightFrequency * 0.5);
  }

  return {
    moodMean: Math.round(moodMean * 1000) / 1000,
    moodVariance: Math.round(moodVariance * 1000) / 1000,
    moodTrend: Math.round(moodTrend * 1000) / 1000,
    moodDipDays,
    diarySkipDays,
    taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
    habitCompletionRate: Math.round(habitCompletionRate * 100) / 100,
    lateNightFrequency: Math.round(lateNightFrequency * 100) / 100,
    socialScore,
    energyScore,
    sleepScore,
  };
}

/**
 * 计算异常分数
 * 基于特征的偏离程度，越偏离个体基线则分数越高
 */
export function calculateAnomalyScore(features: RiskFeatures): number {
  let score = 0;
  if (features.moodMean < -0.3) score += 25;
  if (features.moodTrend < -0.05) score += 20;  // 持续下降
  if (features.moodDipDays >= 3) score += 15;
  if (features.diarySkipDays >= 3) score += 10;
  if (features.taskCompletionRate < 0.3) score += 10;
  if (features.habitCompletionRate < 0.3) score += 10;
  if (features.lateNightFrequency > 0.3) score += 10;
  return Math.min(100, score);
}

/**
 * 风险趋势预测
 * 基于过去 N 个窗口的特征向量，预测未来 3 天的风险等级
 * 当趋势斜率持续为负且加速下降时提前预警
 */
export function predictRiskTrend(features: RiskFeatures[]): {
  nextRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  warningSignals: string[];
} {
  if (features.length < 2) {
    return { nextRiskLevel: 'low', confidence: 0, warningSignals: [] };
  }

  const signals: string[] = [];
  const latest = features[features.length - 1];
  const prev = features[features.length - 2];

  // 情绪趋势加速下降
  if (latest.moodTrend < -0.05 && latest.moodTrend < prev.moodTrend) {
    signals.push('情绪下降加速');
  }
  // 连续低落天数在增加
  if (latest.moodDipDays >= 3 && latest.moodDipDays > prev.moodDipDays) {
    signals.push('连续低落天数在增加');
  }
  // 连续未写日记
  if (latest.diarySkipDays >= 3) {
    signals.push('连续多日未记录情绪');
  }
  // 任务完成率持续走低
  if (latest.taskCompletionRate < 0.3 && latest.taskCompletionRate < prev.taskCompletionRate) {
    signals.push('任务完成率持续下降');
  }
  // 习惯中断恶化
  if (latest.habitCompletionRate < 0.3 && latest.habitCompletionRate < prev.habitCompletionRate) {
    signals.push('习惯打卡中断');
  }
  // 熬夜频次上升
  if (latest.lateNightFrequency > 0.3 && latest.lateNightFrequency > prev.lateNightFrequency) {
    signals.push('熬夜频率上升');
  }

  let nextRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (signals.length >= 3) nextRiskLevel = 'critical';
  else if (signals.length === 2) nextRiskLevel = 'high';
  else if (signals.length === 1) nextRiskLevel = 'medium';

  return {
    nextRiskLevel,
    confidence: Math.min(0.9, signals.length * 0.25 + 0.1),
    warningSignals: signals,
  };
}

export interface EarlyWarningResult {
  hasWarning: boolean;
  level: 'green' | 'yellow' | 'orange' | 'red';
  signals: string[];
  daysToCritical: number | null;
  anomalyScore: number;
  trendSeries: RiskFeatures[];
  nextRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

/**
 * 滑动窗口早期预警：每 windowDays 天为一个窗口，取最近 windowCount 个窗口
 * 窗口 i 表示 [today-(i+1)*windowDays, today-i*windowDays)
 */
export async function getEarlyWarning(
  windowDays: number = 3,
  windowCount: number = 5
): Promise<EarlyWarningResult> {
  const windows: RiskFeatures[] = [];
  for (let i = windowCount - 1; i >= 0; i--) {
    const features = await extractFeatures((i + 1) * windowDays, windowDays);
    if (features) windows.push(features);
  }

  if (windows.length < 2) {
    return {
      hasWarning: false, level: 'green', signals: [], daysToCritical: null,
      anomalyScore: 0, trendSeries: windows, nextRiskLevel: 'low', confidence: 0,
    };
  }

  const prediction = predictRiskTrend(windows);
  const latest = windows[windows.length - 1];
  const anomalyScore = calculateAnomalyScore(latest);

  if (prediction.warningSignals.length === 0 && anomalyScore < 25) {
    return {
      hasWarning: false, level: 'green', signals: [], daysToCritical: null,
      anomalyScore, trendSeries: windows,
      nextRiskLevel: prediction.nextRiskLevel, confidence: prediction.confidence,
    };
  }

  // 估算距离临界点的天数（基于恶化速度）
  const signalCount = prediction.warningSignals.length;
  const daysToCritical = signalCount >= 3
    ? Math.max(1, Math.round(windowDays / signalCount))
    : signalCount === 2 ? windowDays * 2
    : signalCount === 1 ? windowDays * 4
    : null;

  const level: 'green' | 'yellow' | 'orange' | 'red' =
    signalCount >= 3 ? 'red'
    : signalCount === 2 ? 'orange'
    : 'yellow';

  return {
    hasWarning: true,
    level,
    signals: prediction.warningSignals,
    daysToCritical,
    anomalyScore,
    trendSeries: windows,
    nextRiskLevel: prediction.nextRiskLevel,
    confidence: prediction.confidence,
  };
}

// 导出供测试与文档对齐
export const EARLY_WARNING_DEFAULTS = { windowDays: 3, windowCount: 5 };
