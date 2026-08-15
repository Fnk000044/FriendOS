import { db } from '../../db';
import { getDaysAgo } from '../../utils/date';

/**
 * EffectivenessService — 干预效果统计
 *
 * 聚合 therapyRecords（moodBefore/moodAfter），回答"这些工具有没有用"：
 * - 各干预类型平均提升分（after - before）
 * - 有效率（after > before 的次数 / 总次数）
 * - 个人最有效干预 TOP 1
 * - 最近 7 天 vs 历史对比
 *
 * 数据来源：therapyRecords.type ∈ thought_record | breathing | mindfulness
 */

export type InterventionType = 'thought_record' | 'breathing' | 'mindfulness';

export interface InterventionStat {
  type: InterventionType;
  count: number;
  avgBefore: number;
  avgAfter: number;
  avgImprovement: number;   // after - before（正=改善）
  effectivenessRate: number; // after > before 的比例 0-1
  bestDay?: string;          // 提升最大那天
  bestImprovement?: number;
}

export interface EffectivenessReport {
  totalSessions: number;
  byType: InterventionStat[];
  topIntervention: InterventionStat | null;
  recent7d: {
    count: number;
    avgImprovement: number;
    effectivenessRate: number;
  };
  history: {
    count: number;
    avgImprovement: number;
    effectivenessRate: number;
  };
  trend: 'improving' | 'stable' | 'declining'; // 近7天 vs 历史
}

const TYPE_LABELS: Record<InterventionType, string> = {
  thought_record: 'CBT 思维记录',
  breathing: '呼吸练习',
  mindfulness: '正念冥想',
};

export function getInterventionLabel(type: InterventionType): string {
  return TYPE_LABELS[type] || type;
}

/**
 * 计算单个干预类型的统计
 */
async function computeStat(type: InterventionType, since?: string): Promise<InterventionStat | null> {
  let records = await db.therapyRecords.where('type').equals(type).toArray();
  if (since) {
    records = records.filter(r => r.date >= since);
  }
  if (records.length === 0) return null;

  const valid = records.filter(r => typeof r.moodBefore === 'number' && typeof r.moodAfter === 'number');
  if (valid.length === 0) return null;

  const count = valid.length;
  const avgBefore = valid.reduce((s, r) => s + (r.moodBefore as number), 0) / count;
  const avgAfter = valid.reduce((s, r) => s + (r.moodAfter as number), 0) / count;
  const improvements = valid.map(r => (r.moodAfter as number) - (r.moodBefore as number));
  const avgImprovement = improvements.reduce((s, v) => s + v, 0) / count;
  const effectiveCount = improvements.filter(v => v > 0).length;
  const effectivenessRate = effectiveCount / count;

  // 最佳记录
  let bestDay: string | undefined;
  let bestImprovement = -Infinity;
  for (const r of valid) {
    const imp = (r.moodAfter as number) - (r.moodBefore as number);
    if (imp > bestImprovement) {
      bestImprovement = imp;
      bestDay = r.date;
    }
  }

  return {
    type,
    count,
    avgBefore: round2(avgBefore),
    avgAfter: round2(avgAfter),
    avgImprovement: round2(avgImprovement),
    effectivenessRate: round2(effectivenessRate),
    bestDay,
    bestImprovement: round2(bestImprovement),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 生成完整效果报告
 */
export async function generateEffectivenessReport(): Promise<EffectivenessReport> {
  const types: InterventionType[] = ['thought_record', 'breathing', 'mindfulness'];

  const [thoughtStat, breathingStat, mindfulnessStat] = await Promise.all([
    computeStat('thought_record'),
    computeStat('breathing'),
    computeStat('mindfulness'),
  ]);

  const byType = [thoughtStat, breathingStat, mindfulnessStat].filter((s): s is InterventionStat => s !== null);
  const totalSessions = byType.reduce((s, st) => s + st.count, 0);

  // 个人最有效：按有效率排序，相同则按平均提升
  const topIntervention = byType.length > 0
    ? [...byType].sort((a, b) => {
        if (b.effectivenessRate !== a.effectivenessRate) return b.effectivenessRate - a.effectivenessRate;
        return b.avgImprovement - a.avgImprovement;
      })[0]
    : null;

  // 近 7 天 vs 历史
  const since7 = getDaysAgo(7);
  const recentStats = await Promise.all(types.map(t => computeStat(t, since7)));
  const recent7d = aggregateRecent(recentStats);

  const historyTotal = byType.reduce((s, st) => s + st.count, 0);
  const historyImprovement = byType.reduce((s, st) => s + st.avgImprovement * st.count, 0) / (historyTotal || 1);
  const historyEffective = byType.reduce((s, st) => s + st.effectivenessRate * st.count, 0) / (historyTotal || 1);

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recent7d.count >= 2 && historyTotal >= 3) {
    const diff = recent7d.avgImprovement - historyImprovement;
    if (diff > 0.3) trend = 'improving';
    else if (diff < -0.3) trend = 'declining';
  }

  return {
    totalSessions,
    byType,
    topIntervention,
    recent7d,
    history: {
      count: historyTotal,
      avgImprovement: round2(historyImprovement),
      effectivenessRate: round2(historyEffective),
    },
    trend,
  };
}

function aggregateRecent(stats: (InterventionStat | null)[]): { count: number; avgImprovement: number; effectivenessRate: number } {
  const valid = stats.filter((s): s is InterventionStat => s !== null);
  if (valid.length === 0) return { count: 0, avgImprovement: 0, effectivenessRate: 0 };
  const count = valid.reduce((s, st) => s + st.count, 0);
  const avgImprovement = valid.reduce((s, st) => s + st.avgImprovement * st.count, 0) / (count || 1);
  const effectivenessRate = valid.reduce((s, st) => s + st.effectivenessRate * st.count, 0) / (count || 1);
  return { count, avgImprovement: round2(avgImprovement), effectivenessRate: round2(effectivenessRate) };
}

/**
 * 获取个人最有效干预类型（供推荐服务与对话上下文使用）
 */
export async function getBestIntervention(): Promise<InterventionStat | null> {
  const report = await generateEffectivenessReport();
  // 至少 3 次记录才认为可信
  if (report.topIntervention && report.topIntervention.count >= 3) {
    return report.topIntervention;
  }
  return null;
}
