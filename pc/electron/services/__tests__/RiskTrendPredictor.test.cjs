/**
 * RiskTrendPredictor 测试（node 环境，createRequire 加载）
 *
 * 覆盖（任务列表 T03 硬性用例）：
 * 1. 上升序列 riskUpgradeProb 低于下降序列
 * 2. 样本不足回退 heuristic（method 如实标注）
 * 3. 输出字段完整（riskUpgradeProb / moodForecast7d[7] / riskTrend / confidence / method / note）
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { predict, linearRegression, forecastMood, heuristicProb } = require('../RiskTrendPredictor.cjs');

/** 构造每日序列：moods 1-5，lateNight 由低情绪推导 */
function makeSeries(moods, extra = {}) {
  return moods.map((mood, i) => ({
    date: `2026-07-${String(1 + i).padStart(2, '0')}`,
    mood,
    diaryWritten: extra.diaryWritten !== false,
    lateNight: mood <= 2,
    riskScore: Math.round((5 - mood) * 20),
  }));
}

function makeRisingSeries(n = 10) {
  const moods = Array.from({ length: n }, (_, i) => Math.round(1 + (i / (n - 1)) * 4));
  return makeSeries(moods);
}

function makeFallingSeries(n = 10) {
  const moods = Array.from({ length: n }, (_, i) => Math.round(5 - (i / (n - 1)) * 4));
  return makeSeries(moods);
}

describe('RiskTrendPredictor', () => {
  it('上升序列 riskUpgradeProb 低于下降序列（启发式路径）', () => {
    const rising = predict({ dailySeries: makeRisingSeries(10) });
    const falling = predict({ dailySeries: makeFallingSeries(10) });

    // 10 天 → 带标签窗口 < 8 → 启发式（如实标注）
    expect(rising.method).toBe('heuristic-fallback');
    expect(falling.method).toBe('heuristic-fallback');

    expect(rising.riskUpgradeProb).toBeLessThan(falling.riskUpgradeProb);
  });

  it('样本不足回退 heuristic 且字段完整', () => {
    const result = predict({ dailySeries: makeRisingSeries(8) });
    expect(result.method).toBe('heuristic-fallback');
    expect(result.note).toContain('样本不足');
    expect(result.note).toContain('risk_methodology');
    expect(result.moodForecast7d).toHaveLength(7);
    expect(result.riskUpgradeProb).toBeGreaterThanOrEqual(0);
    expect(result.riskUpgradeProb).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThan(0);
    expect(['rising', 'stable', 'falling']).toContain(result.riskTrend);
  });

  it('数据不足（<7 天）返回安全默认值', () => {
    const result = predict({ dailySeries: makeRisingSeries(5) });
    expect(result.moodForecast7d).toEqual([]);
    expect(result.method).toBe('heuristic-fallback');
    expect(result.riskUpgradeProb).toBe(0.5);
  });

  it('足够样本（30 天）走逻辑回归或如实回退，字段完整', () => {
    const result = predict({ dailySeries: makeRisingSeries(30) });
    expect(['logistic-regression', 'heuristic-fallback']).toContain(result.method);
    expect(result.moodForecast7d).toHaveLength(7);
    expect(result.riskUpgradeProb).toBeGreaterThanOrEqual(0);
    expect(result.riskUpgradeProb).toBeLessThanOrEqual(1);
    expect(typeof result.confidence).toBe('number');
    expect(result.note.length).toBeGreaterThan(0);
  });

  it('moodForecast7d 由线性回归外推（上升序列预测值上升）', () => {
    const moods = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
    const result = predict({ dailySeries: makeSeries(moods) });
    // 上升序列：预测均值应高于当前均值
    const forecastMean = result.moodForecast7d.reduce((a, b) => a + b, 0) / 7;
    expect(forecastMean).toBeGreaterThan(3);
  });

  it('linearRegression 闭式解正确', () => {
    const lr = linearRegression([0, 1, 2, 3], [1, 2, 3, 4]);
    expect(lr.slope).toBeCloseTo(1, 5);
    expect(lr.intercept).toBeCloseTo(1, 5);
  });

  it('forecastMood 便捷入口返回 7 个值', () => {
    const f = forecastMood([1, 2, 3, 4, 5]);
    expect(f).toHaveLength(7);
    expect(f[0]).toBeGreaterThanOrEqual(1);
    expect(f[0]).toBeLessThanOrEqual(5);
  });

  it('heuristicProb 随斜率下降而上升', () => {
    const rising = heuristicProb({ moodMean: 4, moodTrend: 0.5, moodVolatility: 0.2, lateNightFreq: 0, diarySkipDays: 0 });
    const falling = heuristicProb({ moodMean: 2, moodTrend: -0.5, moodVolatility: 1.0, lateNightFreq: 2, diarySkipDays: 2 });
    expect(falling).toBeGreaterThan(rising);
    expect(falling).toBeLessThanOrEqual(0.95);
    expect(rising).toBeGreaterThanOrEqual(0.05);
  });
});
