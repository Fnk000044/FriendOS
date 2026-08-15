/**
 * Report AI Service
 * Generates weekly/monthly reports with insights and suggestions.
 *
 * 历史版本曾接入本地 Qwen3 模型做 AI 流式报告，因模型体积大、响应慢、
 * 生成质量不稳定，已移除本地大模型。现仅保留基于数据驱动的规则引擎，
 * 文案根据统计指标生成，保证稳定可解释。
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
<<<<<<< HEAD
  /** 习惯完成率（0-1） */
  habitAvgRate: number;
  /** 平均睡眠时长（小时，来自行为记录 activeHours 推断，可空） */
  sleepAvgHours: number | null;
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}

/**
 * 用规则引擎生成报告
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

<<<<<<< HEAD
  if (data.habitAvgRate >= 0.8) {
    insights.push('习惯打卡很稳定，坚持得很好，这是心理健康的护城河。');
  } else if (data.habitAvgRate > 0 && data.habitAvgRate < 0.5) {
    insights.push('习惯打卡率偏低（' + Math.round(data.habitAvgRate * 100) + '%），试着把目标拆小一点。');
  }

  if (data.sleepAvgHours != null && data.sleepAvgHours < 6) {
    insights.push('平均睡眠不足 6 小时，睡眠不足会显著影响情绪调节。');
  }

=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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

<<<<<<< HEAD
  if (data.habitAvgRate > 0 && data.habitAvgRate < 0.5) {
    suggestions.push('把习惯目标拆小：从"每天运动"改成"每周运动 3 次，每次 10 分钟"。');
  }

  if (data.sleepAvgHours != null && data.sleepAvgHours < 6) {
    suggestions.push('今晚提前 30 分钟上床，睡前 1 小时不看屏幕。');
  }

=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
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
 * 从数据库收集统计特征（共享给 generateAIReport / generateAIReportStream）
 *
 * 注意：moodRatings 必须按 date 升序排列后再做趋势计算。
 * 历史实现曾用 `.sort((a,b)=>a-b)` 按心情评分值排序，破坏了时间序列，
 * 导致移动平均与 trend 标签失真。此处修复为按记录时间排序。
 */
async function gatherReportData(startDate: string, endDate: string): Promise<ReportData> {
  const [emotions, behaviors] = await Promise.all([
    db.emotionRecords.where('date').between(startDate, endDate, true, true).toArray(),
    db.behaviorRecords.where('date').between(startDate, endDate, true, true).toArray(),
  ]);

  // 按 date 升序，保证时间序列正确（修复历史 bug）
  const sortedBehaviors = [...behaviors].sort((a, b) => a.date.localeCompare(b.date));
  const moodRatings = sortedBehaviors
    .filter(b => b.moodRating != null)
    .map(b => b.moodRating!);

  const avgMood = moodRatings.length > 0
    ? moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length
    : 3;

  const highRiskCount = emotions.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
  const diaryDays = behaviors.filter(b => b.diaryWritten).length;
  const totalDays = behaviors.length || 1;

  // Determine trend - 使用 7 日移动平均，比前后半段均值更平滑可靠
  // moodRatings 已按时间升序
  let trend: AIReport['highlights']['trend'] = 'stable';
  if (moodRatings.length >= 3) {
    const windowSize = Math.min(7, Math.floor(moodRatings.length / 2));
    if (windowSize >= 2 && moodRatings.length >= windowSize * 2) {
      const firstWindow = moodRatings.slice(0, windowSize);
      const lastWindow = moodRatings.slice(-windowSize);
      const firstAvg = firstWindow.reduce((a, b) => a + b, 0) / firstWindow.length;
      const lastAvg = lastWindow.reduce((a, b) => a + b, 0) / lastWindow.length;
      if (lastAvg - firstAvg > 0.5) trend = 'improving';
      else if (firstAvg - lastAvg > 0.5) trend = 'declining';
    } else {
      // 数据量不足，回退到前后半段
      const firstHalf = moodRatings.slice(0, Math.floor(moodRatings.length / 2));
      const secondHalf = moodRatings.slice(Math.floor(moodRatings.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      if (secondAvg - firstAvg > 0.5) trend = 'improving';
      else if (firstAvg - secondAvg > 0.5) trend = 'declining';
    }
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

<<<<<<< HEAD
  // Habit completion rate
  const habitBehaviors = behaviors.filter(b => b.habitsTotal > 0);
  const habitAvgRate = habitBehaviors.length > 0
    ? habitBehaviors.reduce((sum, b) => sum + b.habitsChecked / b.habitsTotal, 0) / habitBehaviors.length
    : 0;

  // Sleep estimate: 活跃时段推断平均睡眠（activeHours 0-5 有活动 = 熬夜，粗略估算）
  const lateNights = behaviors.filter(b => b.activeHours?.some(h => h >= 0 && h < 6)).length;
  const sleepAvgHours = behaviors.length > 0
    ? Math.max(4, Math.min(9, 8 - (lateNights / behaviors.length) * 3))
    : null;

  // Late night count
  const lateNightCount = lateNights;
=======
  // Late night count
  const lateNightCount = behaviors.filter(b => b.activeHours?.some(h => h >= 0 && h < 6)).length;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  const periodDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
  const periodLabel = periodDays <= 7 ? '本周' : periodDays <= 31 ? '本月' : `${periodDays}天`;

  return {
    startDate, endDate, periodLabel, avgMood, highRiskCount,
    diaryDays, totalDays, trend, bestDay, worstDay,
<<<<<<< HEAD
    taskAvgRate, lateNightCount, habitAvgRate, sleepAvgHours,
=======
    taskAvgRate, lateNightCount,
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  };
}

/**
 * 主入口：优先用云 LLM 生成报告，不可用时降级规则引擎。
 *
 * 0.0.6 改进：
 * - 若用户配置了 chat LLM（通义千问/DeepSeek），用 LLM 生成"AI 解读"段落，method='ai'。
 * - 未配置/调用失败 → 降级到 generateWithRules，method='rule'。
 * - 无论哪种，报告底部标注生成方式（诚实透明）。
 */
export async function generateAIReport(startDate: string, endDate: string): Promise<AIReport> {
  const reportData = await gatherReportData(startDate, endDate);

  // 缓存命中：同周期报告直接复用
  const cacheKey = `${startDate}_${endDate}`;
  try {
    const cached = await db.aiReportCache.get(cacheKey);
    if (cached?.report) {
      return cached.report as AIReport;
    }
  } catch (err) {
    console.warn('[ReportAIService] Cache read failed, will regenerate:', err);
  }

  // 尝试用 LLM 生成
  let report: AIReport;
  try {
    report = await generateWithLLM(reportData);
  } catch (err) {
    console.warn('[ReportAIService] LLM generation failed, falling back to rules:', err);
    report = generateWithRules(reportData);
  }

  // 写缓存
  try {
    await db.aiReportCache.put({
      id: cacheKey,
      period: report.period,
      report,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[ReportAIService] Cache write failed:', err);
  }

  return report;
}

/**
 * 用云 LLM 生成报告解读
 * 输入统计数据 JSON，要求 3-5 句自然语言总结。
 * 走主进程代理（chat:send），不持有 key。
 */
async function generateWithLLM(data: ReportData): Promise<AIReport> {
  const API = typeof window !== 'undefined' ? window.electronAPI : undefined;
  if (!API) throw new Error('electronAPI unavailable');

  // 检查是否有配置 LLM
  const config = await API.chatGetProviderConfig();
  if (!config.hasKey) throw new Error('LLM not configured');

  const statsJSON = JSON.stringify({
    period: data.periodLabel,
    avgMood: Number(data.avgMood.toFixed(2)),
    diaryDays: data.diaryDays,
    totalDays: data.totalDays,
    highRiskCount: data.highRiskCount,
    trend: data.trend,
    taskAvgRate: Number(data.taskAvgRate.toFixed(2)),
    lateNightCount: data.lateNightCount,
    bestDay: data.bestDay,
    worstDay: data.worstDay,
  });

  const systemPrompt = `你是心理健康报告分析助手。根据用户提供的统计数据 JSON，生成一份简洁的中文健康报告。
要求：
- summary：3-5 句自然语言总结，先说整体状态，再点出关键发现，语气温暖不评判。
- insights：2-3 条洞察，基于数据具体说，不要套话。
- suggestions：2-3 条建议，可执行、具体。
- 只返回 JSON：{"summary":"...","insights":["..."],"suggestions":["..."]}
- 不要包含 markdown 代码块标记`;

  const requestId = `report_${Date.now()}`;
  const result = await API.chatSend({
    requestId,
    messages: [{ role: 'user', content: `请基于以下数据生成报告：\n${statsJSON}` }],
    systemPrompt,
  });

  if (!result.ok || !result.fullText) {
    throw new Error(result.error || 'LLM generation failed');
  }

  // 提取 JSON
  const jsonMatch = result.fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM response is not JSON');

  let parsed: { summary?: string; insights?: string[]; suggestions?: string[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('LLM JSON parse failed');
  }

  return {
    period: `${data.startDate} ~ ${data.endDate}`,
    summary: parsed.summary || '',
    insights: parsed.insights || [],
    suggestions: parsed.suggestions || [],
    highlights: { bestDay: data.bestDay, worstDay: data.worstDay, trend: data.trend },
    method: 'ai',
  };
}

/**
 * 流式生成报告（兼容旧调用方）
 *
 * 历史版本接入本地大模型做流式 summary，现已移除大模型。
 * 此函数保留签名兼容 WeeklyReportCard 等调用方：
 * - 仍回调 onSummaryChunk，但改为一次性回放规则引擎 summary（逐字符）
 * - 使 UI 仍能呈现"逐字显示"的过渡效果
 */
export async function generateAIReportStream(
  startDate: string,
  endDate: string,
  onSummaryChunk?: (chunk: string) => void
): Promise<AIReport> {
  // 复用主入口（已含 LLM 优先 + 缓存 + 降级）
  const report = await generateAIReport(startDate, endDate);

  // 逐字符回放 summary，保持 UI 流式过渡效果
  if (onSummaryChunk && report.summary) {
    for (const ch of report.summary) onSummaryChunk(ch);
  }

  return report;
}
