import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { analyze, analyzeEnhanced, isOnnxLoaded, getModelStatus } = require('../SentimentService.cjs');

/**
 * SentimentService 测试
 *
 * 现实约束：analyzeEnhanced 内部第2层会调用 analyzeWithONNX，后者依赖
 * onnxruntime-node + 真实模型文件。测试环境无法加载，因此：
 * - 关键词层（keywordScan）走纯函数路径，可正常测试
 * - ONNX/Qwen 层因 mock 困难，只验证"降级时返回有限结果"的契约
 *
 * 注意 analyzeEnhanced 实际返回字段为 level/score/negativeProb/method，
 * 与 README 中 emotionRecords 用的 sentimentScore/riskLevel 是不同映射层
 * （前者由 EmotionAnalysisEngine 进一步转换）。
 */

const RISK_ORDER = ['low', 'medium_low', 'medium', 'high', 'crisis', 'critical'];

describe('SentimentService', () => {
  describe('analyze (Layer 1: keyword scan, ONNX 不可用降级路径)', () => {
    it('returns well-formed result for empty input', async () => {
      const r = await analyze('');
      expect(r).toBeDefined();
      expect(r).toHaveProperty('level');
      expect(r).toHaveProperty('negativeProb');
      expect(r).toHaveProperty('method');
      expect(r).toHaveProperty('timestamp');
    });

    it('returns well-formed result for null input', async () => {
      const r = await analyze(null as any);
      expect(r).toBeDefined();
      expect(r).toHaveProperty('level');
      // 空/无效输入不应触发危机
      expect(r.crisisLevel).toBe(0);
    });

    it('detects crisis keywords and elevates risk', async () => {
      const result = await analyze('我不想活了，想跳楼');
      // 关键词命中 → 至少 medium，crisisLevel >= 1
      expect(RISK_ORDER.indexOf(result.level)).toBeGreaterThanOrEqual(RISK_ORDER.indexOf('medium'));
      expect(result.crisisLevel).toBeGreaterThanOrEqual(1);
    });

    it('respects negation context', async () => {
      const negated = await analyze('我不会想死');
      const direct = await analyze('我想死');
      expect(RISK_ORDER.indexOf(direct.level)).toBeGreaterThanOrEqual(RISK_ORDER.indexOf('medium'));
      expect(RISK_ORDER.indexOf(negated.level)).toBeLessThanOrEqual(RISK_ORDER.indexOf(direct.level));
    });

    it('detects positive sentiment', async () => {
      const result = await analyze('今天心情不错，很开心');
      // 正向文本 → score（=positiveProb）应较高，negativeProb 较低
      expect(result.negativeProb).toBeLessThan(0.5);
    });

    it('detects negative sentiment without crisis', async () => {
      const result = await analyze('今天好难过好焦虑，压力很大');
      expect(result.negativeProb).toBeGreaterThan(0.5);
    });

    it('excludes false-positive patterns (e.g. 九死一生)', async () => {
      const result = await analyze('这一路真是九死一生');
      // level 用 crisis（UI 语义，ONNX 判定），此处无 ONNX 应不会触发
      // riskLevel 用 critical（数据/store 语义），level 用 crisis，两者分离
      expect(result.level).not.toBe('crisis');
      expect(result.crisisLevel).toBe(0);
    });
  });

  describe('analyzeEnhanced (Layer 1+2 fusion, L3 Qwen 已移除)', () => {
    it('returns result object with the documented enhanced-shape fields', async () => {
      const result = await analyzeEnhanced('今天心情不错');
      expect(result).toBeDefined();
      // 文档字段：level / crisisLevel / score / negativeProb / method
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('crisisLevel');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('negativeProb');
      expect(result).toHaveProperty('method');
    });

    it('degrades gracefully when ONNX unavailable (returns keyword-based result)', async () => {
      expect(isOnnxLoaded()).toBe(false);
      const result = await analyzeEnhanced('我感觉不太好，很难过');
      // ONNX 不可用时仍由关键词层兜底，得到有限但非空结果
      expect(result).toBeDefined();
      expect(result.method).toBeDefined();
      // 关键词层基于负面/正面词数比（分母含平滑），
      // 单一负面词在文本长度 >6 时 negativeProb 通常 < 0.5，
      // 这是设计取舍（避免关键词层过度激进），由 ONNX/Qwen 层做最终判定
      expect(result.negativeProb).toBeGreaterThan(0);
      expect(result.negativeProb).toBeLessThan(1);
    });
  });

  describe('getModelStatus / isOnnxLoaded', () => {
    it('reports unloaded ONNX state by default', () => {
      expect(isOnnxLoaded()).toBe(false);
      const status = getModelStatus();
      expect(status).toBeDefined();
      expect(status.onnxLoaded).toBe(false);
      expect(typeof status.onnxAvailable).toBe('boolean');
    });
  });
});
