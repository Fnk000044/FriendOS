import { describe, it, expect } from 'vitest';
import {
  clamp,
  shrinkage,
  defaultModel,
  applyDriftDecay,
  updateSentimentPriorsPure,
  updateRiskPure,
  updateEma,
  buildSentimentCalibration,
  buildRiskPersonalization,
  SENTIMENT_MIN_SAMPLES,
  RISK_MIN_SAMPLES,
} from '../SelfEvolutionService';

describe('SelfEvolutionService 纯函数', () => {
  describe('shrinkage / clamp', () => {
    it('shrinkage w = min(1, N/10)', () => {
      expect(shrinkage(0)).toBe(0);
      expect(shrinkage(5)).toBe(0.5);
      expect(shrinkage(10)).toBe(1);
      expect(shrinkage(20)).toBe(1);
    });

    it('clamp 有界', () => {
      expect(clamp(5, 0, 3)).toBe(3);
      expect(clamp(-1, 0, 3)).toBe(0);
      expect(clamp(NaN, 0, 3)).toBe(0);
    });
  });

  describe('情感先验更新（危机冻结）', () => {
    it('纠正 negative→positive 增大 pos 先验、减小 neg 先验，保持零和', () => {
      const priors = updateSentimentPriorsPure({ neg: 0, neu: 0, pos: 0 }, 'negative', 'positive', 0);
      expect(priors.pos).toBeGreaterThan(0);
      expect(priors.neg).toBeLessThan(0);
      const sum = priors.neg + priors.neu + priors.pos;
      expect(Math.abs(sum)).toBeLessThan(1e-6);
      // 有界
      expect(priors.pos).toBeLessThanOrEqual(1);
      expect(priors.neg).toBeGreaterThanOrEqual(-1);
    });

    it('纠正到 crisis（危机通道无对应先验，仅按公式调整被纠错类）', () => {
      const base = { neg: 0, neu: 0, pos: 0 };
      const priors = updateSentimentPriorsPure(base, 'negative', 'crisis', 0);
      // crisis 不产生/修改任何先验维度（结构上无 crisis key）
      expect(Object.keys(priors).sort()).toEqual(['neg', 'neu', 'pos']);
      // 被纠错的 predicted 类 'negative' 先验下降（模型预测错，下调该类）
      expect(priors.neg).toBeLessThan(0);
      // 仍保持零和
      const sum = priors.neg + priors.neu + priors.pos;
      expect(Math.abs(sum)).toBeLessThan(1e-6);
    });

    it('学习率随样本数衰减', () => {
      const first = updateSentimentPriorsPure({ neg: 0, neu: 0, pos: 0 }, 'negative', 'positive', 0);
      const late = updateSentimentPriorsPure({ neg: 0, neu: 0, pos: 0 }, 'negative', 'positive', 100);
      expect(Math.abs(late.pos)).toBeLessThan(Math.abs(first.pos));
    });

    it('先验始终有界 ±1', () => {
      let priors = { neg: 0, neu: 0, pos: 0 };
      for (let i = 0; i < 500; i++) {
        priors = updateSentimentPriorsPure(priors, 'negative', 'positive', i);
      }
      for (const k of ['neg', 'neu', 'pos'] as const) {
        expect(priors[k]).toBeGreaterThanOrEqual(-1);
        expect(priors[k]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('风险个性化更新（量表/危机冻结）', () => {
    it('overestimate → offset 下降（有界 -10）', () => {
      const risk = { weightFactors: { emotion: 1, behavior: 1, diary: 1 }, offset: 0, sampleCount: 0 };
      const next = updateRiskPure(risk, 'overestimate');
      expect(next.offset).toBeLessThan(0);
      expect(next.offset).toBeGreaterThanOrEqual(-10);
    });

    it('underestimate + scope=emotion → emotion λ 上升（有界 1.3）', () => {
      const risk = { weightFactors: { emotion: 1, behavior: 1, diary: 1 }, offset: 0, sampleCount: 0 };
      const next = updateRiskPure(risk, 'underestimate', 'emotion');
      expect(next.weightFactors.emotion).toBeGreaterThan(1);
      expect(next.weightFactors.emotion).toBeLessThanOrEqual(1.3);
      expect(next.weightFactors.behavior).toBe(1);
    });

    it('scope=assessment（临床金标准冻结）→ λ 完全不变', () => {
      const risk = { weightFactors: { emotion: 1, behavior: 1, diary: 1 }, offset: 0, sampleCount: 0 };
      const next = updateRiskPure(risk, 'underestimate', 'assessment');
      expect(next.weightFactors).toEqual({ emotion: 1, behavior: 1, diary: 1 });
      expect(next.offset).toBeGreaterThan(0);
    });

    it('offset 始终有界 ±10', () => {
      let risk = { weightFactors: { emotion: 1, behavior: 1, diary: 1 }, offset: 0, sampleCount: 0 };
      for (let i = 0; i < 200; i++) risk = updateRiskPure(risk, 'underestimate');
      expect(risk.offset).toBeLessThanOrEqual(10);
    });
  });

  describe('干预 EMA', () => {
    it('α=0.3：e0=0.5, r=1 → 0.65；r=0 → 0.35', () => {
      const e1 = updateEma(0.5, 1);
      expect(e1).toBeCloseTo(0.65, 5);
      const e0 = updateEma(0.5, 0);
      expect(e0).toBeCloseTo(0.35, 5);
    });
  });

  describe('30 天漂移衰减', () => {
    it('30 天内不衰减', () => {
      const model = defaultModel();
      model.sentiment.priors.pos = 0.8;
      model.risk.offset = -6;
      model.lastUpdated = Date.now() - 10 * 24 * 60 * 60 * 1000;
      const next = applyDriftDecay(model);
      expect(next.sentiment.priors.pos).toBeCloseTo(0.8, 5);
      expect(next.risk.offset).toBeCloseTo(-6, 5);
    });

    it('超过 30 天 → 参数向全局半衰期回退并刷新 lastUpdated', () => {
      const now = Date.now();
      const model = defaultModel();
      model.sentiment.priors.pos = 0.8;
      model.risk.offset = -6;
      model.risk.weightFactors.emotion = 1.2;
      model.lastUpdated = now - 40 * 24 * 60 * 60 * 1000;
      const next = applyDriftDecay(model, now);
      expect(next.sentiment.priors.pos).toBeCloseTo(0.4, 5);
      expect(next.risk.offset).toBeCloseTo(-3, 5);
      expect(next.risk.weightFactors.emotion).toBeCloseTo(1.1, 5);
      expect(next.lastUpdated).toBe(now);
    });
  });

  describe('校准构建（冷启动 + 收缩）', () => {
    it('情感样本 < 5 → 回退全局默认（先验全 0）', () => {
      const model = defaultModel();
      model.sentiment.sampleCount = 4;
      model.sentiment.priors.pos = 0.9;
      const cal = buildSentimentCalibration(model);
      expect(cal.sampleCount).toBe(0);
      expect(cal.priors).toEqual({ neg: 0, neu: 0, pos: 0 });
    });

    it('情感样本 >= 5 → 应用收缩', () => {
      const model = defaultModel();
      model.sentiment.sampleCount = SENTIMENT_MIN_SAMPLES; // 5
      model.sentiment.priors.pos = 1.0;
      const cal = buildSentimentCalibration(model);
      expect(cal.sampleCount).toBe(SENTIMENT_MIN_SAMPLES);
      // w = 5/10 = 0.5 → pos ≈ 0.5
      expect(cal.priors.pos).toBeCloseTo(0.5, 4);
    });

    it('风险样本 < 8 → 回退默认（λ=1, δ=0）', () => {
      const model = defaultModel();
      model.risk.sampleCount = 7;
      model.risk.offset = 8;
      const cal = buildRiskPersonalization(model);
      expect(cal.sampleCount).toBe(0);
      expect(cal.offset).toBe(0);
      expect(cal.weightFactors).toEqual({ emotion: 1, behavior: 1, diary: 1 });
    });

    it('风险样本 >= 8 → 应用收缩 + clamp', () => {
      const model = defaultModel();
      model.risk.sampleCount = RISK_MIN_SAMPLES; // 8
      model.risk.offset = 10;
      model.risk.weightFactors.emotion = 1.3;
      const cal = buildRiskPersonalization(model);
      expect(cal.sampleCount).toBe(RISK_MIN_SAMPLES);
      // w = 8/10 = 0.8 → offset = 8
      expect(cal.offset).toBeCloseTo(8, 4);
      // λ = 1 + 0.8*(1.3-1) = 1.24
      expect(cal.weightFactors.emotion).toBeCloseTo(1.24, 4);
    });
  });
});
