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

  // ── 边界条件测试 ──────────────────────────────────────────────
  describe('边界条件', () => {
    describe('riskLevel 阈值边界', () => {
      // 各子评分受 cap 限制：emotion 上限 ~85、behavior 100、assessment 100、chat 40、diary 80
      // 加权上限 ~87.5，纯分数路径无法达到 91+。
      // 但临床升级逻辑使 critical 可达：
      //   - C-SSRS Q3/Q4/Q5 阳性 → 直接 critical
      //   - totalScore >= 76 且 >= 2 个危机信号源 → critical

      it('low 区间（0-25）：纯健康数据', () => {
        const result = calculateRiskScore({
          emotionRecords: [{ sentimentScore: 1, riskLevel: 'low' }],
          behaviorData: { consecutiveNoDiary: 0, consecutiveLowMood: 0 },
          assessments: [],
          conversationSummaries: [],
          diaries: [{ mood: 5 }],
        });
        expect(result.riskLevel).toBe('low');
        expect(result.totalScore).toBeLessThanOrEqual(25);
      });

      it('high 区间（76-90）：全信号源极端输入但无危机升级触发', () => {
        // 无 C-SSRS 急性风险，无危机关键词 → 不触发临床升级
        const result = calculateRiskScore({
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
          conversationSummaries: [{ emotionalState: '难过 痛苦 绝望 孤独 悲伤' }],
          diaries: [{ mood: 1, content: '很难过 很痛苦 很绝望 很孤独' }],
        });
        expect(result.riskLevel).toBe('high');
        expect(result.totalScore).toBeGreaterThanOrEqual(76);
        expect(result.totalScore).toBeLessThanOrEqual(90);
      });

      // ── 临床升级（C-SSRS 急性风险 / 多通道危机收敛）──────────────

      it('critical：C-SSRS Q3/Q4/Q5 阳性（伴意图/计划/行为）→ 即使总分低也升级为 critical', () => {
        const result = calculateRiskScore({
          emotionRecords: [{ sentimentScore: 0.5, riskLevel: 'low' }],
          behaviorData: {},
          assessments: [
            { type: 'CSSRS', totalScore: 0, scores: [0, 0, 1, 0, 0] },
          ],
          conversationSummaries: [],
          diaries: [],
        });
        expect(result.riskLevel).toBe('critical');
      });

      it('critical：多通道危机收敛（high 分 + >=2 危机信号源）', () => {
        // chat 危机 + diary 危机 = 2 个危机信号，总分 >= 76 → critical
        const result = calculateRiskScore({
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
        });
        expect(result.riskLevel).toBe('critical');
        expect(result.totalScore).toBeGreaterThanOrEqual(76);
      });

      it('C-SSRS Q1/Q2 仅意念（无 Q3+）+ high 分 → 不升级为 critical', () => {
        const result = calculateRiskScore({
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
            { type: 'CSSRS', totalScore: 0, scores: [1, 1, 0, 0, 0] },
          ],
          conversationSummaries: [{ emotionalState: '难过 痛苦 绝望 孤独 悲伤' }],
          diaries: [{ mood: 1, content: '很难过 很痛苦 很绝望 很孤独' }],
        });
        // C-SSRS 仅 Q1/Q2 阳性（hasIdeation），无 Q3+（cssrsAcute=false）
        // 无危机关键词 → crisisFactorCount=0 → 不升级
        expect(result.riskLevel).toBe('high');
      });

      it('单危机信号 + high 分 → 仍为 high（需 >=2 危机信号才升级）', () => {
        const result = calculateRiskScore({
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
          diaries: [{ mood: 1, content: '很难过 很痛苦' }],
        });
        // 仅 chat 1 个危机信号，diary 无危机关键词
        expect(result.riskLevel).toBe('high');
      });

      it('双危机信号 + medium 分 → 仍为 medium（分数不够 high 不升级）', () => {
        const result = calculateRiskScore({
          emotionRecords: [{ sentimentScore: -0.2, riskLevel: 'low' }],
          behaviorData: { consecutiveNoDiary: 3 },
          assessments: [],
          conversationSummaries: [{ emotionalState: '想死' }],
          diaries: [{ mood: 3, content: '想死' }],
        });
        // 有 2 个危机信号但总分 < 76 → 不升级
        expect(result.totalScore).toBeLessThan(76);
        expect(result.riskLevel).not.toBe('critical');
      });
    });

    describe('diagnostics 可归因诊断', () => {
      it('危机升级路径下诊断字段被正确填充（C-SSRS 急性 → cssrs_acute）', () => {
        const result = calculateRiskScore({
          emotionRecords: [{ sentimentScore: 0.5, riskLevel: 'low' }],
          behaviorData: {},
          assessments: [
            { type: 'CSSRS', totalScore: 0, scores: [0, 0, 1, 0, 0] },
          ],
          conversationSummaries: [],
          diaries: [],
        });
        expect(result.riskLevel).toBe('critical');
        expect(result.diagnostics.escalation.escalated).toBe(true);
        expect(result.diagnostics.escalation.reasons).toContain('cssrs_acute');
      });

      it('多通道危机收敛升级 → reasons 含 multi_channel_crisis 且 crisisFactorCount >= 2', () => {
        const result = calculateRiskScore({
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
        });
        expect(result.riskLevel).toBe('critical');
        expect(result.diagnostics.escalation.escalated).toBe(true);
        expect(result.diagnostics.escalation.reasons).toContain('multi_channel_crisis');
        expect(result.diagnostics.escalation.crisisFactorCount).toBeGreaterThanOrEqual(2);
      });

      it('排除规则抑制危机命中时记入 exclusionsHit（含来源与词表规则）', () => {
        // '活不下去' 为危机词，'累死了' 为排除词 → 危机命中被抑制并记入诊断
        const result = calculateRiskScore({
          emotionRecords: [],
          behaviorData: {},
          assessments: [],
          conversationSummaries: [],
          diaries: [{ mood: 3, content: '今天累死了，感觉活不下去' }],
        });
        expect(result.factors.find(f => f.type === 'crisis_in_diary')).toBeUndefined();
        expect(result.diagnostics.exclusionsHit).toContainEqual({ source: 'diary', rule: '累死了' });
      });

      it('健康数据下诊断字段为空结构（escalated=false，无排除命中）', () => {
        const result = calculateRiskScore({
          emotionRecords: [{ sentimentScore: 1, riskLevel: 'low' }],
          behaviorData: {},
          assessments: [],
          conversationSummaries: [],
          diaries: [{ mood: 5, content: '今天很开心' }],
        });
        expect(result.diagnostics.escalation.escalated).toBe(false);
        expect(result.diagnostics.escalation.reasons).toEqual([]);
        expect(result.diagnostics.exclusionsHit).toEqual([]);
      });
    });

    describe('behavior 子评分阶梯边界', () => {
      // 每个子分通过 behavior 单源 → totalScore = round(behavior * 0.25)
      // 我们不直接断 totalScore，而断 behavior breakdown.score（已四舍五入）
      it('consecutiveNoDiary=14 → no_diary 阶梯取 60 分', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveNoDiary: 14 },
        });
        // behavior 子分应为 60
        expect(result.breakdown.behavior.score).toBe(60);
        const f = result.factors.find(f => f.type === 'no_diary');
        expect(f).toBeDefined();
        expect(f!.weight).toBe(60);
      });

      it('consecutiveNoDiary=13 → 取 40 分（>=7 档）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveNoDiary: 13 },
        });
        expect(result.breakdown.behavior.score).toBe(40);
      });

      it('consecutiveNoDiary=7 → 取 40 分（>=7 档下边界）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveNoDiary: 7 },
        });
        expect(result.breakdown.behavior.score).toBe(40);
      });

      it('consecutiveNoDiary=6 → 取 25 分（>=3 档）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveNoDiary: 6 },
        });
        expect(result.breakdown.behavior.score).toBe(25);
      });

      it('consecutiveNoDiary=3 → 取 25 分（>=3 档下边界）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveNoDiary: 3 },
        });
        expect(result.breakdown.behavior.score).toBe(25);
      });

      it('consecutiveNoDiary=2 → 取 10 分（>=2 档下边界）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveNoDiary: 2 },
        });
        expect(result.breakdown.behavior.score).toBe(10);
      });

      it('consecutiveNoDiary=1 → 0 分（不触发任何阶梯）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveNoDiary: 1 },
        });
        expect(result.breakdown.behavior.score).toBe(0);
        expect(result.factors.find(f => f.type === 'no_diary')).toBeUndefined();
      });

      it('consecutiveLowMood=7 → 45 分', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveLowMood: 7 },
        });
        expect(result.breakdown.behavior.score).toBe(45);
      });

      it('consecutiveLowMood=3 → 30 分（>=3 下边界）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveLowMood: 3 },
        });
        expect(result.breakdown.behavior.score).toBe(30);
      });

      it('consecutiveLowMood=2 → 15 分（>=2 下边界）', () => {
        const result = calculateRiskScore({
          behaviorData: { consecutiveLowMood: 2 },
        });
        expect(result.breakdown.behavior.score).toBe(15);
      });

      it('habitBreakDays=3 触发 habit_break（下边界）', () => {
        const result = calculateRiskScore({
          behaviorData: { habitBreakDays: 3 },
        });
        expect(result.breakdown.behavior.score).toBe(15);
        expect(result.factors.find(f => f.type === 'habit_break')).toBeDefined();
      });

      it('habitBreakDays=2 不触发（未达 >=3）', () => {
        const result = calculateRiskScore({
          behaviorData: { habitBreakDays: 2 },
        });
        expect(result.factors.find(f => f.type === 'habit_break')).toBeUndefined();
      });

      it('lateNightRatio=0.3 不触发（> 0.3 才触发，下边界排除）', () => {
        const result = calculateRiskScore({
          behaviorData: { lateNightRatio: 0.3 },
        });
        expect(result.factors.find(f => f.type === 'late_night')).toBeUndefined();
      });

      it('lateNightRatio=0.31 触发 late_night', () => {
        const result = calculateRiskScore({
          behaviorData: { lateNightRatio: 0.31 },
        });
        expect(result.breakdown.behavior.score).toBe(10);
      });

      it('taskCompletionDrop=true 触发 task_drop', () => {
        const result = calculateRiskScore({
          behaviorData: { taskCompletionDrop: true },
        });
        expect(result.breakdown.behavior.score).toBe(15);
      });
    });

    describe('assessment 子评分阶梯边界', () => {
      it('PHQ9=20 → phq9_severe（35 分，>=20 下边界）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PHQ9', totalScore: 20 }] });
        // assessment 子分 35，权重 0.25 → breakdown 已 round
        expect(r.breakdown.assessment.score).toBe(35);
        expect(r.factors.find(f => f.type === 'phq9_severe')).toBeDefined();
      });

      it('PHQ9=19 → phq9_moderate_severe（25 分）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PHQ9', totalScore: 19 }] });
        expect(r.breakdown.assessment.score).toBe(25);
      });

      it('PHQ9=15 → 25 分（>=15 下边界）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PHQ9', totalScore: 15 }] });
        expect(r.breakdown.assessment.score).toBe(25);
      });

      it('PHQ9=14 → 15 分（>=10 档）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PHQ9', totalScore: 14 }] });
        expect(r.breakdown.assessment.score).toBe(15);
      });

      it('PHQ9=5 → 5 分（>=5 下边界）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PHQ9', totalScore: 5 }] });
        expect(r.breakdown.assessment.score).toBe(5);
      });

      it('PHQ9=4 → 0 分（不触发）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PHQ9', totalScore: 4 }] });
        expect(r.breakdown.assessment.score).toBe(0);
      });

      it('GAD7=15 → gad7_severe（30 分）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'GAD7', totalScore: 15 }] });
        expect(r.breakdown.assessment.score).toBe(30);
      });

      it('GAD7=5 → gad7_mild（10 分，下边界）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'GAD7', totalScore: 5 }] });
        expect(r.breakdown.assessment.score).toBe(10);
      });

      it('PSS10=27 → pss10_high（25 分，下边界）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PSS10', totalScore: 27 }] });
        expect(r.breakdown.assessment.score).toBe(25);
      });

      it('PSS10=14 → pss10_moderate（15 分，下边界）', () => {
        const r = calculateRiskScore({ assessments: [{ type: 'PSS10', totalScore: 14 }] });
        expect(r.breakdown.assessment.score).toBe(15);
      });

      it('C-SSRS scores[2..4] 任一 ≥1 → cssrs_high_risk（40 分）', () => {
        const r = calculateRiskScore({
          assessments: [{ type: 'CSSRS', totalScore: 0, scores: [0, 0, 1, 0, 0] }],
        });
        expect(r.breakdown.assessment.score).toBe(40);
        expect(r.factors.find(f => f.type === 'cssrs_high_risk')).toBeDefined();
      });

      it('C-SSRS scores[0..1] 任一 ≥1 → cssrs_ideation（20 分）', () => {
        const r = calculateRiskScore({
          assessments: [{ type: 'CSSRS', totalScore: 0, scores: [1, 0, 0, 0, 0] }],
        });
        expect(r.breakdown.assessment.score).toBe(20);
      });

      it('C-SSRS scores 全 0 → 不触发', () => {
        const r = calculateRiskScore({
          assessments: [{ type: 'CSSRS', totalScore: 0, scores: [0, 0, 0, 0, 0] }],
        });
        expect(r.breakdown.assessment.score).toBe(0);
      });
    });

    describe('emotion 子评分边界', () => {
      it('sentimentScore=1（最正面）+ riskLevel=low → 子分仅 sentimentRisk', () => {
        // sentimentRisk = (1-1)*50*0.4 = 0
        const r = calculateRiskScore({
          emotionRecords: [{ sentimentScore: 1, riskLevel: 'low' }],
        });
        expect(r.breakdown.emotion.score).toBe(0);
        expect(r.factors).toHaveLength(0);
      });

      it('sentimentScore=-0.3 不触发 negative_sentiment（< -0.3 才触发，边界排除）', () => {
        const r = calculateRiskScore({
          emotionRecords: [{ sentimentScore: -0.3, riskLevel: 'low' }],
        });
        expect(r.factors.find(f => f.type === 'negative_sentiment')).toBeUndefined();
      });

      it('sentimentScore=-0.31 触发 negative_sentiment', () => {
        const r = calculateRiskScore({
          emotionRecords: [{ sentimentScore: -0.31, riskLevel: 'low' }],
        });
        expect(r.factors.find(f => f.type === 'negative_sentiment')).toBeDefined();
      });

      it('high-risk emotion record 触发 high_risk_emotion +30', () => {
        const r = calculateRiskScore({
          emotionRecords: [{ sentimentScore: 0, riskLevel: 'high' }],
        });
        // sentimentRisk = (1-0)*50*0.4 = 20；+30 → 50
        expect(r.breakdown.emotion.score).toBe(50);
        expect(r.factors.find(f => f.type === 'high_risk_emotion')).toBeDefined();
      });

      it('critical emotion record 同样触发 high_risk_emotion +30', () => {
        const r = calculateRiskScore({
          emotionRecords: [{ sentimentScore: 0, riskLevel: 'critical' }],
        });
        expect(r.factors.find(f => f.type === 'high_risk_emotion')).toBeDefined();
      });

      it('emotion volatility > 0.4 触发（3 条记录 stddev>0.4）', () => {
        // 构造方差 > 0.16 → stddev > 0.4：scores [-1, 1, 0] mean=0 variance=(1+1+0)/3=0.667 stddev=0.816
        const r = calculateRiskScore({
          emotionRecords: [
            { sentimentScore: -1, riskLevel: 'low' },
            { sentimentScore: 1, riskLevel: 'low' },
            { sentimentScore: 0, riskLevel: 'low' },
          ],
        });
        expect(r.factors.find(f => f.type === 'emotion_volatility')).toBeDefined();
      });

      it('emotion volatility == 0.4 不触发（边界排除）', () => {
        // 构造方差恰好 = 0.16 → stddev = 0.4。scores [-0.4, 0.4, 0] mean=0, var=(0.16+0.16+0)/3≈0.1066，不对。
        // 用 [-a, a, 0]: var = (a^2 + a^2 + 0)/3 = 2a^2/3 = 0.16 → a^2 = 0.24 → a ≈ 0.4899
        const a = Math.sqrt(0.24);
        const r = calculateRiskScore({
          emotionRecords: [
            { sentimentScore: -a, riskLevel: 'low' },
            { sentimentScore: a, riskLevel: 'low' },
            { sentimentScore: 0, riskLevel: 'low' },
          ],
        });
        expect(r.factors.find(f => f.type === 'emotion_volatility')).toBeUndefined();
      });

      it('只有 2 条记录不触发 volatility（< 3）', () => {
        const r = calculateRiskScore({
          emotionRecords: [
            { sentimentScore: -1, riskLevel: 'low' },
            { sentimentScore: 1, riskLevel: 'low' },
          ],
        });
        expect(r.factors.find(f => f.type === 'emotion_volatility')).toBeUndefined();
      });
    });

    describe('diary 子评分边界', () => {
      it('mood=5 → moodRisk=0，无 factor', () => {
        const r = calculateRiskScore({ diaries: [{ mood: 5 }] });
        expect(r.breakdown.diary.score).toBe(0);
      });

      it('mood=2 触发 low_mood_diary（avgMood <= 2 下边界）', () => {
        const r = calculateRiskScore({ diaries: [{ mood: 2 }] });
        // moodRisk = (5-2)*20*0.5 = 30
        expect(r.breakdown.diary.score).toBe(30);
        expect(r.factors.find(f => f.type === 'low_mood_diary')).toBeDefined();
      });

      it('mood=3 不触发 low_mood_diary', () => {
        const r = calculateRiskScore({ diaries: [{ mood: 3 }] });
        expect(r.factors.find(f => f.type === 'low_mood_diary')).toBeUndefined();
      });

      it('diary content 含危机关键词 → crisis_in_diary +40', () => {
        const r = calculateRiskScore({ diaries: [{ mood: 5, content: '我想自杀' }] });
        expect(r.factors.find(f => f.type === 'crisis_in_diary')).toBeDefined();
      });
    });

    describe('数据健壮性', () => {
      it('null 字段不抛错', () => {
        expect(() => calculateRiskScore({
          emotionRecords: null,
          behaviorData: null,
          assessments: null,
          conversationSummaries: null,
          diaries: null,
        })).not.toThrow();
      });

      it('字段缺失（undefined）不抛错', () => {
        expect(() => calculateRiskScore({})).not.toThrow();
      });

      it('emotionRecords 元素缺字段 → 不抛错（NaN 会被 round 处理）', () => {
        expect(() => calculateRiskScore({
          emotionRecords: [{ /* 无 sentimentScore */ } as any],
        })).not.toThrow();
      });

      it('C-SSRS scores 缺失 → 默认 [] 不触发', () => {
        const r = calculateRiskScore({
          assessments: [{ type: 'CSSRS', totalScore: 0 } as any],
        });
        expect(r.breakdown.assessment.score).toBe(0);
      });

      it('factors 最多 10 条', () => {
        // 构造多因素：behavior 全开 + emotion high + chat + diary
        const r = calculateRiskScore({
          emotionRecords: [{ sentimentScore: -0.8, riskLevel: 'critical' }],
          behaviorData: {
            consecutiveNoDiary: 14, consecutiveLowMood: 7,
            taskCompletionDrop: true, habitBreakDays: 5, lateNightRatio: 0.5,
          },
          assessments: [
            { type: 'PHQ9', totalScore: 22 },
            { type: 'GAD7', totalScore: 18 },
            { type: 'PSS10', totalScore: 30 },
            { type: 'CSSRS', totalScore: 0, scores: [1, 1, 1, 1, 1] },
          ],
          conversationSummaries: [{ emotionalState: '想死' }],
          diaries: [{ mood: 1, content: '想死 难过 痛苦 绝望' }],
        });
        expect(r.factors.length).toBeLessThanOrEqual(10);
      });

      it('riskLevelInfo 与 riskLevel 一致', () => {
        const r = calculateRiskScore({});
        expect(r.riskLevelInfo).toBe(RISK_LEVELS[r.riskLevel]);
      });

      it('summary 与 riskLevel 对应（critical，C-SSRS 急性升级）', () => {
        const r = calculateRiskScore({
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
            { type: 'CSSRS', totalScore: 0, scores: [1, 1, 1, 1, 1] },
          ],
          conversationSummaries: [{ emotionalState: '想死' }],
          diaries: [{ mood: 1, content: '想死' }],
        });
        // C-SSRS Q3/Q4/Q5 阳性 → 临床升级为 critical
        expect(r.riskLevel).toBe('critical');
        expect(r.summary).toContain('专业帮助');
      });
    });

    describe('calculateRiskTrend 边界', () => {
      it('数据点 < 3 → trend=stable（即使有明显变化）', () => {
        const r = calculateRiskTrend([
          { date: '1', score: 0 },
          { date: '2', score: 100 },
        ], 7);
        expect(r.trend).toBe('stable');
        expect(r.change).toBe(0);
      });

      it('恰好 3 个数据点 + change > 5 → rising', () => {
        const r = calculateRiskTrend([
          { date: '1', score: 10 },
          { date: '2', score: 10 },
          { date: '3', score: 100 },
        ], 7);
        expect(r.trend).toBe('rising');
      });

      it('change == 5 → stable（> 5 才 rising，边界排除）', () => {
        // firstHalf avg=10, secondHalf avg=15, change=5
        const r = calculateRiskTrend([
          { date: '1', score: 10 },
          { date: '2', score: 10 },
          { date: '3', score: 15 },
          { date: '4', score: 15 },
        ], 7);
        expect(r.change).toBe(5);
        expect(r.trend).toBe('stable');
      });

      it('change == -5 → stable（< -5 才 falling，边界排除）', () => {
        const r = calculateRiskTrend([
          { date: '1', score: 15 },
          { date: '2', score: 15 },
          { date: '3', score: 10 },
          { date: '4', score: 10 },
        ], 7);
        expect(r.change).toBe(-5);
        expect(r.trend).toBe('stable');
      });

      it('days 参数裁剪：传入 10 条但 days=3 → 只取最近 3 条', () => {
        const r = calculateRiskTrend(
          Array.from({ length: 10 }, (_, i) => ({ date: String(i), score: i })),
          3,
        );
        // 只能拿到 3 条数据，无法稳定判定 rising
        expect(r.data).toHaveLength(3);
        // 3 条且 change = 2 (avg[7,8,9] vs avg[...] 实际 firstHalf=[7], secondHalf=[8,9] avg=8.5, change≈1.5→2)
        expect(r.trend).toBe('stable');
      });

      it('average 字段返回最近 days 条平均', () => {
        const r = calculateRiskTrend([
          { date: '1', score: 20 },
          { date: '2', score: 40 },
          { date: '3', score: 60 },
        ], 7);
        expect(r.average).toBe(40);
      });

      it('null 入参返回 stable + change=0 + data=[]', () => {
        const r = calculateRiskTrend(null as any, 7);
        expect(r.trend).toBe('stable');
        expect(r.change).toBe(0);
        expect(r.data).toEqual([]);
      });
    });
  });

  // ── 本地个性化校准层（危机单向锁定）─────────────────────────
  describe('calculateRiskScore 个性化校准层', () => {
    const moderateData = {
      emotionRecords: [{ sentimentScore: -0.4, riskLevel: 'low' }],
      behaviorData: { consecutiveNoDiary: 3, consecutiveLowMood: 2 },
      assessments: [],
      conversationSummaries: [],
      diaries: [{ mood: 3 }],
    };

    it('样本不足（<8）→ 不应用个性化，breakdown.factor 全为 1', () => {
      const r = calculateRiskScore(moderateData, {
        weightFactors: { emotion: 0.7, behavior: 0.7, diary: 0.7 },
        offset: -10,
        sampleCount: 7,
      });
      expect(r.calibration.applied).toBe(false);
      expect(r.breakdown.emotion.factor).toBe(1);
      expect(r.breakdown.behavior.factor).toBe(1);
      expect(r.breakdown.assessment.factor).toBe(1);
    });

    it('样本充足 → 应用 λ/δ，breakdown 返回 rawScore/factor/有效分', () => {
      const r = calculateRiskScore(moderateData, {
        weightFactors: { emotion: 1.3, behavior: 1.0, diary: 1.0 },
        offset: 5,
        sampleCount: 10,
      });
      expect(r.calibration.applied).toBe(true);
      expect(r.breakdown.emotion.factor).toBe(1.3);
      expect(typeof r.breakdown.emotion.rawScore).toBe('number');
      expect(r.breakdown.emotion.score).toBe(Math.round(r.breakdown.emotion.rawScore * 1.3));
      expect(r.breakdown.assessment.factor).toBe(1); // 临床量表冻结
      expect(r.breakdown.chat.factor).toBe(1);       // 历史通道冻结
      expect(r.calibration.perSignal.assessment).toBe(1);
    });

    it('危机不可被个性化降级：基线 critical（C-SSRS 急性）+ 强降级个性化 → 仍 critical', () => {
      const r = calculateRiskScore(
        {
          emotionRecords: [{ sentimentScore: 0.5, riskLevel: 'low' }],
          behaviorData: {},
          assessments: [{ type: 'CSSRS', totalScore: 0, scores: [0, 0, 1, 0, 0] }],
          conversationSummaries: [],
          diaries: [],
        },
        {
          weightFactors: { emotion: 0.7, behavior: 0.7, diary: 0.7 },
          offset: -10,
          sampleCount: 20,
        }
      );
      expect(r.riskLevel).toBe('critical');
      // 危机分数以基线为准，不个性化
      expect(r.totalScore).toBe(r.baselineScore);
    });

    it('个性化不能凭空制造 critical：中低分 + 极端放大个性化 → 最高 high（totalScore<=90）', () => {
      const r = calculateRiskScore(moderateData, {
        weightFactors: { emotion: 1.3, behavior: 1.3, diary: 1.3 },
        offset: 10,
        sampleCount: 20,
      });
      expect(r.riskLevel).not.toBe('critical');
      expect(r.totalScore).toBeLessThanOrEqual(90);
    });

    it('offset 越界被 clamp（防御渲染层异常输入）', () => {
      const r = calculateRiskScore(moderateData, {
        weightFactors: { emotion: 1, behavior: 1, diary: 1 },
        offset: 999,
        sampleCount: 20,
      });
      expect(r.calibration.offset).toBeLessThanOrEqual(10);
      expect(r.calibration.offset).toBeGreaterThanOrEqual(-10);
    });

    it('不传 personalization → applied=false 且行为与基线一致', () => {
      const r = calculateRiskScore(moderateData);
      expect(r.calibration.applied).toBe(false);
      expect(r.totalScore).toBe(r.baselineScore);
    });
  });
});
