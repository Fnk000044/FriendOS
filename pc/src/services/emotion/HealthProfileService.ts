/**
 * Health Profile Service
 * Generates health profiles by aggregating emotion and behavior data.
 * Writes results to db.healthProfiles for display in EmotionPage.
 */

import { db } from '../../db';
import type { EmotionRecord, BehaviorRecord, HealthProfile } from '../../db/models';
import { getToday, getDaysAgo } from '../../utils/date';

const DAYS_TO_ANALYZE = 7;

/**
 * Single-pass helper: compute average of a filtered subset
 */
function avgOf<T>(arr: T[], predicate: (item: T) => boolean, extractor: (item: T) => number): number {
  let sum = 0;
  let count = 0;
  for (const item of arr) {
    if (predicate(item)) {
      sum += extractor(item);
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Compute the 6 health dimensions from recent data
 */
function computeDimensions(
  emotions: EmotionRecord[],
  behaviors: BehaviorRecord[]
): HealthProfile['dimensions'] {
  // Mood: average of sentiment + moodRating
  let mood = 50;
  if (emotions.length > 0) {
    const avgSentiment = emotions.reduce((sum, e) => sum + (e.sentimentScore + 1) / 2, 0) / emotions.length;
    mood = Math.round(avgSentiment * 100);
  }
  const avgMoodRating = avgOf(behaviors, b => b.moodRating != null, b => b.moodRating!);
  if (avgMoodRating > 0) {
    const normalized = ((avgMoodRating - 1) / 4) * 100;
    mood = Math.round((mood + normalized) / 2);
  }

  // Stress: derived from negative emotions
  let stress = 30;
  if (emotions.length > 0) {
    const avgNegative = emotions.reduce((sum, e) => {
      const fear = e.emotions?.fear ?? 0;
      const anger = e.emotions?.anger ?? 0;
      const sadness = e.emotions?.sadness ?? 0;
      return sum + Math.max(fear, anger, sadness);
    }, 0) / emotions.length;
    stress = Math.round(Math.min(100, avgNegative * 100));
  }

  // Energy: based on positive emotion scores + activity frequency
  // 参考：心理学能量测量研究
  // 精力水平由积极情绪、任务完成率、习惯坚持率综合决定
  let energy = 50;
  if (emotions.length > 0) {
    const avgPositive = emotions.reduce((sum, e) => {
      const joy = e.emotions?.joy ?? 0;
      return sum + joy;
    }, 0) / emotions.length;
    energy = Math.round(avgPositive * 60); // 积极情绪贡献60%
  }
  const taskRate = avgOf(behaviors, b => b.tasksTotal > 0, b => b.tasksCompleted / b.tasksTotal);
  const habitRate = avgOf(behaviors, b => b.habitsTotal > 0, b => b.habitsChecked / b.habitsTotal);
  energy = Math.round(energy * 0.6 + taskRate * 25 + habitRate * 15); // 任务25%，习惯15%

  // Social: from emotion records (socialScore is optional, default to 30)
  const avgSocial = avgOf(emotions, e => (e as any).socialScore != null, e => (e as any).socialScore!);
  const social = avgSocial > 0 ? Math.round(avgSocial) : 30;

  // Sleep: from late-night activity + mood correlation
  // 参考：睡眠质量测量标准
  // 注：此为估算值，用户可通过自评选项提供更准确的数据
  let sleep = 70;
  if (behaviors.length > 0) {
    const lateCount = behaviors.filter(b => b.activeHours?.some(h => h >= 0 && h < 6)).length;
    const lateRatio = lateCount / behaviors.length;
    // 深夜活动降低睡眠分数
    const latePenalty = lateRatio * 120;
    // 情绪低落也可能与睡眠质量相关
    const avgMood = avgOf(behaviors, b => b.moodRating != null, b => b.moodRating!);
    const moodPenalty = avgMood < 3 ? (3 - avgMood) * 15 : 0;
    sleep = Math.round(Math.max(0, 100 - latePenalty - moodPenalty));
  }

  // SelfCare: from habit consistency
  const avgHabitRate = avgOf(behaviors, b => b.habitsTotal > 0, b => b.habitsChecked / b.habitsTotal);
  const selfCare = avgHabitRate > 0 ? Math.round(avgHabitRate * 100) : 50;

  return {
    mood: Math.max(0, Math.min(100, mood)),
    stress: Math.max(0, Math.min(100, stress)),
    energy: Math.max(0, Math.min(100, energy)),
    social: Math.max(0, Math.min(100, social)),
    sleep: Math.max(0, Math.min(100, sleep)),
    selfCare: Math.max(0, Math.min(100, selfCare)),
  };
}

/**
 * Generate or update the health profile for today
 */
export async function generateHealthProfile(): Promise<HealthProfile | null> {
  try {
    const today = getToday();
    const startDate = getDaysAgo(DAYS_TO_ANALYZE);

    // Fetch recent data in parallel
    const [emotions, behaviors] = await Promise.all([
      db.emotionRecords.where('date').aboveOrEqual(startDate).toArray(),
      db.behaviorRecords.where('date').aboveOrEqual(startDate).toArray(),
    ]);

    if (emotions.length === 0 && behaviors.length === 0) return null;

    const dimensions = computeDimensions(emotions, behaviors);

    // Single-pass averages for IPC call
    const avgSentiment = emotions.length > 0
      ? emotions.reduce((sum, e) => sum + e.sentimentScore, 0) / emotions.length
      : 0.5;
    const avgMoodRating = avgOf(behaviors, b => b.moodRating != null, b => b.moodRating!) || 3;
    const taskCompletionRate = avgOf(behaviors, b => b.tasksTotal > 0, b => b.tasksCompleted / b.tasksTotal) || 0.5;
    const habitConsistency = avgOf(behaviors, b => b.habitsTotal > 0, b => b.habitsChecked / b.habitsTotal) || 0.5;

    let emotionalHealthIndex = 50;
    try {
      emotionalHealthIndex = await window.electronAPI?.emotionCalculateHealthIndex({
        sentimentScore: (avgSentiment + 1) / 2,
        moodRating: avgMoodRating,
        taskCompletionRate,
        habitConsistency,
        socialScore: dimensions.social,
        sleepScore: dimensions.sleep,
      }) ?? 50;
    } catch (err) {
      console.error('[HealthProfileService] calculateHealthIndex error:', err);
      emotionalHealthIndex = Math.round(
        dimensions.mood * 0.25 +
        dimensions.energy * 0.20 +
        (100 - dimensions.stress) * 0.20 +
        dimensions.social * 0.10 +
        dimensions.sleep * 0.15 +
        dimensions.selfCare * 0.10
      );
    }

    // Risk level
    const moodTrend = behaviors.filter(b => b.moodRating != null).map(b => b.moodRating!);
    let riskLevel: HealthProfile['riskLevel'] = 'low';
    try {
      riskLevel = (await window.electronAPI?.emotionCalculateRiskLevel({
        recentEmotions: emotions,
        behaviorRecord: behaviors[behaviors.length - 1] || null,
        moodTrend,
        crisisKeywords: emotions.some(e => e.riskLevel === 'high' || e.riskLevel === 'critical'),
      })) as HealthProfile['riskLevel'] ?? 'low';
    } catch (err) {
      console.error('[HealthProfileService] calculateRiskLevel error:', err);
      if (emotionalHealthIndex < 30) riskLevel = 'high';
      else if (emotionalHealthIndex < 50) riskLevel = 'medium';
      else if (emotionalHealthIndex < 65) riskLevel = 'medium_low';
      else riskLevel = 'low';
    }

    // Volatility
    let emotionalVolatility = 0;
    if (moodTrend.length >= 2) {
      const mean = moodTrend.reduce((a, b) => a + b, 0) / moodTrend.length;
      emotionalVolatility = Math.round(
        Math.sqrt(moodTrend.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / moodTrend.length) * 100
      ) / 100;
    }

    const profile: Omit<HealthProfile, 'id' | 'createdAt'> = {
      date: today,
      emotionalHealthIndex,
      emotionalVolatility,
      riskLevel,
      dimensions,
      insights: [],
      suggestions: [],
    };

    // Generate insights & suggestions in parallel
    const [insights, suggestions] = await Promise.all([
      window.electronAPI?.emotionGenerateInsights(profile).catch(() => {
        if (emotionalHealthIndex >= 70) return ['你最近的心理状态不错，继续保持！'];
        if (emotionalHealthIndex >= 40) return ['你最近可能面临一些压力，建议适当放松。'];
        return ['你最近的状态需要关注，建议尝试放松练习或与人倾诉。'];
      }) ?? Promise.resolve(['你最近的心理状态不错，继续保持！']),
      window.electronAPI?.emotionGenerateSuggestions(profile).catch(() =>
        ['保持规律作息', '适度运动', '与朋友交流']
      ) ?? Promise.resolve(['保持规律作息', '适度运动', '与朋友交流']),
    ]);

    (profile as HealthProfile).insights = insights;
    (profile as HealthProfile).suggestions = suggestions;

    // Upsert
    const existing = await db.healthProfiles.where('date').equals(today).first();
    if (existing?.id) {
      await db.healthProfiles.update(existing.id, profile);
    } else {
      await db.healthProfiles.add(profile as HealthProfile);
    }

    return profile as HealthProfile;
  } catch (err) {
    console.error('[HealthProfileService] generateHealthProfile error:', err);
    return null;
  }
}

/**
 * Get the latest health profile (read-only)
 */
export async function getLatestHealthProfile(): Promise<HealthProfile | null> {
  return (await db.healthProfiles.orderBy('date').last()) || null;
}
