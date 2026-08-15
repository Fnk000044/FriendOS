import { db } from '../db';
import { formatLocalDate } from './date';
import type { DailyRecord } from '../db/models';

export interface DayChartData {
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  mood: number | null;
  habitsRate: number;
  /** 当日日记字数（多维度交叉分析用） */
  diaryWordCount: number;
  /** 当日情绪分数（来自日记情感分析，0-1，越高越积极） */
  sentimentScore: number | null;
  /** 当日习惯打卡数 */
  habitsChecked: number;
  /** 当日习惯总数 */
  habitsTotal: number;
}

export interface ReportData {
  dateRange: [string, string];
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  diaryDays: number;
  avgMood: number | null;
  habitsCompletionRate: number;
  totalWordCount: number;
  chartData: DayChartData[];
  /** 多维度相关性：心情与任务完成率、习惯完成率的相关系数 (-1..1) */
  correlation: {
    moodVsTask: number | null;
    moodVsHabit: number | null;
    taskVsHabit: number | null;
  };
}

/** 皮尔逊相关系数；样本不足或方差为 0 返回 null */
function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? null : num / denom;
}

export async function generateReport(startDate: string, endDate: string): Promise<ReportData> {
  // 并发查 dailyRecords 缓存 + 原表（tasks/diaries/habitLogs/habits/emotionRecords），
  // 做多维度综合分析。date 是现成关联键。
  const [records, tasks, diaries, habitLogs, habits, emotionRecords] = await Promise.all([
    db.dailyRecords.where('date').between(startDate, endDate, true, true).toArray(),
    db.tasks.where('scheduledDate').between(startDate, endDate, true, true).toArray(),
    db.diaries.where('date').between(startDate, endDate, true, true).toArray(),
    db.habitLogs.where('date').between(startDate, endDate, true, true).toArray(),
    db.habits.filter((h) => !h.archived).toArray(),
    db.emotionRecords.where('date').between(startDate, endDate, true, true).toArray(),
  ]);

  const recordMap = new Map(records.map((r) => [r.date, r]));
  const diaryMap = new Map(diaries.map((d) => [d.date, d]));
  const tasksByDate = new Map<string, typeof tasks>();
  for (const t of tasks) {
    const arr = tasksByDate.get(t.scheduledDate) || [];
    arr.push(t);
    tasksByDate.set(t.scheduledDate, arr);
  }
  const habitLogsByDate = new Map<string, typeof habitLogs>();
  for (const l of habitLogs) {
    const arr = habitLogsByDate.get(l.date) || [];
    arr.push(l);
    habitLogsByDate.set(l.date, arr);
  }
  // 当日情绪均值（取 source='diary' 的记录，sentimentScore 0-1 越高越积极）
  const emotionByDate = new Map<string, number>();
  for (const e of emotionRecords) {
    if (e.source !== 'diary') continue;
    const prev = emotionByDate.get(e.date);
    if (prev === undefined) {
      emotionByDate.set(e.date, e.sentimentScore);
    } else {
      // 简单滚动均值
      emotionByDate.set(e.date, (prev + e.sentimentScore) / 2);
    }
  }

  const habitsTotal = habits.length;

  // Build chart data for each day in range (解析为本地时间避免 UTC 偏移)
  const chartData: DayChartData[] = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const end = new Date(ey, em - 1, ed);

  while (current <= end) {
    const dateStr = formatLocalDate(current);
    const record = recordMap.get(dateStr);
    const dayTasks = tasksByDate.get(dateStr) || [];
    const dayLogs = habitLogsByDate.get(dateStr) || [];
    const diary = diaryMap.get(dateStr);
    const tasksCompleted = dayTasks.filter((t) => t.status === 'completed').length;
    const tasksTotal = dayTasks.length;
    const habitsChecked = new Set(dayLogs.map((l) => l.habitId)).size;
    const diaryWordCount = diary?.content?.length || record?.wordCount || 0;
    chartData.push({
      date: dateStr,
      tasksCompleted,
      tasksTotal,
      mood: diary?.mood ?? record?.moodAvg ?? null,
      // 习惯率：当天有打卡记录才算数（>0），无记录为 -1（不参与统计），
      // 修复"0 打卡天拉低周期平均 / 环图今日显示 0%"的数据不一致（PRD v3 P0-5）
      habitsRate: habitsTotal > 0 && dayLogs.length > 0 ? habitsChecked / habitsTotal : -1,
      diaryWordCount,
      sentimentScore: emotionByDate.get(dateStr) ?? null,
      habitsChecked,
      habitsTotal,
    });
    current.setDate(current.getDate() + 1);
  }

  const totalTasks = chartData.reduce((sum, d) => sum + d.tasksTotal, 0);
  const completedTasks = chartData.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const diaryDays = chartData.filter((d) => d.diaryWordCount > 0).length;

  const moodValues = chartData.map((d) => d.mood).filter((m): m is number => m !== null);
  const avgMood = moodValues.length > 0
    ? Math.round((moodValues.reduce((a, b) => a + b, 0) / moodValues.length) * 10) / 10
    : null;

  const habitsRateValues = chartData.filter((d) => d.habitsRate > 0);
  const habitsCompletionRate = habitsRateValues.length > 0
    ? habitsRateValues.reduce((sum, d) => sum + d.habitsRate, 0) / habitsRateValues.length
    : 0;

  const totalWordCount = chartData.reduce((sum, d) => sum + d.diaryWordCount, 0);

  // 多维度相关性：取同时有 mood 和对应维度的天
  const moodTaskDays = chartData.filter((d) => d.mood !== null && d.tasksTotal > 0);
  const moodHabitDays = chartData.filter((d) => d.mood !== null && d.habitsTotal > 0);
  const taskHabitDays = chartData.filter((d) => d.tasksTotal > 0 && d.habitsTotal > 0);
  const correlation = {
    moodVsTask: pearson(
      moodTaskDays.map((d) => d.mood!),
      moodTaskDays.map((d) => d.tasksTotal > 0 ? d.tasksCompleted / d.tasksTotal : 0),
    ),
    moodVsHabit: pearson(
      moodHabitDays.map((d) => d.mood!),
      moodHabitDays.map((d) => d.habitsRate),
    ),
    taskVsHabit: pearson(
      taskHabitDays.map((d) => d.tasksCompleted / d.tasksTotal),
      taskHabitDays.map((d) => d.habitsRate),
    ),
  };

  return {
    dateRange: [startDate, endDate],
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    diaryDays,
    avgMood,
    habitsCompletionRate: Math.round(habitsCompletionRate * 100),
    totalWordCount,
    chartData,
    correlation,
  };
}
