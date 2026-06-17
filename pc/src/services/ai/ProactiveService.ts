import { db } from '../../db';
import type { BehaviorRecord, EmotionRecord } from '../../db/models';
import { getToday, getDaysAgo } from '../../utils/date';

export interface ProactiveTrigger {
  type: 'low_mood' | 'no_diary' | 'low_productivity' | 'habit_break' | 'high_risk' | 'late_night';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: string;
  showCrisisHotline?: boolean; // 是否显示危机热线
}

// 参考：临床外联指南
// 高风险使用正式关怀语气，低风险使用轻松语气
const PROACTIVE_MESSAGES: Record<string, string[]> = {
  low_mood: [
    '我注意到你最近几天心情不太好，想聊聊吗？',
    '最近似乎有些低落，有什么我可以帮你的吗？',
    '感觉你最近情绪不太高，要不要一起做些开心的事？',
  ],
  no_diary: [
    '好几天没见你写日记了，最近怎么样？',
    '想你了~最近有什么想分享的吗？',
    '好久没聊聊了，最近过得怎么样？',
  ],
  low_productivity: [
    '最近任务完成得比较少，是不是遇到什么困难了？',
    '感觉你最近有些疲惫，要不要聊聊？',
    '任务好像堆积了不少，需要帮你梳理一下吗？',
  ],
  habit_break: [
    '你的习惯打卡中断了几天，还好吗？',
    '重新开始总是最难的，需要我帮你制定一个小目标吗？',
    '习惯中断很正常，别太自责，我们一起重新开始？',
  ],
  high_risk: [
    // 高风险使用正式、关怀的语气
    '我注意到你最近的状态可能需要关注。如果你正在经历困难，请记住寻求帮助是勇敢的表现。',
    '你的身心健康很重要。如果你需要倾诉，我随时都在。如果情况严重，请考虑联系专业人士。',
    '我担心你最近的状态。请记住，你并不孤单，有人愿意帮助你。',
  ],
  late_night: [
    '这么晚还没睡吗？早点休息对身心都好。',
    '夜深了，有什么心事睡不着吗？',
    '熬夜对身体不好，明天再想这些事情吧。',
  ],
};

function getRandomMessage(type: string): string {
  const messages = PROACTIVE_MESSAGES[type];
  if (!messages || messages.length === 0) return '';
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Check if proactive care should be triggered
 * Analyzes recent behavior and emotion data
 */
export async function checkProactiveTriggers(): Promise<ProactiveTrigger | null> {
  try {
    // Get recent behavior records (last 7 days)
    const dateStr = getDaysAgo(7);

    const behaviorRecords = await db.behaviorRecords
      .where('date')
      .aboveOrEqual(dateStr)
      .sortBy('date');

    // Get recent emotion records
    const emotionRecords = await db.emotionRecords
      .where('date')
      .aboveOrEqual(dateStr)
      .sortBy('date');

    // Check for high risk emotions
    // 参考：临床外联指南 - 高风险需要立即显示危机热线
    const highRiskEmotions = emotionRecords.filter(
      e => e.riskLevel === 'high' || e.riskLevel === 'critical'
    );
    if (highRiskEmotions.length > 0) {
      return {
        type: 'high_risk',
        severity: 'high',
        message: getRandomMessage('high_risk'),
        details: `检测到 ${highRiskEmotions.length} 次高风险情感记录`,
        showCrisisHotline: true, // 高风险自动显示危机热线
      };
    }

    // Check for consecutive low moods
    const recentMoods = behaviorRecords
      .filter(r => r.moodRating !== null)
      .map(r => r.moodRating!);

    if (recentMoods.length >= 3) {
      const last3 = recentMoods.slice(-3);
      if (last3.every(m => m <= 2)) {
        return {
          type: 'low_mood',
          severity: 'high',
          message: getRandomMessage('low_mood'),
          details: `连续 ${last3.length} 天心情评分 ≤ 2`,
        };
      }
      if (last3.filter(m => m <= 2).length >= 2) {
        return {
          type: 'low_mood',
          severity: 'medium',
          message: getRandomMessage('low_mood'),
          details: `最近 3 天中有 ${last3.filter(m => m <= 2).length} 天心情评分 ≤ 2`,
        };
      }
    }

    // Check for consecutive days without diary
    const recentBehaviors = behaviorRecords.slice(-5);
    let noDiaryCount = 0;
    for (let i = recentBehaviors.length - 1; i >= 0; i--) {
      if (!recentBehaviors[i].diaryWritten) {
        noDiaryCount++;
      } else {
        break;
      }
    }

    if (noDiaryCount >= 3) {
      return {
        type: 'no_diary',
        severity: 'medium',
        message: getRandomMessage('no_diary'),
        details: `连续 ${noDiaryCount} 天未写日记`,
      };
    }

    // Check for low task completion
    const recentTaskRates = behaviorRecords
      .filter(r => r.tasksTotal > 0)
      .map(r => r.tasksCompleted / r.tasksTotal);

    if (recentTaskRates.length >= 3) {
      const avg = recentTaskRates.reduce((a, b) => a + b, 0) / recentTaskRates.length;
      if (avg < 0.3) {
        return {
          type: 'low_productivity',
          severity: 'medium',
          message: getRandomMessage('low_productivity'),
          details: `最近任务完成率平均 ${Math.round(avg * 100)}%`,
        };
      }
    }

    // Check for habit breakdown
    const recentHabitRates = behaviorRecords
      .filter(r => r.habitsTotal > 0)
      .map(r => r.habitsChecked / r.habitsTotal);

    if (recentHabitRates.length >= 3) {
      const avg = recentHabitRates.reduce((a, b) => a + b, 0) / recentHabitRates.length;
      if (avg < 0.3) {
        return {
          type: 'habit_break',
          severity: 'low',
          message: getRandomMessage('habit_break'),
          details: `最近习惯完成率平均 ${Math.round(avg * 100)}%`,
        };
      }
    }

    // Check for late night activity
    const recentActiveHours = behaviorRecords.flatMap(r => r.activeHours);
    const lateNightCount = recentActiveHours.filter(h => h >= 0 && h < 5).length;

    if (lateNightCount >= 3) {
      return {
        type: 'late_night',
        severity: 'low',
        message: getRandomMessage('late_night'),
        details: `最近有 ${lateNightCount} 次凌晨活跃记录`,
      };
    }

    return null;
  } catch (err) {
    console.error('[ProactiveService] Error checking triggers:', err);
    return null;
  }
}

/**
 * Get proactive greeting message for app startup
 * Returns null if no trigger is needed
 */
export async function getProactiveGreeting(): Promise<string | null> {
  // Check if we already showed a proactive message today
  const today = getToday();
  const lastProactiveDate = localStorage.getItem('lastProactiveDate');

  if (lastProactiveDate === today) {
    return null; // Already showed today
  }

  const trigger = await checkProactiveTriggers();

  if (trigger) {
    // Save that we showed a proactive message today
    localStorage.setItem('lastProactiveDate', today);
    return trigger.message;
  }

  return null;
}

/**
 * Reset proactive message date (for testing)
 */
export function resetProactiveDate(): void {
  localStorage.removeItem('lastProactiveDate');
}
