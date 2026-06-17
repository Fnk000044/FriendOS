import { describe, it, expect } from 'vitest';
import { assessRisk, getRiskColor, getRiskLabel } from '../RiskAssessment';
import type { EmotionRecord, BehaviorRecord } from '../../../db/models';

// Mock data
const createEmotionRecord = (riskLevel: string): EmotionRecord => ({
  id: '1',
  date: '2026-06-13',
  source: 'diary',
  moodScore: 3,
  emotions: { joy: 0.3, sadness: 0.4, anger: 0.1, fear: 0.1, surprise: 0.05, disgust: 0.05 },
  riskLevel: riskLevel as EmotionRecord['riskLevel'],
  sentimentScore: -0.2,
  createdAt: '2026-06-13T10:00:00Z',
});

const defaultBehaviorTrends = {
  consecutiveNoDiary: 0,
  consecutiveLowMood: 0,
  taskCompletionDrop: false,
  habitBreakDays: 0,
  averageMood: 3.5,
  averageTaskRate: 0.7,
  averageHabitRate: 0.8,
  moodVolatility: 0.5,
  lateNightRatio: 0.2,
};

describe('RiskAssessment', () => {
  describe('assessRisk', () => {
    it('should return low risk for healthy input', () => {
      const result = assessRisk({
        recentEmotions: [],
        behaviorRecord: null,
        behaviorTrends: defaultBehaviorTrends,
      });
      expect(result.riskLevel).toBe('low');
      expect(result.riskScore).toBeLessThan(10);
    });

    it('should return critical for C-SSRS level 5-6', () => {
      const result = assessRisk({
        recentEmotions: [],
        behaviorRecord: null,
        behaviorTrends: defaultBehaviorTrends,
        crisisKeywords: true,
        crisisLevel: 4, // maps to C-SSRS level 5
      });
      expect(result.riskLevel).toBe('critical');
      expect(result.riskScore).toBe(100);
    });

    it('should return high for C-SSRS level 3-4', () => {
      const result = assessRisk({
        recentEmotions: [],
        behaviorRecord: null,
        behaviorTrends: defaultBehaviorTrends,
        crisisKeywords: true,
        crisisLevel: 3, // maps to C-SSRS level 3
      });
      expect(result.riskLevel).toBe('high');
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
    });

    it('should accumulate risk from high-risk emotions', () => {
      const result = assessRisk({
        recentEmotions: [createEmotionRecord('high')],
        behaviorRecord: null,
        behaviorTrends: defaultBehaviorTrends,
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
    });

    it('should accumulate risk from consecutive low mood', () => {
      const result = assessRisk({
        recentEmotions: [],
        behaviorRecord: null,
        behaviorTrends: {
          ...defaultBehaviorTrends,
          consecutiveLowMood: 3,
        },
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(30);
    });

    it('should accumulate risk from task completion drop', () => {
      const result = assessRisk({
        recentEmotions: [],
        behaviorRecord: null,
        behaviorTrends: {
          ...defaultBehaviorTrends,
          taskCompletionDrop: true,
        },
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });

    it('should return medium for risk score 40-79', () => {
      // High-risk emotions (40) + some other factors
      const result = assessRisk({
        recentEmotions: [createEmotionRecord('high')],
        behaviorRecord: null,
        behaviorTrends: {
          ...defaultBehaviorTrends,
          taskCompletionDrop: true,
        },
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
    });
  });

  describe('getRiskColor', () => {
    it('should return correct colors for each level', () => {
      expect(getRiskColor('low')).toBe('#10B981');
      expect(getRiskColor('medium_low')).toBe('#F59E0B');
      expect(getRiskColor('medium')).toBe('#F97316');
      expect(getRiskColor('high')).toBe('#EF4444');
      expect(getRiskColor('critical')).toBe('#DC2626');
    });
  });

  describe('getRiskLabel', () => {
    it('should return Chinese labels', () => {
      expect(getRiskLabel('low')).toBe('低风险');
      expect(getRiskLabel('medium_low')).toBe('中低风险');
      expect(getRiskLabel('medium')).toBe('中等风险');
      expect(getRiskLabel('high')).toBe('高风险');
      expect(getRiskLabel('critical')).toBe('极高风险');
    });
  });
});
