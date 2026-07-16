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

  const systemPrompt = `你是一位专业的心理健康顾问。根据用户数据生成简洁的心理健康报告。只返回纯JSON，不要markdown代码块、不要额外说明。

JSON结构：
{"summary":"一句话总结，30字以内","insights":["洞察1","洞察2","洞察3"],"suggestions":["建议1","建议2"]}

要求：
- summary 用一句话客观总结本周状态
- insights 是 2-3 条基于数据的客观洞察（不重复 summary）
- suggestions 是 2 条具体可执行的建议
- 所有文字用中文，简洁专业，不使用表情符号

示例1（状态良好）：
{"summary":"本周状态平稳，情绪积极，保持了良好的生活节奏。","insights":["日记记录率71%，自我觉察习惯良好","任务完成率80%，执行力强","情绪趋势稳定"],"suggestions":["继续保持规律作息","尝试拓展社交活动"]}

示例2（需关注）：
{"summary":"本周情绪有所波动，建议多关注自我状态。","insights":["检测到2次高风险情绪","日记记录较少，记录率29%","任务完成率偏低40%"],"suggestions":["每天花2分钟记录心情","将大任务拆分为小步骤"]}`;

  const userPrompt = `## 用户数据概览
- 时间范围：${data.periodLabel}
- 平均心情评分：${data.avgMood.toFixed(1)}/5
- 高风险情绪次数：${data.highRiskCount}
- 日记记录天数：${data.diaryDays}/${data.totalDays}（记录率${Math.round(data.diaryDays / data.totalDays * 100)}%）
- 情绪趋势：${data.trend === 'improving' ? '改善中' : data.trend === 'declining' ? '下降中' : '稳定'}
- 任务平均完成率：${(data.taskAvgRate * 100).toFixed(0)}%
- 深夜活动天数：${data.lateNightCount}
${data.bestDay ? `- 最佳状态日：${data.bestDay}` : ''}
${data.worstDay ? `- 最低状态日：${data.worstDay}` : ''}

## 输出要求
返回如下JSON结构（不要markdown，不要\`\`\`json）：
{"summary":"一句话总结，30字以内","insights":["洞察1","洞察2","洞察3"],"suggestions":["建议1","建议2"]}

## 示例
用户数据：平均心情3.2/5，高风险0次，日记5/7天，趋势稳定，任务完成率65%
{"summary":"本周状态平稳，情绪偶有波动但整体可控。","insights":["日记记录率71%，保持了较好的自我觉察习惯","任务完成率65%，还有提升空间","情绪趋势稳定，无明显恶化迹象"],"suggestions":["继续保持每日日记记录的习惯","尝试将大任务拆分为小步骤提高完成率"]}

现在请根据上述数据生成报告：`;

  try {
    const result = await window.electronAPI.localModelComplete(userPrompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 1024,
    });
    if (result.error || !result.response) return null;

    // 增强JSON解析：先剥离markdown fence，再贪婪匹配
    let raw = result.response.trim();
    // 剥离 ```json ... ``` 或 ``` ... ``` fence
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // 二次尝试：移除可能的尾部逗号
      const cleaned = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return null;
      }
    }

    // 验证结构
    if (!parsed.summary || !Array.isArray(parsed.insights) || !Array.isArray(parsed.suggestions)) {
      return null;
    }

    return {
      period: `${data.startDate} ~ ${data.endDate}`,
      summary: String(parsed.summary).slice(0, 100),
      insights: parsed.insights.filter((s: any) => typeof s === 'string').slice(0, 5),
      suggestions: parsed.suggestions.filter((s: any) => typeof s === 'string').slice(0, 3),
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

  // Determine trend - 使用7日移动平均，比前后半段均值更平滑可靠
  let trend: AIReport['highlights']['trend'] = 'stable';
  if (moodRatings.length >= 3) {
    const sorted = [...moodRatings].sort((a, b) => a - b); // 按时间顺序假设已有序
    // 7日移动平均（不足7日则用全部）
    const windowSize = Math.min(7, Math.floor(sorted.length / 2));
    if (windowSize >= 2 && sorted.length >= windowSize * 2) {
      const firstWindow = sorted.slice(0, windowSize);
      const lastWindow = sorted.slice(-windowSize);
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

/**
 * 流式生成报告（summary 逐字输出）
 *
 * - 优先用 Qwen 流式输出 summary 文本（通过 onSummaryChunk 回调）
 * - insights/suggestions 仍用非流式 JSON 解析（结构化字段不适合逐字流）
 * - Qwen 失败时回退到 generateWithRules（不暴露 method 给 UI）
 */
export async function generateAIReportStream(
  startDate: string,
  endDate: string,
  onSummaryChunk?: (chunk: string) => void
): Promise<AIReport> {
  // 收集数据（与 generateAIReport 一致）
  const [emotions, behaviors] = await Promise.all([
    db.emotionRecords.where('date').between(startDate, endDate, true, true).toArray(),
    db.behaviorRecords.where('date').between(startDate, endDate, true, true).toArray(),
  ]);

  const moodRatings = behaviors.filter(b => b.moodRating != null).map(b => b.moodRating!);
  const avgMood = moodRatings.length > 0
    ? moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length
    : 3;

  const highRiskCount = emotions.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
  const diaryDays = behaviors.filter(b => b.diaryWritten).length;
  const totalDays = behaviors.length || 1;

  let trend: AIReport['highlights']['trend'] = 'stable';
  if (moodRatings.length >= 3) {
    const sorted = [...moodRatings].sort((a, b) => a - b);
    const windowSize = Math.min(7, Math.floor(sorted.length / 2));
    if (windowSize >= 2 && sorted.length >= windowSize * 2) {
      const firstWindow = sorted.slice(0, windowSize);
      const lastWindow = sorted.slice(-windowSize);
      const firstAvg = firstWindow.reduce((a, b) => a + b, 0) / firstWindow.length;
      const lastAvg = lastWindow.reduce((a, b) => a + b, 0) / lastWindow.length;
      if (lastAvg - firstAvg > 0.5) trend = 'improving';
      else if (firstAvg - lastAvg > 0.5) trend = 'declining';
    } else {
      const firstHalf = moodRatings.slice(0, Math.floor(moodRatings.length / 2));
      const secondHalf = moodRatings.slice(Math.floor(moodRatings.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      if (secondAvg - firstAvg > 0.5) trend = 'improving';
      else if (firstAvg - secondAvg > 0.5) trend = 'declining';
    }
  }

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

  const taskBehaviors = behaviors.filter(b => b.tasksTotal > 0);
  const taskAvgRate = taskBehaviors.length > 0
    ? taskBehaviors.reduce((sum, b) => sum + b.tasksCompleted / b.tasksTotal, 0) / taskBehaviors.length
    : 0;
  const lateNightCount = behaviors.filter(b => b.activeHours?.some(h => h >= 0 && h < 6)).length;

  const periodDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
  const periodLabel = periodDays <= 7 ? '本周' : periodDays <= 31 ? '本月' : `${periodDays}天`;

  const reportData: ReportData = {
    startDate, endDate, periodLabel, avgMood, highRiskCount,
    diaryDays, totalDays, trend, bestDay, worstDay,
    taskAvgRate, lateNightCount,
  };

  // 流式生成 summary + 结构化 JSON（一次调用同时拿到 summary 文本和 insights/suggestions）
  if (window.electronAPI?.localModelCompleteStream) {
    const systemPrompt = `你是一位专业的心理健康顾问。根据用户数据生成心理健康报告。
只返回纯JSON，不要markdown代码块、不要额外说明。JSON结构：
{"summary":"一段总结，50字以内","insights":["洞察1","洞察2","洞察3"],"suggestions":["建议1","建议2"]}`;

    const userPrompt = `## 用户数据概览
- 时间范围：${periodLabel}
- 平均心情评分：${avgMood.toFixed(1)}/5
- 高风险情绪次数：${highRiskCount}
- 日记记录天数：${diaryDays}/${totalDays}
- 情绪趋势：${trend === 'improving' ? '改善中' : trend === 'declining' ? '下降中' : '稳定'}
- 任务平均完成率：${(taskAvgRate * 100).toFixed(0)}%
- 深夜活动天数：${lateNightCount}
${bestDay ? `- 最佳状态日：${bestDay}` : ''}
${worstDay ? `- 最低状态日：${worstDay}` : ''}

## 示例
{"summary":"本周状态平稳，情绪偶有波动但整体可控。","insights":["日记记录率71%，保持了较好的自我觉察习惯","任务完成率65%，还有提升空间"],"suggestions":["继续保持每日日记记录","尝试将大任务拆分为小步骤"]}

现在请根据上述数据生成报告：`;

    return new Promise<AIReport>((resolve) => {
      let fullText = '';
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(generateWithRules(reportData));
        }
      }, 60000);

      // 简易 summary 流式：从 JSON 文本中提取 "summary" 字段值的前缀逐字推送
      // 因 JSON 结构化输出难以精确逐字定位 summary，这里改为：
      // 流式累积完整文本，同时若检测到 "summary":" 开头则把后续字符（直到下一个未转义引号）逐字推送给 onSummaryChunk
      let inSummary = false;
      let summaryDone = false;

      const cleanup = window.electronAPI!.localModelCompleteStream(
        userPrompt,
        (data: any) => {
          if (settled) return;
          if (data.error) {
            settled = true;
            clearTimeout(timeout);
            resolve(generateWithRules(reportData));
            return;
          }
          if (data.done) {
            settled = true;
            clearTimeout(timeout);
            // 解析完整 JSON
            let raw = fullText.trim();
            raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) { resolve(generateWithRules(reportData)); return; }
            let parsed: any;
            try { parsed = JSON.parse(jsonMatch[0]); }
            catch {
              const cleaned = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');
              try { parsed = JSON.parse(cleaned); }
              catch { resolve(generateWithRules(reportData)); return; }
            }
            if (!parsed.summary || !Array.isArray(parsed.insights) || !Array.isArray(parsed.suggestions)) {
              resolve(generateWithRules(reportData));
              return;
            }
            resolve({
              period: `${startDate} ~ ${endDate}`,
              summary: String(parsed.summary).slice(0, 100),
              insights: parsed.insights.filter((s: any) => typeof s === 'string').slice(0, 5),
              suggestions: parsed.suggestions.filter((s: any) => typeof s === 'string').slice(0, 3),
              highlights: { bestDay, worstDay, trend },
              method: 'ai',
            });
            return;
          }
          // 流式 token 累积 + summary 逐字推送
          const token = data.token || '';
          fullText += token;
          if (!summaryDone && onSummaryChunk) {
            for (const ch of token) {
              if (!inSummary) {
                // 检测是否进入 summary 字段（简单状态机）
                if (fullText.endsWith('"summary":"')) {
                  inSummary = true;
                }
              } else {
                if (ch === '"' && !fullText.endsWith('\\"')) {
                  inSummary = false;
                  summaryDone = true;
                } else {
                  onSummaryChunk(ch);
                }
              }
            }
          }
        },
        { systemPrompt, temperature: 0.6, maxTokens: 1024 }
      );
      void cleanup;
    });
  }

  // 无流式 IPC 时回退到非流式
  const aiReport = await generateWithAI(reportData);
  if (aiReport) {
    // 非流式也把 summary 一次性推送，保持 UI 一致
    if (onSummaryChunk) onSummaryChunk(aiReport.summary);
    return aiReport;
  }
  return generateWithRules(reportData);
}
