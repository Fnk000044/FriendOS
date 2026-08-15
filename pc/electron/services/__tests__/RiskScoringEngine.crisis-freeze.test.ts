/**
 * 危机冻结 + 个性化失效（最高安全优先级）独立验证
 *
 * 目标：
 * 1. personalization 把 λ 拉满（0.7~1.3 边界）+ δ=-10 压低分数时，基线 critical
 *    （score>=91 / C-SSRS Q3-Q5 急性 / 多通道危机收敛）仍保持 critical。
 * 2. escalationLocked（临床升级）时个性化完全失效（λ=1、δ=0、calibration.applied=false）。
 * 3. 个性化只能在中低风险区间移动，不能凭空制造 critical。
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculateRiskScore } = require('../RiskScoringEngine.cjs');

/** 把 λ 拉满到最低（0.7）+ δ=-10 的"最强降级"个性化 */
const maxDowngrade = {
  weightFactors: { emotion: 0.7, behavior: 0.7, diary: 0.7 },
  offset: -10,
  sampleCount: 20,
};

/** 把 λ 拉满到最高（1.3）+ δ=+10 的"最强放大"个性化 */
const maxUpgrade = {
  weightFactors: { emotion: 1.3, behavior: 1.3, diary: 1.3 },
  offset: 10,
  sampleCount: 20,
};

describe('RiskScoringEngine 危机冻结与个性化失效', () => {
  describe('基线 critical（C-SSRS 急性）不可被个性化降级', () => {
    const cssrsAcuteData = {
      emotionRecords: [{ sentimentScore: 0.5, riskLevel: 'low' }],
      behaviorData: {},
      assessments: [{ type: 'CSSRS', totalScore: 0, scores: [0, 0, 1, 0, 0] }], // Q3 阳性
      conversationSummaries: [],
      diaries: [],
    };

    it('最强降级个性化（λ=0.7 + δ=-10）下仍为 critical', () => {
      const r = calculateRiskScore(cssrsAcuteData, maxDowngrade);
      expect(r.riskLevel).toBe('critical');
      expect(r.totalScore).toBe(r.baselineScore); // 分数以基线为准
    });

    it('escalationLocked 时个性化完全失效：calibration.applied=false、λ=1、δ=0', () => {
      const r = calculateRiskScore(cssrsAcuteData, maxDowngrade);
      expect(r.calibration.applied).toBe(false);
      expect(r.calibration.offset).toBe(0);
      expect(r.calibration.perSignal.emotion).toBe(1);
      expect(r.calibration.perSignal.behavior).toBe(1);
      expect(r.calibration.perSignal.diary).toBe(1);
      expect(r.breakdown.emotion.factor).toBe(1);
      expect(r.breakdown.behavior.factor).toBe(1);
      expect(r.breakdown.diary.factor).toBe(1);
    });
  });

  describe('基线 critical（多通道危机收敛）不可被个性化降级', () => {
    const multiChannelData = {
      emotionRecords: [
        { sentimentScore: -1, riskLevel: 'critical' },
        { sentimentScore: 1, riskLevel: 'low' },
        { sentimentScore: -1, riskLevel: 'critical' },
      ],
      behaviorData: {
        consecutiveNoDiary: 30, consecutiveLowMood: 30,
        taskCompletionDrop: true, habitBreakDays: 30, lateNightRatio: 1,
      },
      assessments: [
        { type: 'PHQ9', totalScore: 27 },
        { type: 'GAD7', totalScore: 21 },
        { type: 'PSS10', totalScore: 40 },
      ],
      conversationSummaries: [{ emotionalState: '想死' }],
      diaries: [{ mood: 1, content: '想死' }],
    };

    it('最强降级个性化下仍为 critical', () => {
      const r = calculateRiskScore(multiChannelData, maxDowngrade);
      expect(r.riskLevel).toBe('critical');
      expect(r.totalScore).toBe(r.baselineScore);
      expect(r.diagnostics.escalation.reasons).toContain('multi_channel_crisis');
    });

    it('escalationLocked 时个性化完全失效', () => {
      const r = calculateRiskScore(multiChannelData, maxDowngrade);
      expect(r.calibration.applied).toBe(false);
      expect(r.calibration.offset).toBe(0);
    });
  });

  describe('个性化不能凭空制造 critical', () => {
    const moderateData = {
      emotionRecords: [{ sentimentScore: -0.4, riskLevel: 'low' }],
      behaviorData: { consecutiveNoDiary: 3, consecutiveLowMood: 2 },
      assessments: [],
      conversationSummaries: [],
      diaries: [{ mood: 3 }],
    };

    it('最强放大个性化（λ=1.3 + δ=+10）下最高 high（totalScore<=90）', () => {
      const r = calculateRiskScore(moderateData, maxUpgrade);
      expect(r.riskLevel).not.toBe('critical');
      expect(r.totalScore).toBeLessThanOrEqual(90);
    });

    it('λ 越界被 clamp 到 [0.7, 1.3]、δ 越界被 clamp 到 [-10, 10]', () => {
      const r = calculateRiskScore(moderateData, {
        weightFactors: { emotion: 999, behavior: -999, diary: 0 },
        offset: 999,
        sampleCount: 20,
      });
      expect(r.calibration.perSignal.emotion).toBeLessThanOrEqual(1.3);
      expect(r.calibration.perSignal.emotion).toBeGreaterThanOrEqual(0.7);
      expect(r.calibration.perSignal.behavior).toBeLessThanOrEqual(1.3);
      expect(r.calibration.perSignal.behavior).toBeGreaterThanOrEqual(0.7);
      expect(r.calibration.offset).toBeLessThanOrEqual(10);
      expect(r.calibration.offset).toBeGreaterThanOrEqual(-10);
    });

    it('assessment/chat 通道永远冻结 λ=1（临床量表与历史通道不可个性化）', () => {
      const r = calculateRiskScore(moderateData, maxUpgrade);
      expect(r.calibration.perSignal.assessment).toBe(1);
      expect(r.calibration.perSignal.chat).toBe(1);
      expect(r.breakdown.assessment.factor).toBe(1);
      expect(r.breakdown.chat.factor).toBe(1);
    });
  });
});
