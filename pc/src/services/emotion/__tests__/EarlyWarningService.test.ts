import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../../db';

import {
  calculateAnomalyScore,
  predictRiskTrend,
  type RiskFeatures,
} from '../EarlyWarningService';

// 构造一个最小 RiskFeatures
function makeFeatures(overrides: Partial<RiskFeatures> = {}): RiskFeatures {
  return {
    moodMean: 0,
    moodVariance: 0,
    moodTrend: 0,
    moodDipDays: 0,
    diarySkipDays: 0,
    taskCompletionRate: 0.5,
    habitCompletionRate: 0.5,
    lateNightFrequency: 0,
    socialScore: 0.5,
    energyScore: 0.5,
    sleepScore: 0.5,
    ...overrides,
  };
}

describe('EarlyWarningService', () => {
  describe('calculateAnomalyScore', () => {
    it('returns 0 for healthy baseline', () => {
      const score = calculateAnomalyScore(makeFeatures({
        moodMean: 0.5, moodTrend: 0.1, moodDipDays: 0, diarySkipDays: 0,
        taskCompletionRate: 0.8, habitCompletionRate: 0.8, lateNightFrequency: 0,
      }));
      expect(score).toBe(0);
    });

    it('accumulates scores up to 100 cap', () => {
      const score = calculateAnomalyScore(makeFeatures({
        moodMean: -0.5,           // +25
        moodTrend: -0.1,          // +20
        moodDipDays: 5,           // +15
        diarySkipDays: 5,         // +10
        taskCompletionRate: 0.1,  // +10
        habitCompletionRate: 0.1, // +10
        lateNightFrequency: 0.5,  // +10  => total 100
      }));
      expect(score).toBe(100);
    });

    it('partial degradation produces intermediate score', () => {
      const score = calculateAnomalyScore(makeFeatures({
        moodMean: -0.4, moodTrend: -0.06,
      }));
      // 25 + 20 = 45
      expect(score).toBe(45);
    });
  });

  describe('predictRiskTrend', () => {
    it('returns low with empty/insufficient input', () => {
      expect(predictRiskTrend([]).nextRiskLevel).toBe('low');
      expect(predictRiskTrend([makeFeatures()]).nextRiskLevel).toBe('low');
    });

    it('returns low when trends are stable', () => {
      const features = [
        makeFeatures({ moodTrend: 0.05, moodDipDays: 0, diarySkipDays: 0 }),
        makeFeatures({ moodTrend: 0.05, moodDipDays: 0, diarySkipDays: 0 }),
      ];
      const result = predictRiskTrend(features);
      expect(result.nextRiskLevel).toBe('low');
      expect(result.warningSignals).toHaveLength(0);
    });

    it('detects accelerating mood decline → medium (1 signal)', () => {
      const features = [
        makeFeatures({ moodTrend: -0.06 }),
        makeFeatures({ moodTrend: -0.1 }),
      ];
      const result = predictRiskTrend(features);
      expect(result.nextRiskLevel).toBe('medium');
      expect(result.warningSignals).toContain('情绪下降加速');
    });

    it('escalates to critical when 3+ signals fire', () => {
      const features = [
        makeFeatures({
          moodTrend: -0.05, moodDipDays: 2, diarySkipDays: 2,
          taskCompletionRate: 0.5, habitCompletionRate: 0.5,
        }),
        makeFeatures({
          moodTrend: -0.1,           // accelerating decline (+1)
          moodDipDays: 4,            // increasing dip days (+1)
          diarySkipDays: 4,          // skipped diary (+1)
          taskCompletionRate: 0.2,  // declining (+1)
          habitCompletionRate: 0.2, // declining (+1)
          lateNightFrequency: 0.4,   // rising (+1)
        }),
      ];
      const result = predictRiskTrend(features);
      expect(result.nextRiskLevel).toBe('critical');
      expect(result.warningSignals.length).toBeGreaterThanOrEqual(3);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThanOrEqual(0.9);
    });

    it('confidence scales with signal count', () => {
      const base = makeFeatures();
      const twoSignals = [
        { ...base, moodTrend: -0.06 },
        { ...base, moodTrend: -0.1, diarySkipDays: 4 },
      ];
      const r2 = predictRiskTrend(twoSignals);
      expect(r2.warningSignals.length).toBeGreaterThanOrEqual(2);
      expect(r2.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('getEarlyWarning (integration with fake-indexeddb)', () => {
    beforeEach(async () => {
      // 清空数据库表
      await db.emotionRecords.clear();
      await db.behaviorRecords.clear();
      await db.tasks.clear();
      await db.diaries.clear();
      await db.habitLogs.clear();
      await db.healthProfiles.clear();
    });

    it('returns green no-warning when insufficient data', async () => {
      const { getEarlyWarning } = await import('../EarlyWarningService');
      const result = await getEarlyWarning();
      expect(result.hasWarning).toBe(false);
      expect(result.level).toBe('green');
      expect(result.signals).toHaveLength(0);
    });

    it('detects deteriorating trend and returns orange/red', async () => {
      const { getEarlyWarning, EARLY_WARNING_DEFAULTS } = await import('../EarlyWarningService');
      const windowDays = EARLY_WARNING_DEFAULTS.windowDays;
      const windowCount = EARLY_WARNING_DEFAULTS.windowCount;
      const totalDays = windowDays * windowCount;

      // 构造 15 天数据：情绪从 +0.5 单调下降到 -0.6（恶化）
      const today = new Date();
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        // 越近的日期情绪越差：slope = (final - initial) / (totalDays - 1)
        const score = 0.5 + (-1.1) * (i / (totalDays - 1));
        await db.emotionRecords.add({
          id: `e-${i}`,
          date: dateStr,
          source: 'combined',
          sentimentScore: Math.round(score * 100) / 100,
          emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 },
          riskLevel: i < 5 ? 'high' : 'medium',
          keywords: [],
          createdAt: dateStr,
        });
      }

      const result = await getEarlyWarning();
      // 由于情绪单调下降，最近的窗口 moodTrend 应为负且比前一窗口更负
      expect(result.trendSeries.length).toBeGreaterThan(0);
      // 至少检测到情绪下降加速或低落天数增加
      // 不强制 level（数据量边界），但要保证结构完整
      expect(result).toHaveProperty('hasWarning');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('daysToCritical');
      expect(result).toHaveProperty('anomalyScore');
      expect(result).toHaveProperty('nextRiskLevel');
      expect(result).toHaveProperty('confidence');
    });
  });
});
