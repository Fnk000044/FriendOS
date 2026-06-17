import { db } from '../db';
import { formatLocalDate } from './date';
import type { DailyRecord } from '../db/models';

export interface ReportData {
  dateRange: [string, string];
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  diaryDays: number;
  avgMood: number | null;
  habitsCompletionRate: number;
  totalWordCount: number;
  chartData: {
    date: string;
    tasksCompleted: number;
    tasksTotal: number;
    mood: number | null;
    habitsRate: number;
  }[];
}

export async function generateReport(startDate: string, endDate: string): Promise<ReportData> {
  const records = await db.dailyRecords
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();

  // Create a map for quick lookup
  const recordMap = new Map(records.map((r) => [r.date, r]));

  // Build chart data for each day in range (解析为本地时间避免 UTC 偏移)
  const chartData: ReportData['chartData'] = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const end = new Date(ey, em - 1, ed);

  while (current <= end) {
    const dateStr = formatLocalDate(current);
    const record = recordMap.get(dateStr);
    chartData.push({
      date: dateStr,
      tasksCompleted: record?.tasksCompleted || 0,
      tasksTotal: record?.tasksTotal || 0,
      mood: record?.moodAvg || null,
      habitsRate: record?.habitsCompletionRate || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  const totalTasks = chartData.reduce((sum, d) => sum + d.tasksTotal, 0);
  const completedTasks = chartData.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const diaryDays = chartData.filter((d) => {
    const record = recordMap.get(d.date);
    return record?.diaryWritten;
  }).length;

  const moodValues = chartData.map((d) => d.mood).filter((m): m is number => m !== null);
  const avgMood = moodValues.length > 0
    ? Math.round((moodValues.reduce((a, b) => a + b, 0) / moodValues.length) * 10) / 10
    : null;

  // 计算习惯完成率：包括完成率为 0 的天数（只要有习惯定义）
  const habitsRateValues = chartData.filter((d) => d.habitsRate >= 0);
  const habitsCompletionRate = habitsRateValues.length > 0
    ? habitsRateValues.reduce((sum, d) => sum + d.habitsRate, 0) / habitsRateValues.length
    : 0;

  const totalWordCount = records.reduce((sum, r) => sum + r.wordCount, 0);

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
  };
}
