/**
 * Report AI Service
 * Generates AI-powered weekly/monthly reports with insights and suggestions.
 * Uses local Qwen3 model when available, falls back to rule-based engine.
 */

import { db } from '../../db';

export interface AIReport {
  period: string;
  summary: string;
  insights: string[];
  suggestions: string[];
  highlights: {
    bestDay: string | null;
    worstDay: string | null;
    trend: 'improving' | 'stable' | 'declining';
  };
  method: 'ai' | 'rule';
}

interface ReportData {
  startDate: string;
  endDate: string;
  periodLabel: string;
  avgMood: number;
  highRiskCount: number;
  diaryDays: number;
  totalDays: number;
  trend: 'improving' | 'stable' | 'declining';
  bestDay: string | null;
  worstDay: string | null;
  taskAvgRate: number;
  lateNightCount: number;
}

/**
 * 用本地 Qwen3 模型生成报告
 */
async function generateWithAI(data: ReportData): Promise<AIReport | null> {
  if (!window.electronAPI?.localModelComplete) return null;

  const systemPrompt = '你是一位心理健康顾问。请根据用户数据生成简洁的心理健康报告。只返回JSON格式，不要其他内容。';

  const userPrompt = `## 数据概览
- 时间范围：${data.periodLabel}
- 平均心情评分：${data.avgMood.toFixed(1)}/5
- 高风险情绪次数：${data.highRiskCount}
- 日记记录天数：${data.diaryDays}/${data.totalDays}
- 情绪趋势：${data.trend === 'improving' ? '改善中' : data.trend === 'declining' ? '下降中' : '稳定'}
- 任务完成率：${(data.taskAvgRate * 100).toFixed(0)}%
${data.bestDay ? `- 最佳状态日：${data.bestDay}` : ''}
${data.worstDay ? `- 最低状态日：${data.worstDay}` : ''}

请用 JSON 格式回复，包含以下字段：
{
  "summary": "一句话总结（30字以内）",
  "insights": ["洞察1", "洞察2", "洞察3"],
  "suggestions": ["建议1", "建议2"]
}

只返回 JSON，不要其他内容。`;

  try {
    const result = await window.electronAPI.localModelComplete(userPrompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 256,
    });
    if (result.error || !result.response) return null;

    // 尝试解析 JSON
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // 验证结构
    if (!parsed.summary || !Array.isArray(parsed.insights) || !Array.isArray(parsed.suggestions)) {
      return null;
    }

    return {
      period: `${data.startDate} ~ ${data.endDate}`,
      summary: parsed.summary,
      insights: parsed.insights.slice(0, 5),
      suggestions: parsed.suggestions.slice(0, 3),
      highlights: {
        bestDay: data.bestDay,
        worstDay: data.worstDay,
        trend: data.trend,
      },
      method: 'ai',
    };
  } catch (err) {
    console.warn('[ReportAIService] AI 生成失败，回退到规则引擎:', err);
    return null;
  }
}

/**
 * 用规则引擎生成报告（回退方案）
 */
function generateWithRules(data: ReportData): AIReport {
  const { periodLabel, avgMood, highRiskCount, diaryDays, totalDays, trend, bestDay, worstDay, taskAvgRate } = data;

  // Summary
  let summary = '';
  if (avgMood >= 4) {
    summary = `${periodLabel}你的整体状态非常好！心情评分平均 ${avgMood.toFixed(1)}/5，继续保持积极的生活态度。`;
  } else if (avgMood >= 3) {
    summary = `${periodLabel}你的状态整体平稳，心情评分平均 ${avgMood.toFixed(1)}/5。偶尔有波动是正常的。`;
  } else if (avgMood >= 2) {
    summary = `${periodLabel}你可能经历了一些困难，心情评分平均 ${avgMood.toFixed(1)}/5。建议多关注自己的情绪。`;
  } else {
    summary = `${periodLabel}你的状态需要关注，心情评分平均 ${avgMood.toFixed(1)}/5。建议寻求支持或尝试放松练习。`;
  }

  // Insights
  const insights: string[] = [];

  if (diaryDays > 0) {
    const diaryRate = Math.round((diaryDays / totalDays) * 100);
    if (diaryRate >= 80) {
      insights.push(`日记记录很规律，${periodLabel}共写了 ${diaryDays} 天，记录率 ${diaryRate}%。`);
    } else if (diaryRate >= 50) {
      insights.push(`日记记录还不错，${periodLabel}写了 ${diaryDays} 天，可以尝试更规律地记录。`);
    } else {
      insights.push(`${periodLabel}只写了 ${diaryDays} 天日记，建议养成每天记录的习惯。`);
    }
  }

  if (highRiskCount > 0) {
    insights.push(`${periodLabel}检测到 ${highRiskCount} 次高风险情绪，需要关注。`);
  } else {
    insights.push(`${periodLabel}未检测到高风险情绪，心理状态良好。`);
  }

  if (trend === 'improving') {
    insights.push('你的情绪趋势在改善，后半段比前半段明显好转。');
  } else if (trend === 'declining') {
    insights.push('你的情绪趋势有所下降，建议关注最近的变化。');
  }

  if (taskAvgRate >= 0.8) {
    insights.push('任务完成率很高，执行力不错！');
  } else if (taskAvgRate < 0.5 && taskAvgRate > 0) {
    insights.push('任务完成率偏低，可能需要调整目标或时间管理。');
  }

  // Suggestions
  const suggestions: string[] = [];

  if (avgMood < 3) {
    suggestions.push('尝试每天写感恩日记，记录 3 件值得感恩的事。');
    suggestions.push('做一次 4-7-8 呼吸练习，帮助放松身心。');
  }

  if (highRiskCount > 0) {
    suggestions.push('如果有持续的负面情绪，建议与信任的人分享。');
  }

  if (diaryDays < totalDays * 0.5) {
    suggestions.push('养成每天写日记的习惯，有助于情绪觉察。');
  }

  if (data.lateNightCount > 0) {
    suggestions.push('注意作息规律，尽量避免深夜活动。');
  }

  if (suggestions.length === 0) {
    suggestions.push('保持当前的良好状态，继续规律生活。');
    suggestions.push('尝试新的放松方式，如正念冥想或轻度运动。');
  }

  return {
    period: `${data.startDate} ~ ${data.endDate}`,
    summary,
    insights: insights.slice(0, 5),
    suggestions: suggestions.slice(0, 3),
    highlights: { bestDay, worstDay, trend },
    method: 'rule',
  };
}

/**
 * 主入口：优先使用 AI，失败时回退到规则引擎
 */
export async function generateAIReport(startDate: string, endDate: string): Promise<AIReport> {
  // Gather data
  const [emotions, behaviors] = await Promise.all([
    db.emotionRecords.where('date').between(startDate, endDate, true, true).toArray(),
    db.behaviorRecords.where('date').between(startDate, endDate, true, true).toArray(),
  ]);

  // Calculate stats
  const moodRatings = behaviors.filter(b => b.moodRating != null).map(b => b.moodRating!);
  const avgMood = moodRatings.length > 0
    ? moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length
    : 3;

  const highRiskCount = emotions.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
  const diaryDays = behaviors.filter(b => b.diaryWritten).length;
  const totalDays = behaviors.length || 1;

  // Determine trend
  let trend: AIReport['highlights']['trend'] = 'stable';
  if (moodRatings.length >= 3) {
    const firstHalf = moodRatings.slice(0, Math.floor(moodRatings.length / 2));
    const secondHalf = moodRatings.slice(Math.floor(moodRatings.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg - firstAvg > 0.5) trend = 'improving';
    else if (firstAvg - secondAvg > 0.5) trend = 'declining';
  }

  // Find best/worst days
  let bestDay: string | null = null;
  let worstDay: string | null = null;
  let bestMood = 0;
  let worstMood = 6;

  for (const b of behaviors) {
    if (b.moodRating != null) {
      if (b.moodRating > bestMood) { bestMood = b.moodRating; bestDay = b.date; }
      if (b.moodRating < worstMood) { worstMood = b.moodRating; worstDay = b.date; }
    }
  }

  // Task completion rate
  const taskBehaviors = behaviors.filter(b => b.tasksTotal > 0);
  const taskAvgRate = taskBehaviors.length > 0
    ? taskBehaviors.reduce((sum, b) => sum + b.tasksCompleted / b.tasksTotal, 0) / taskBehaviors.length
    : 0;

  // Late night count
  const lateNightCount = behaviors.filter(b => b.activeHours?.some(h => h >= 0 && h < 6)).length;

  const periodDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
  const periodLabel = periodDays <= 7 ? '本周' : periodDays <= 31 ? '本月' : `${periodDays}天`;

  const reportData: ReportData = {
    startDate, endDate, periodLabel, avgMood, highRiskCount,
    diaryDays, totalDays, trend, bestDay, worstDay,
    taskAvgRate, lateNightCount,
  };

  // 尝试 AI 生成
  const aiReport = await generateWithAI(reportData);
  if (aiReport) return aiReport;

  // 回退到规则引擎
  return generateWithRules(reportData);
}
