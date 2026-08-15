import { db } from '../../db';
import { getEarlyWarning, type EarlyWarningResult } from './EarlyWarningService';
import { getToday, getNow, getDaysAgo } from '../../utils/date';

/**
 * DailyCheckScheduler — 每日健康检查调度器
 *
 * 把已有的 EarlyWarningService / RiskScoringEngine 从"被动查看"变为"主动推送"。
 * 触发时机：应用启动 + 每天 21:00（setInterval + visibilitychange 补偿）。
 * 执行链：getEarlyWarning() + riskCalculate() + 行为洞察 → 按分级决策推送。
 *
 * 分级（参见比赛增强计划 2.3）：
 * - attention 关注：风险分 26-50 + 趋势降 → Dashboard 卡片，静默
 * - reminder 提醒：51-75 或连续 3 天低落 → toast + 建议干预 + "和知己聊聊"
 * - warning 警告：76+ 或 EarlyWarning 预计 7 天内触临界 → 模态 + 推荐预约/评估 + 跳对话
 * - crisis 危机：crisis 关键词 / 91+ → 危机干预弹窗（已有，由危机联动处理）
 */

const API = typeof window !== 'undefined' ? window.electronAPI : undefined;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 每小时检查一次"是否到 21:00"
const DAILY_CHECK_HOUR = 21;

export type RiskAlertLevel = 'attention' | 'reminder' | 'warning' | 'crisis';

export interface RiskAlert {
  level: RiskAlertLevel;
  title: string;
  body: string;
  action: string;       // 跳转目标
  signals: string[];    // 触发信号（供 RiskBanner 展示）
  riskScore?: number;
  daysToCritical?: number | null;
}

export interface DailyCheckResult {
  earlyWarning: EarlyWarningResult | null;
  riskScore: number | null;
  riskLevel: string | null;
  alert: RiskAlert | null;
  insights: BehaviorInsight[];
  checkedAt: string;
}

export interface BehaviorInsight {
  type: 'diary_skip' | 'late_night' | 'task_decline' | 'mood_below_baseline' | 'habit_break' | 'positive';
  text: string;
  severity: 'info' | 'warn' | 'danger';
}

/**
 * 生成自然语言行为洞察
 */
export async function generateInsights(): Promise<BehaviorInsight[]> {
  const insights: BehaviorInsight[] = [];
  const since7 = getDaysAgo(7);
  const today = getToday();

  try {
    // 连续未写日记
    const diaries = await db.diaries.where('date').aboveOrEqual(getDaysAgo(14)).toArray();
    const diaryDates = new Set(diaries.map(d => d.date));
    let skipDays = 0;
    for (let i = 0; i < 14; i++) {
      const d = getDaysAgo(i);
      if (!diaryDates.has(d)) skipDays++;
      else break;
    }
    if (skipDays >= 3) {
      insights.push({
        type: 'diary_skip',
        text: `已连续 ${skipDays} 天没有写日记了`,
        severity: skipDays >= 7 ? 'danger' : 'warn',
      });
    }

    // 深夜活跃
    const behaviors = await db.behaviorRecords.where('date').aboveOrEqual(since7).toArray();
    const lateNights = behaviors.filter(b => b.activeHours?.some(h => h >= 0 && h < 5));
    if (lateNights.length >= 2) {
      insights.push({
        type: 'late_night',
        text: `近 7 天有 ${lateNights.length} 次深夜活跃`,
        severity: lateNights.length >= 4 ? 'warn' : 'info',
      });
    }

    // 任务完成率下降
    const tasks7 = await db.tasks.where('scheduledDate').aboveOrEqual(since7).toArray();
    const tasksPrev7Raw = await db.tasks.where('scheduledDate').aboveOrEqual(getDaysAgo(14)).toArray();
    const tasksPrev7 = tasksPrev7Raw.filter((t: { scheduledDate: string }) => t.scheduledDate < since7);
    if (tasks7.length > 0 && tasksPrev7.length > 0) {
      const rate7 = tasks7.filter((t: { status: string }) => t.status === 'completed').length / tasks7.length;
      const ratePrev = tasksPrev7.filter((t: { status: string }) => t.status === 'completed').length / tasksPrev7.length;
      const drop = ratePrev - rate7;
      if (drop >= 0.2) {
        insights.push({
          type: 'task_decline',
          text: `本周任务完成率 ${Math.round(rate7 * 100)}%，比上周下降 ${Math.round(drop * 100)}%`,
          severity: drop >= 0.3 ? 'warn' : 'info',
        });
      }
    }

    // 习惯中断
    const habitLogs7 = await db.habitLogs.where('date').aboveOrEqual(since7).toArray();
    if (habitLogs7.length > 0) {
      const checkedRate = habitLogs7.filter(h => h.count > 0).length / habitLogs7.length;
      if (checkedRate < 0.4) {
        insights.push({
          type: 'habit_break',
          text: `本周习惯打卡率仅 ${Math.round(checkedRate * 100)}%`,
          severity: 'warn',
        });
      }
    }

    // 情绪低于基线
    const emotions = await db.emotionRecords.where('date').aboveOrEqual(since7).toArray();
    if (emotions.length >= 3) {
      const avgScore = emotions.reduce((s, e) => s + e.sentimentScore, 0) / emotions.length;
      if (avgScore < -0.2) {
        insights.push({
          type: 'mood_below_baseline',
          text: '情绪连续低于个人基线',
          severity: avgScore < -0.4 ? 'danger' : 'warn',
        });
      }
    }

    // 正面反馈：无异常时给鼓励
    if (insights.length === 0) {
      const allHabitsDone = habitLogs7.length > 0 && habitLogs7.every(h => h.count > 0);
      if (allHabitsDone) {
        insights.push({
          type: 'positive',
          text: '这周习惯打卡全勤，状态不错！',
          severity: 'info',
        });
      } else {
        insights.push({
          type: 'positive',
          text: '近期状态平稳，继续保持。',
          severity: 'info',
        });
      }
    }
  } catch (e) {
    console.error('[DailyCheckScheduler] generateInsights error:', e);
  }

  return insights;
}

/**
 * 执行一次完整健康检查
 */
export async function runDailyCheck(): Promise<DailyCheckResult> {
  const result: DailyCheckResult = {
    earlyWarning: null,
    riskScore: null,
    riskLevel: null,
    alert: null,
    insights: [],
    checkedAt: getNow(),
  };

  try {
    // 1. 早期预警
    result.earlyWarning = await getEarlyWarning();

    // 2. 风险评分（取最近 healthProfile 近似，避免重复跑 IPC）
    const hp = await db.healthProfiles.orderBy('date').reverse().first();
    if (hp) {
      result.riskScore = Math.round(100 - hp.emotionalHealthIndex);
      result.riskLevel = hp.riskLevel;
    }

    // 3. 行为洞察
    result.insights = await generateInsights();

    // 4. 决策预警等级
    result.alert = decideAlert(result);
  } catch (e) {
    console.error('[DailyCheckScheduler] runDailyCheck error:', e);
  }

  // 5. 推送通知（非 attention 级才推系统通知）
  if (result.alert && result.alert.level !== 'attention' && API) {
    try {
      await API.riskNotify({
        level: result.alert.level,
        title: result.alert.title,
        body: result.alert.body,
        action: result.alert.action,
      });
    } catch (e) {
      console.error('[DailyCheckScheduler] riskNotify error:', e);
    }
  }

  return result;
}

/**
 * 根据预警+风险分+洞察决策通知等级
 */
function decideAlert(result: DailyCheckResult): RiskAlert | null {
  const { earlyWarning, riskScore, riskLevel, insights } = result;

  // crisis 级：交给危机联动处理，这里不重复推
  if (riskLevel === 'critical' || (riskScore !== null && riskScore >= 91)) {
    return null;
  }

  // warning 级：76+ 或 EarlyWarning 预计 7 天内触临界
  if ((riskScore !== null && riskScore >= 76) || (earlyWarning?.daysToCritical !== null && earlyWarning !== null && earlyWarning.daysToCritical! <= 7 && earlyWarning.level === 'red')) {
    return {
      level: 'warning',
      title: '状态需要关注',
      body: '近期风险指标偏高，建议做一次量表评估或和知己聊聊。',
      action: '/chat',
      signals: earlyWarning?.signals || [],
      riskScore: riskScore ?? undefined,
      daysToCritical: earlyWarning?.daysToCritical,
    };
  }

  // reminder 级：51-75 或连续 3 天低落
  const consecutiveLow = insights.find(i => i.type === 'mood_below_baseline' && i.severity === 'danger');
  if ((riskScore !== null && riskScore >= 51) || consecutiveLow) {
    return {
      level: 'reminder',
      title: '最近是不是有些累？',
      body: '检测到情绪偏低，要不要和知己聊聊，或者试试呼吸练习？',
      action: '/chat',
      signals: earlyWarning?.signals || [],
      riskScore: riskScore ?? undefined,
    };
  }

  // attention 级：26-50 + 趋势降（静默，不推系统通知）
  if (riskScore !== null && riskScore >= 26 && earlyWarning && earlyWarning.nextRiskLevel !== 'low') {
    return {
      level: 'attention',
      title: '状态有小幅波动',
      body: '不着急，留意一下就好。',
      action: '/risk',
      signals: earlyWarning.signals,
      riskScore,
    };
  }

  return null;
}

// ── 调度器（定时触发）─────────────────────────────────────────

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let lastCheckDate = '';

// 检查结果缓存 + 订阅（修复审计 P1-2：此前调度器跑出的结果被 .catch(console.error)
// 丢弃，RiskBanner/BehaviorInsightCard 从启动起永远是空态。现在结果发布给所有订阅者。）
type DailyCheckListener = (result: DailyCheckResult) => void;
let latestResult: DailyCheckResult | null = null;
const listeners = new Set<DailyCheckListener>();

export function getLatestDailyCheck(): DailyCheckResult | null {
  return latestResult;
}

export function subscribeDailyCheck(listener: DailyCheckListener): () => void {
  listeners.add(listener);
  if (latestResult) {
    try { listener(latestResult); } catch { /* ignore */ }
  }
  return () => {
    listeners.delete(listener);
  };
}

function publishResult(result: DailyCheckResult) {
  latestResult = result;
  listeners.forEach((l) => {
    try { l(result); } catch { /* ignore */ }
  });
}

function runAndPublish() {
  runDailyCheck()
    .then(publishResult)
    .catch((e) => console.error('[DailyCheckScheduler] runDailyCheck failed:', e));
}

// 引用计数：RiskBanner 与 BehaviorInsightCard 各自挂载 useDailyCheck，
// 全部卸载后才真正停止调度器（修复"先卸载者停掉全局调度器"的隐患）。
let startCount = 0;

export function startScheduler() {
  startCount += 1;
  if (schedulerTimer) return;

  // 启动时立即跑一次（延迟 3s，避免阻塞首屏）
  setTimeout(() => {
    runAndPublish();
    lastCheckDate = getToday();
  }, 3000);

  // 每小时检查是否到 21:00
  schedulerTimer = setInterval(() => {
    const now = new Date();
    const today = getToday();
    if (now.getHours() >= DAILY_CHECK_HOUR && lastCheckDate !== today) {
      lastCheckDate = today;
      runAndPublish();
    }
  }, CHECK_INTERVAL_MS);

  // 页面重新可见时补偿（切后台错过 21:00 的情况）
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
}

export function stopScheduler() {
  startCount = Math.max(0, startCount - 1);
  if (startCount > 0) return;
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    const now = new Date();
    const today = getToday();
    if (now.getHours() >= DAILY_CHECK_HOUR && lastCheckDate !== today) {
      lastCheckDate = today;
      runAndPublish();
    }
  }
}
