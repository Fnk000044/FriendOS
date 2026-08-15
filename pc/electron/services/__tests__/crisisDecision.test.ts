/**
 * crisisDecision.cjs 纯函数单测（方案A 双确认 + 个人化误报降级）
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  decideCrisisLevel,
  personalFalseAlarm,
  bigramSimilarity,
} = require('../crisisDecision.cjs') as {
  decideCrisisLevel: (opts: {
    crisisProb: number;
    scan: { hasCrisis: boolean; strongPhrases: string[] };
    text: string;
    crisisFeedback?: Array<{ text: string; verdict: 'false_alarm' }>;
  }) => { level: string | null; crisisLevel: number; downgradedByUser: boolean; crisisSignal: string };
  personalFalseAlarm: (text: string, fb?: Array<{ text: string; verdict: string }>) => boolean;
  bigramSimilarity: (a: string, b: string) => number;
};

const noSignal = { hasCrisis: false, strongPhrases: [] };
const keywordHit = { hasCrisis: true, strongPhrases: [] };
const strongHit = { hasCrisis: false, strongPhrases: ['没有意义'] };

describe('decideCrisisLevel — 方案A 双确认', () => {
  it('ONNX 单路危机（无语义佐证）→ 降为 high，不弹全屏', () => {
    const d = decideCrisisLevel({ crisisProb: 0.9, scan: noSignal, text: '我需要药物来帮助睡眠' });
    expect(d.level).toBe('high');
    expect(d.crisisLevel).toBe(2);
    expect(d.crisisSignal).toBe('onnx_only');
  });

  it('ONNX 危机 + L1 危机词 → crisis（弹窗）', () => {
    const d = decideCrisisLevel({ crisisProb: 0.6, scan: keywordHit, text: '我真的想死' });
    expect(d.level).toBe('crisis');
    expect(d.crisisLevel).toBe(3);
    expect(d.crisisSignal).toBe('onnx+keyword');
  });

  it('ONNX 危机 + 语义强词（无意义感）→ crisis（弹窗）', () => {
    const d = decideCrisisLevel({ crisisProb: 0.7, scan: strongHit, text: '觉得一切都没有意义了' });
    expect(d.level).toBe('crisis');
    expect(d.crisisLevel).toBe(3);
    expect(d.crisisSignal).toBe('onnx+strong');
  });

  it('ONNX 危机 + 语义强词 + 个人化误报（≥2 相似）→ 降为 high', () => {
    const fb = [
      { text: '我总觉得一切都没有意义', verdict: 'false_alarm' as const },
      { text: '一切都没有意义了，只是抱怨', verdict: 'false_alarm' as const },
    ];
    const d = decideCrisisLevel({ crisisProb: 0.8, scan: strongHit, text: '觉得一切都没有意义了', crisisFeedback: fb });
    expect(d.level).toBe('high');
    expect(d.crisisLevel).toBe(2);
    expect(d.downgradedByUser).toBe(true);
  });

  it('安全边界：L1 硬词命中时，个人化误报绝不能降级', () => {
    const fb = [
      { text: '我想死了', verdict: 'false_alarm' as const },
      { text: '我想死，只是说说', verdict: 'false_alarm' as const },
    ];
    const d = decideCrisisLevel({ crisisProb: 0.8, scan: keywordHit, text: '我想死', crisisFeedback: fb });
    expect(d.level).toBe('crisis');
    expect(d.crisisLevel).toBe(3);
    expect(d.downgradedByUser).toBe(false);
  });

  it('危机概率不足时维持原分级：关键词+中置信 → high / 仅关键词 → medium', () => {
    const d1 = decideCrisisLevel({ crisisProb: 0.4, scan: keywordHit, text: '我想死' });
    expect(d1.level).toBe('high');
    const d2 = decideCrisisLevel({ crisisProb: 0.2, scan: keywordHit, text: '我想死' });
    expect(d2.level).toBe('medium');
  });

  it('无任何信号 → level null（交由负面情绪常规逻辑）', () => {
    const d = decideCrisisLevel({ crisisProb: 0.1, scan: noSignal, text: '今天天气不错' });
    expect(d.level).toBeNull();
  });
});

describe('personalFalseAlarm — 相似度投票', () => {
  it('少于 2 条相似样本不降级（防单条噪声）', () => {
    const fb = [{ text: '我总觉得一切都没有意义', verdict: 'false_alarm' as const }];
    expect(personalFalseAlarm('觉得一切都没有意义了', fb)).toBe(false);
  });

  it('≥2 条相似样本才降级', () => {
    const fb = [
      { text: '我总觉得一切都没有意义', verdict: 'false_alarm' as const },
      { text: '一切都没有意义了，只是抱怨', verdict: 'false_alarm' as const },
    ];
    expect(personalFalseAlarm('觉得一切都没有意义了', fb)).toBe(true);
  });

  it('不相似样本不触发', () => {
    const fb = [
      { text: '我总觉得一切都没有意义', verdict: 'false_alarm' as const },
      { text: '一切都没有意义了，只是抱怨', verdict: 'false_alarm' as const },
    ];
    expect(personalFalseAlarm('今天天气很好', fb)).toBe(false);
  });

  it('空反馈数组 → false', () => {
    expect(personalFalseAlarm('任何文本', [])).toBe(false);
    expect(personalFalseAlarm('任何文本', undefined as never)).toBe(false);
  });
});

describe('bigramSimilarity', () => {
  it('相同文本相似度为 1，无关文本接近 0', () => {
    expect(bigramSimilarity('一切都没有意义', '一切都没有意义')).toBe(1);
    expect(bigramSimilarity('一切都没有意义', '今天天气很好')).toBeLessThan(0.3);
  });
});
