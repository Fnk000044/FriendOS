import { formatLocalDate } from './date';

/**
 * 风险仪表盘本地回退计算函数
 *
 * 主路径走 IPC `behaviorAnalyzeTrends` / `riskCalculate`（后端 BehaviorAnalyzer / RiskScoringEngine），
 * 仅在 IPC 不可用时回退到这些本地实现。与后端算法保持等价语义。
 */

// 计算连续无日记天数 - 扩大窗口至30天以检测更长周期的忽视
export function calculateConsecutiveNoDiary(diaries: { date: string }[]): number {
  const today = new Date();
  let count = 0;
  const MAX_LOOKBACK = 30;
  for (let i = 0; i < MAX_LOOKBACK; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalDate(date);
    const hasDiary = diaries.some(d => d.date === dateStr);
    if (!hasDiary) count++;
    else break;
  }
  return count;
}

// 计算连续低心情天数
export function calculateConsecutiveLowMood(diaries: { date: string; mood?: number }[]): number {
  const sorted = [...diaries].sort((a, b) => b.date.localeCompare(a.date));
  let count = 0;
  for (const diary of sorted) {
    if (diary.mood && diary.mood <= 2) count++;
    else break;
  }
  return count;
}

// 计算任务完成率是否下降
export function calculateTaskCompletionDrop(behaviorRecords: {
  tasksCompleted: number;
  tasksTotal: number;
}[]): boolean {
  if (behaviorRecords.length < 7) return false;
  const recent = behaviorRecords.slice(-3);
  const earlier = behaviorRecords.slice(-7, -3);
  const recentRate = recent.reduce((sum, r) => sum + (r.tasksCompleted / Math.max(r.tasksTotal, 1)), 0) / recent.length;
  const earlierRate = earlier.reduce((sum, r) => sum + (r.tasksCompleted / Math.max(r.tasksTotal, 1)), 0) / earlier.length;
  return earlierRate > 0.5 && recentRate < earlierRate * 0.6;
}

// 计算习惯中断天数
export function calculateHabitBreakDays(behaviorRecords: {
  date: string;
  habitsTotal: number;
  habitsChecked: number;
}[]): number {
  const sorted = [...behaviorRecords].sort((a, b) => b.date.localeCompare(a.date));
  let count = 0;
  for (const record of sorted) {
    if (record.habitsTotal > 0 && record.habitsChecked === 0) count++;
    else break;
  }
  return count;
}

// 计算深夜活跃比例
export function calculateLateNightRatio(behaviorRecords: {
  activeHours?: number[];
}[]): number {
  if (behaviorRecords.length === 0) return 0;
  const lateNightCount = behaviorRecords.filter(r => {
    if (!r.activeHours || r.activeHours.length === 0) return false;
    return r.activeHours.some((h: number) => h >= 0 && h < 5);
  }).length;
  return lateNightCount / behaviorRecords.length;
}

// 计算趋势数据（color 字段用于按风险等级动态着色）
export interface RiskTrendPoint {
  date: string;
  score: number;
  color: string;
}

export function calculateTrendData(
  emotions: { date: string; sentimentScore: number }[],
  behaviors: unknown[],
  assessments: unknown[],
  diaries: { date: string; mood?: number }[],
  days: number,
): RiskTrendPoint[] {
  const result: RiskTrendPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalDate(date);
    const shortDate = dateStr.slice(5);

    // 简化计算：基于当天的情绪和行为数据
    const dayEmotions = emotions.filter(e => e.date === dateStr);
    const dayDiary = diaries.find(d => d.date === dateStr);

    let score = 50; // 默认中等风险

    if (dayEmotions.length > 0) {
      const avgSentiment = dayEmotions.reduce((sum, e) => sum + e.sentimentScore, 0) / dayEmotions.length;
      score = Math.round((1 - avgSentiment) * 50);
    } else if (dayDiary?.mood) {
      score = Math.round((5 - dayDiary.mood) * 20);
    }

    void behaviors;
    void assessments;

    // 风险指数：0=最低风险，100=最高风险（基于情绪/心情反向计算）
    const clamped = Math.min(100, Math.max(0, score));
    // 按 score 动态着色：< 30 绿（低），30-60 黄（中），>= 60 红（高）
    const color = clamped < 30 ? '#22C55E' : clamped < 60 ? '#F59E0B' : '#EF4444';
    result.push({ date: shortDate, score: clamped, color });
  }

  return result;
}
