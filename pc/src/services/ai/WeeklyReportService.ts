/**
 * Weekly Report Service
 * 生成每周心理健康报告
 */

import { db } from '../../db';
import { getToday, getDaysAgo } from '../../utils/date';

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  summary: string;
  moodTrend: 'improving' | 'stable' | 'declining';
  highlights: string[];
  concerns: string[];
  suggestions: string[];
  stats: {
    diaryCount: number;
    avgMood: number;
    taskCompletion: number;
    habitStreak: number;
    assessmentScores: { type: string; score: number }[];
  };
}

/**
 * 生成本周心理健康报告
 */
export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const weekEnd = getToday();
  const weekStart = getDaysAgo(7);

  // 收集本周数据
  const [diaries, tasks, habitLogs, assessments, emotions] = await Promise.all([
    db.diaries.where('date').between(weekStart, weekEnd, true, true).toArray(),
    db.tasks.where('scheduledDate').between(weekStart, weekEnd, true, true).toArray(),
    db.habitLogs.where('date').between(weekStart, weekEnd, true, true).toArray(),
    db.assessments.where('date').between(weekStart, weekEnd, true, true).toArray(),
    db.emotionRecords.where('date').between(weekStart, weekEnd, true, true).toArray(),
  ]);

  // 统计
  const avgMood = diaries.length > 0
    ? diaries.reduce((s, d) => s + d.mood, 0) / diaries.length
    : 0;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const taskCompletion = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // 计算情绪趋势
  let moodTrend: WeeklyReport['moodTrend'] = 'stable';
  if (emotions.length >= 3) {
    const firstHalf = emotions.slice(0, Math.floor(emotions.length / 2));
    const secondHalf = emotions.slice(Math.floor(emotions.length / 2));
    const firstAvg = firstHalf.reduce((s, e) => s + e.sentimentScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, e) => s + e.sentimentScore, 0) / secondHalf.length;
    if (secondAvg - firstAvg > 0.15) moodTrend = 'improving';
    else if (firstAvg - secondAvg > 0.15) moodTrend = 'declining';
  }

  const stats = {
    diaryCount: diaries.length,
    avgMood: Math.round(avgMood * 10) / 10,
    taskCompletion,
    habitStreak: habitLogs.length,
    assessmentScores: assessments.map(a => ({ type: a.type, score: a.totalScore })),
  };

  // 生成文字分析
  const summary = generateSummary(stats, moodTrend);
  const highlights = generateHighlights(stats, diaries);
  const concerns = generateConcerns(stats, diaries, emotions);
  const suggestions = generateSuggestions(stats);

  return {
    weekStart,
    weekEnd,
    summary,
    moodTrend,
    highlights,
    concerns,
    suggestions,
    stats,
  };
}

function generateSummary(stats: WeeklyReport['stats'], moodTrend: string): string {
  const parts: string[] = [];

  if (stats.diaryCount >= 5) {
    parts.push(`本周写了 ${stats.diaryCount} 篇日记`);
  }

  if (stats.avgMood >= 4) {
    parts.push('整体心情很好');
  } else if (stats.avgMood >= 3) {
    parts.push('心情整体平稳');
  } else if (stats.avgMood >= 2) {
    parts.push('情绪有一定波动');
  } else {
    parts.push('本周情绪偏低');
  }

  if (moodTrend === 'improving') {
    parts.push('趋势在改善');
  } else if (moodTrend === 'declining') {
    parts.push('需关注近期变化');
  }

  return parts.join('，') + '。';
}

function generateHighlights(stats: WeeklyReport['stats'], diaries: any[]): string[] {
  const highlights: string[] = [];

  if (stats.diaryCount >= 5) {
    highlights.push(`保持了良好的日记习惯（${stats.diaryCount} 篇）`);
  }
  if (stats.taskCompletion >= 70) {
    highlights.push(`任务完成率 ${stats.taskCompletion}%`);
  }
  if (stats.avgMood >= 4) {
    highlights.push('整体心情很好');
  }

  const goodDays = diaries.filter(d => d.mood >= 4).length;
  if (goodDays >= 3) {
    highlights.push(`有 ${goodDays} 天心情不错`);
  }

  return highlights.length > 0 ? highlights : ['本周坚持了下来，这本身就很棒'];
}

function generateConcerns(
  stats: WeeklyReport['stats'],
  diaries: any[],
  emotions: any[]
): string[] {
  const concerns: string[] = [];

  if (stats.diaryCount < 3) {
    concerns.push('本周日记较少，建议保持记录习惯');
  }
  if (stats.avgMood < 2.5) {
    concerns.push('情绪持续偏低，建议关注');
  }

  const badDays = diaries.filter(d => d.mood <= 2).length;
  if (badDays >= 3) {
    concerns.push(`有 ${badDays} 天心情较差`);
  }

  const highRisk = emotions.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
  if (highRisk > 0) {
    concerns.push(`检测到 ${highRisk} 次高风险情绪`);
  }

  return concerns;
}

function generateSuggestions(stats: WeeklyReport['stats']): string[] {
  const suggestions: string[] = [];

  if (stats.avgMood < 3) {
    suggestions.push('尝试每天做 5 分钟呼吸练习');
  }
  if (stats.habitStreak < 5) {
    suggestions.push('尝试恢复习惯打卡，从小目标开始');
  }
  if (stats.diaryCount < 3) {
    suggestions.push('每天花 2 分钟记录心情，哪怕只写一句话');
  }

  suggestions.push('记得适当休息，保持规律作息');

  return suggestions;
}
