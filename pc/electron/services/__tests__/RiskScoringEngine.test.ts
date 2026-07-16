import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculateRiskScore, calculateRiskTrend, RISK_LEVELS, WEIGHTS } = require('../RiskScoringEngine.cjs');

describe('RiskScoringEngine', () => {
  describe('constants', () => {
    it('weights sum to 1.0', () => {
      const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
      expect(Math.round(sum * 100) / 100).toBe(1);
    });

    it('risk levels cover contiguous 0-100 range', () => {
      expect(RISK_LEVELS.low.min).toBe(0);
      expect(RISK_LEVELS.critical.max).toBe(100);
      expect(RISK_LEVELS.medium_low.min).toBe(RISK_LEVELS.low.max + 1);
      expect(RISK_LEVELS.medium.min).toBe(RISK_LEVELS.medium_low.max + 1);
      expect(RISK_LEVELS.high.min).toBe(RISK_LEVELS.medium.max + 1);
      expect(RISK_LEVELS.critical.min).toBe(RISK_LEVELS.high.max + 1);
    });
  });

  describe('calculateRiskScore', () => {
    it('returns low risk for healthy data', () => {
      const result = calculateRiskScore({
        emotionRecords: [{ sentimentScore: 0.7, riskLevel: 'low' }],
        behaviorData: { consecutiveNoDiary: 0, consecutiveLowMood: 0 },
        assessments: [],
        conversationSummaries: [],
        diaries: [{ mood: 5 }],
      });
      expect(result.riskLevel).toBe('low');
      expect(result.totalScore).toBeLessThanOrEqual(25);
      expect(result.breakdown).toHaveProperty('emotion');
      expect(result.breakdown).toHaveProperty('behavior');
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('escalates to medium+ when crisis emotion present', () => {
      const result = calculateRiskScore({
        emotionRecords: [
          { sentimentScore: -0.8, riskLevel: 'critical' },
          { sentimentScore: -0.7, riskLevel: 'high' },
        ],
        behaviorData: { consecutiveNoDiary: 14, consecutiveLowMood: 7 },
        assessments: [{ type: 'PHQ9', totalScore: 22 }],
        conversationSummaries: [{ emotionalState: '想死 跳楼' }],
        diaries: [{ mood: 1 }],
      });
      // 多信号源共同作用，必然进入中高以上风险等级
      expect(result.totalScore).toBeGreaterThan(50);
      expect(['medium', 'high', 'critical']).toContain(result.riskLevel);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('caps total score at 100', () => {
      const result = calculateRiskScore({
        emotionRecords: [{ sentimentScore: -1, riskLevel: 'critical' }],
        behaviorData: { consecutiveNoDiary: 30, consecutiveLowMood: 30, taskCompletionDrop: true, habitBreakDays: 30, lateNightRatio: 1 },
        assessments: [{ type: 'PHQ9', totalScore: 27 }],
        conversationSummaries: [{ emotionalState: '想死' }],
        diaries: [{ mood: 1 }],
      });
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('handles empty input gracefully', () => {
      const result = calculateRiskScore({});
      expect(result.riskLevel).toBe('low');
      expect(result.totalScore).toBe(0);
      expect(result.factors).toEqual([]);
    });

    it('factors are sorted by weight desc', () => {
      const result = calculateRiskScore({
        emotionRecords: [{ sentimentScore: -0.5, riskLevel: 'high' }],
        behaviorData: { consecutiveNoDiary: 14 },
        assessments: [],
        conversationSummaries: [],
        diaries: [{ mood: 1 }],
      });
      for (let i = 1; i < result.factors.length; i++) {
        expect(result.factors[i].weight).toBeLessThanOrEqual(result.factors[i - 1].weight);
      }
    });
  });

  describe('calculateRiskTrend', () => {
    it('returns stable for empty input', () => {
      const r = calculateRiskTrend([], 7);
      expect(r.trend).toBe('stable');
      expect(r.change).toBe(0);
    });

    it('detects rising trend', () => {
      const dailyScores = [
        { date: '1', score: 10 },
        { date: '2', score: 20 },
        { date: '3', score: 30 },
        { date: '4', score: 50 },
        { date: '5', score: 70 },
        { date: '6', score: 80 },
      ];
      const r = calculateRiskTrend(dailyScores, 7);
      expect(r.trend).toBe('rising');
      expect(r.change).toBeGreaterThan(5);
    });

    it('detects falling trend', () => {
      const dailyScores = [
        { date: '1', score: 80 },
        { date: '2', score: 70 },
        { date: '3', score: 50 },
        { date: '4', score: 30 },
        { date: '5', score: 20 },
        { date: '6', score: 10 },
      ];
      const r = calculateRiskTrend(dailyScores, 7);
      expect(r.trend).toBe('falling');
      expect(r.change).toBeLessThan(-5);
    });

    it('returns stable when change within ±5', () => {
      const dailyScores = [
        { date: '1', score: 50 },
        { date: '2', score: 52 },
        { date: '3', score: 51 },
        { date: '4', score: 50 },
      ];
      const r = calculateRiskTrend(dailyScores, 7);
      expect(r.trend).toBe('stable');
    });
  });
});
