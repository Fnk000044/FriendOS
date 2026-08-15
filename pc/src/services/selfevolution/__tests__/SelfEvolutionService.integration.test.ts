/**
 * SelfEvolutionService 集成测试（真实 Dexie + 字段级加密 + 参数重算闭环）
 *
 * 覆盖：
 * - feedbackLogs 写入后 text/correction 以 enc:: 前缀密文落盘（读库验证）
 * - 冷启动：样本 < 门槛时校准参数回退默认（β=0、λ=1、δ=0）
 * - 收缩 + 有界 clamp：β∈[-1,1] 且 Σβ=0、λ∈[0.7,1.3]、δ∈[-10,10]
 * - 情感纠错方向性：连续纠正为 positive 后 getSentimentCalibration 的 pos 先验 > 0
 * - 风险方向性：连续「偏高」反馈后 δ clamp 在 [-10,0]，不越界
 * - 干预 EMA：r_t=1 连续上升且不超过 1；显式「没帮助」等同 r=0 惩罚
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../../db';
import {
  recordFeedback,
  computeSentimentCalibration,
  computeRiskPersonalization,
  computeInterventionEma,
  resetCalibration,
  SENTIMENT_MIN_SAMPLES,
  RISK_MIN_SAMPLES,
} from '../SelfEvolutionService';

describe('SelfEvolutionService 集成（真实 IndexedDB + 加密）', () => {
  beforeEach(async () => {
    await resetCalibration({ clearFeedback: true });
    await db.therapyRecords.clear();
  });

  describe('feedbackLogs 字段级加密落盘', () => {
    it('text/correction 以 enc:: 前缀密文落盘；枚举字段保持明文', async () => {
      await recordFeedback({
        type: 'sentiment',
        predicted: 'negative',
        feedback: 'inaccurate',
        text: '我最近真的很想不开',
        correction: 'positive',
        correctedLabel: 'positive',
        refId: 'diary-1',
      });

      const rows = await db.feedbackLogs.toArray();
      expect(rows).toHaveLength(1);
      const row = rows[0];

      expect(row.text).toMatch(/^enc::/);
      expect(row.correction).toMatch(/^enc::/);
      // 明文枚举字段
      expect(row.correctedLabel).toBe('positive');
      expect(row.predicted).toBe('negative');
      expect(row.type).toBe('sentiment');
      // 明文不应泄露自由文本
      expect(row.text).not.toContain('想不开');
    });
  });

  describe('冷启动回退默认', () => {
    it('情感样本 < 5 → priors 全 0、sampleCount=0', async () => {
      for (let i = 0; i < SENTIMENT_MIN_SAMPLES - 1; i++) {
        await recordFeedback({
          type: 'sentiment', predicted: 'negative', correctedLabel: 'positive',
          feedback: 'inaccurate', refId: `d-${i}`,
        });
      }
      const cal = await computeSentimentCalibration();
      expect(cal.sampleCount).toBe(0);
      expect(cal.priors).toEqual({ neg: 0, neu: 0, pos: 0 });
    });

    it('风险样本 < 8 → λ=1、δ=0、sampleCount=0', async () => {
      for (let i = 0; i < RISK_MIN_SAMPLES - 1; i++) {
        await recordFeedback({
          type: 'risk_level', predicted: 'medium', direction: 'overestimate',
          feedback: 'inaccurate', refId: `r-${i}`,
        });
      }
      const per = await computeRiskPersonalization();
      expect(per.sampleCount).toBe(0);
      expect(per.offset).toBe(0);
      expect(per.weightFactors).toEqual({ emotion: 1, behavior: 1, diary: 1 });
    });
  });

  describe('情感纠错方向性（先验偏移）', () => {
    it('连续纠正为 positive 后 pos 先验 > 0、neg 先验 < 0，且 Σβ=0、有界', async () => {
      for (let i = 0; i < SENTIMENT_MIN_SAMPLES; i++) {
        await recordFeedback({
          type: 'sentiment', predicted: 'negative', correctedLabel: 'positive',
          feedback: 'inaccurate', refId: `s-${i}`,
        });
      }
      const cal = await computeSentimentCalibration();
      expect(cal.sampleCount).toBe(SENTIMENT_MIN_SAMPLES);
      expect(cal.priors.pos).toBeGreaterThan(0);
      expect(cal.priors.neg).toBeLessThan(0);
      // 有界 clamp
      for (const k of ['neg', 'neu', 'pos'] as const) {
        expect(cal.priors[k]).toBeGreaterThanOrEqual(-1);
        expect(cal.priors[k]).toBeLessThanOrEqual(1);
      }
      // 零和（收缩后仍满足 Σβ≈0）
      const sum = cal.priors.neg + cal.priors.neu + cal.priors.pos;
      expect(Math.abs(sum)).toBeLessThan(1e-6);
    });
  });

  describe('风险方向性（δ clamp）', () => {
    it('连续 10 条「偏高」反馈后 δ ∈ [-10, 0]（方向正确、不越界）', async () => {
      for (let i = 0; i < 10; i++) {
        await recordFeedback({
          type: 'risk_level', predicted: 'medium', direction: 'overestimate',
          feedback: 'inaccurate', refId: `ov-${i}`,
        });
      }
      const per = await computeRiskPersonalization();
      expect(per.sampleCount).toBe(10);
      expect(per.offset).toBeLessThan(0);   // 偏高 → 下调
      expect(per.offset).toBeGreaterThanOrEqual(-10);
      expect(per.offset).toBeLessThanOrEqual(10);
    });

    it('大量「偏高」反馈后 δ 被 clamp 在 -10（不继续下探）', async () => {
      for (let i = 0; i < 40; i++) {
        await recordFeedback({
          type: 'risk_level', predicted: 'medium', direction: 'overestimate',
          feedback: 'inaccurate', refId: `clamp-${i}`,
        });
      }
      const per = await computeRiskPersonalization();
      expect(per.offset).toBe(-10);
    });

    it('「偏低」反馈方向正确：δ 上升且 ≤ 10', async () => {
      for (let i = 0; i < 10; i++) {
        await recordFeedback({
          type: 'risk_level', predicted: 'medium', direction: 'underestimate',
          feedback: 'inaccurate', refId: `un-${i}`,
        });
      }
      const per = await computeRiskPersonalization();
      expect(per.offset).toBeGreaterThan(0);
      expect(per.offset).toBeLessThanOrEqual(10);
    });
  });

  describe('干预 EMA（带遗忘因子）', () => {
    it('r_t=1 连续时 emaEffectiveness 上升且不超过 1', async () => {
      for (let i = 0; i < 5; i++) {
        await db.therapyRecords.add({
          id: `breathing-${i}`,
          type: 'breathing',
          date: `2026-08-${String(i + 1).padStart(2, '0')}`,
          data: {},
          moodBefore: 2,
          moodAfter: 4, // r=1（moodAfter > moodBefore）
          createdAt: new Date().toISOString(),
        });
      }
      const ema = await computeInterventionEma();
      const e = ema.emaEffectiveness.breathing;
      expect(e).toBeGreaterThan(0.5);
      expect(e).toBeLessThanOrEqual(1);
      expect(ema.effectiveN.breathing).toBe(5);
    });

    it('显式「没帮助」等同 r=0 惩罚，压低有效率', async () => {
      // 3 次有效练习（r=1）
      for (let i = 0; i < 3; i++) {
        await db.therapyRecords.add({
          id: `mindfulness-${i}`,
          type: 'mindfulness',
          date: `2026-08-${String(i + 1).padStart(2, '0')}`,
          data: {},
          moodBefore: 2,
          moodAfter: 5,
          createdAt: new Date().toISOString(),
        });
      }
      const before = await computeInterventionEma();
      const eBefore = before.emaEffectiveness.mindfulness;
      expect(eBefore).toBeGreaterThan(0.5);

      // 显式「没帮助」反馈（correction='not_helpful'，加密后由 compute 解密并映射为 r=0）
      await recordFeedback({
        type: 'recommendation', predicted: 'mindfulness',
        correction: 'not_helpful', refId: 'mindfulness', feedback: 'inaccurate',
      });

      const after = await computeInterventionEma();
      const eAfter = after.emaEffectiveness.mindfulness;
      expect(eAfter).toBeLessThan(eBefore);
      expect(eAfter).toBeGreaterThanOrEqual(0);
      // 有效样本量计入显式反馈
      expect(after.effectiveN.mindfulness).toBe(4);
    });

    it('显式「有帮助」等同 r=1，抬高有效率', async () => {
      await recordFeedback({
        type: 'recommendation', predicted: 'breathing',
        correction: 'helpful', refId: 'breathing', feedback: 'accurate',
      });
      const ema = await computeInterventionEma();
      expect(ema.emaEffectiveness.breathing).toBeGreaterThan(0.5);
      expect(ema.effectiveN.breathing).toBe(1);
    });
  });
});
