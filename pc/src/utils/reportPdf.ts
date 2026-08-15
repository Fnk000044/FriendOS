import type { ReportData } from './reports';
import type { AIReport } from '../services/ai/ReportAIService';

/**
 * reportPdf.ts — 心理报告 PDF 生成（渲染层构建 HTML，主进程渲染为 A4 PDF）
 *
 * 所有用户内容（AI 报告文本、日记数据等）均经 escapeHtml 转义后嵌入，
 * HTML 通过 data: URL 加载进隐藏窗口，不执行任何脚本、不加载外部资源。
 */

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ReportPdfInput {
  range: [string, string];
  report: ReportData;
  aiReport: AIReport | null;
  dimensions: { mood: number; stress: number; energy: number; social: number; sleep: number; selfCare: number };
  lang: 'zh-CN' | 'en';
}

const DIM_LABELS_ZH: Record<keyof ReportPdfInput['dimensions'], string> = {
  mood: '情绪', stress: '压力', energy: '精力', social: '社交', sleep: '睡眠', selfCare: '自我关怀',
};
const DIM_LABELS_EN: Record<keyof ReportPdfInput['dimensions'], string> = {
  mood: 'Mood', stress: 'Stress', energy: 'Energy', social: 'Social', sleep: 'Sleep', selfCare: 'Self-care',
};

function clampDim(v: number): number {
  const n = Number.isFinite(v) ? Math.round(v) : 0;
  return Math.min(100, Math.max(0, n));
}

function moodStars(mood: number | null): string {
  if (mood == null) return '—';
  return '★'.repeat(Math.min(5, Math.max(1, Math.round(mood)))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(1, Math.round(mood)))));
}

export function buildReportHtml({ range, report, aiReport, dimensions, lang }: ReportPdfInput): string {
  const zh = lang === 'zh-CN';
  const L = {
    title: zh ? '心理健康报告' : 'Mental Health Report',
    app: '知己 FriendOS',
    rangeLabel: zh ? '统计周期' : 'Period',
    generated: zh ? '生成时间' : 'Generated',
    taskRate: zh ? '任务完成率' : 'Task completion',
    tasksDone: zh ? '完成任务' : 'Tasks completed',
    diaryDays: zh ? '日记天数' : 'Diary days',
    moodAvg: zh ? '平均心情' : 'Avg mood',
    habitRate: zh ? '习惯打卡率' : 'Habit check-in',
    wordCount: zh ? '总字数' : 'Words written',
    aiSection: zh ? 'AI 解读' : 'AI insights',
    insights: zh ? '洞察' : 'Insights',
    suggestions: zh ? '建议' : 'Suggestions',
    dims: zh ? '健康维度画像' : 'Health dimensions',
    trend: zh ? '每日记录' : 'Daily log',
    thDate: zh ? '日期' : 'Date',
    thMood: zh ? '心情' : 'Mood',
    thTask: zh ? '任务' : 'Tasks',
    thHabit: zh ? '习惯' : 'Habits',
    corr: zh ? '相关性分析' : 'Correlations',
    corrMoodTask: zh ? '心情 ↔ 任务完成率' : 'Mood ↔ Task completion',
    corrMoodHabit: zh ? '心情 ↔ 习惯完成率' : 'Mood ↔ Habit check-in',
    corrTaskHabit: zh ? '任务 ↔ 习惯' : 'Task ↔ Habit',
    insufficient: zh ? '样本不足' : 'Insufficient data',
    footer1: zh
      ? '本报告由知己 FriendOS 基于本地数据自动生成，统计结论不构成医疗诊断。'
      : 'This report was generated locally by ZhiJi FriendOS. Statistical conclusions are not medical diagnoses.',
    footer2: zh ? '心理援助热线：12356（全国统一）· 400-161-9995（24 小时）' : 'Support hotlines: 12356 (national) · 400-161-9995 (24h)',
    rule: zh ? '（规则引擎）' : '(rule engine)',
    ai: zh ? '（AI 解读）' : '(AI insights)',
  };

  const dimLabels = zh ? DIM_LABELS_ZH : DIM_LABELS_EN;
  const dimRows = (Object.keys(dimLabels) as Array<keyof ReportPdfInput['dimensions']>)
    .map((k) => {
      const v = clampDim(dimensions[k]);
      return `
      <div class="dim-row">
        <div class="dim-label">${escapeHtml(dimLabels[k])}</div>
        <div class="dim-bar"><div class="dim-fill" style="width:${v}%"></div></div>
        <div class="dim-val">${v}</div>
      </div>`;
    })
    .join('');

  const tableRows = report.chartData
    .map((d) => `
      <tr>
        <td>${escapeHtml(d.date)}</td>
        <td class="center">${moodStars(d.mood)}</td>
        <td class="center">${d.tasksCompleted}/${d.tasksTotal}</td>
        <td class="center">${d.habitsRate >= 0 ? `${Math.round(d.habitsRate * 100)}%` : '—'}</td>
      </tr>`)
    .join('');

  const corr = report.correlation;
  const corrRows = [
    { label: L.corrMoodTask, r: corr.moodVsTask },
    { label: L.corrMoodHabit, r: corr.moodVsHabit },
    { label: L.corrTaskHabit, r: corr.taskVsHabit },
  ]
    .map(({ label, r }) => `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td class="center mono">${r === null ? escapeHtml(L.insufficient) : `${r >= 0 ? '+' : ''}${r.toFixed(2)}`}</td>
      </tr>`)
    .join('');

  const aiBlock = aiReport
    ? `
    <div class="section">
      <h2>${escapeHtml(L.aiSection)} <span class="badge">${aiReport.method === 'ai' ? escapeHtml(L.ai) : escapeHtml(L.rule)}</span></h2>
      <p class="summary">${escapeHtml(aiReport.summary)}</p>
      ${aiReport.insights.length ? `<h3>${escapeHtml(L.insights)}</h3><ul>${aiReport.insights.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
      ${aiReport.suggestions.length ? `<h3>${escapeHtml(L.suggestions)}</h3><ul>${aiReport.suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
    </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="${zh ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(L.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif; color: #1e293b; font-size: 12px; line-height: 1.6; padding: 32px; }
  .header { background: linear-gradient(135deg, #0d9488, #6366f1); color: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; }
  .header h1 { font-size: 20px; }
  .header .meta { opacity: .85; font-size: 11px; margin-top: 6px; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .stat { flex: 1 1 30%; min-width: 130px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; }
  .stat .label { color: #64748b; font-size: 10px; }
  .stat .value { font-size: 18px; font-weight: 700; color: #0f172a; }
  .stat .value small { font-size: 11px; color: #64748b; font-weight: 400; }
  .section { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
  .section h2 { font-size: 14px; margin-bottom: 8px; color: #0f172a; }
  .section h3 { font-size: 12px; margin: 8px 0 4px; color: #334155; }
  .summary { background: #f0fdfa; border-left: 3px solid #0d9488; padding: 8px 10px; border-radius: 6px; }
  .badge { font-size: 10px; color: #64748b; font-weight: 400; }
  ul { padding-left: 18px; } li { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
  th { background: #f8fafc; }
  .center { text-align: center; }
  .mono { font-family: Consolas, monospace; }
  .dim-row { display: flex; align-items: center; gap: 8px; margin: 5px 0; }
  .dim-label { width: 64px; color: #334155; flex-shrink: 0; }
  .dim-bar { flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
  .dim-fill { height: 100%; background: linear-gradient(90deg, #0d9488, #6366f1); border-radius: 5px; }
  .dim-val { width: 28px; text-align: right; color: #64748b; flex-shrink: 0; }
  .footer { margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #94a3b8; font-size: 10px; }
  .footer .hotline { color: #ef4444; font-weight: 600; }
</style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(L.title)}</h1>
    <div class="meta">${escapeHtml(L.app)} · ${escapeHtml(L.rangeLabel)}: ${escapeHtml(range[0])} ~ ${escapeHtml(range[1])} · ${escapeHtml(L.generated)}: ${escapeHtml(new Date().toLocaleString())}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="label">${escapeHtml(L.taskRate)}</div><div class="value">${report.completionRate}<small>%</small></div></div>
    <div class="stat"><div class="label">${escapeHtml(L.tasksDone)}</div><div class="value">${report.completedTasks}<small> / ${report.totalTasks}</small></div></div>
    <div class="stat"><div class="label">${escapeHtml(L.diaryDays)}</div><div class="value">${report.diaryDays}</div></div>
    <div class="stat"><div class="label">${escapeHtml(L.moodAvg)}</div><div class="value">${report.avgMood ?? '—'}<small>${report.avgMood != null ? ' / 5' : ''}</small></div></div>
    <div class="stat"><div class="label">${escapeHtml(L.habitRate)}</div><div class="value">${report.habitsCompletionRate}<small>%</small></div></div>
    <div class="stat"><div class="label">${escapeHtml(L.wordCount)}</div><div class="value">${report.totalWordCount}</div></div>
  </div>

  ${aiBlock}

  <div class="section">
    <h2>${escapeHtml(L.dims)}</h2>
    ${dimRows}
  </div>

  <div class="section">
    <h2>${escapeHtml(L.trend)}</h2>
    <table>
      <thead><tr><th>${escapeHtml(L.thDate)}</th><th class="center">${escapeHtml(L.thMood)}</th><th class="center">${escapeHtml(L.thTask)}</th><th class="center">${escapeHtml(L.thHabit)}</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>${escapeHtml(L.corr)}</h2>
    <table>
      <tbody>${corrRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <p>${escapeHtml(L.footer1)}</p>
    <p class="hotline">${escapeHtml(L.footer2)}</p>
  </div>
</body>
</html>`;
}
