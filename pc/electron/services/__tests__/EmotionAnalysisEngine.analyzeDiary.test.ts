/**
 * Bug 修复回归：EmotionAnalysisEngine.analyzeDiary 应返回非 undefined 的 level/score/keywords
 *
 * 历史 bug：analyzeDiary 直接调 SentimentService.analyzeWithONNX()，该函数只返回 prob、
 * 不返回 level/score/keywords，导致 sentiment?.level 恒为 undefined、sentimentScore 恒回退 0。
 * 修复后改走 analyzeEnhanced()，应返回完整字段。
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { analyzeDiary } = require('../EmotionAnalysisEngine.cjs');

describe('EmotionAnalysisEngine.analyzeDiary（level/score/keywords 非 undefined）', () => {
  it('正常日记返回非 undefined 的 sentimentScore/riskLevel/keywords', async () => {
    const result = await analyzeDiary({
      id: 'diary-1',
      date: '2026-08-13',
      content: '今天很难过，压力很大，一直很焦虑',
      mood: 2,
      createdAt: '2026-08-13T22:00:00.000Z',
    });

    expect(result).not.toBeNull();
    expect(result).toBeDefined();

    // 关键：修复后 sentimentScore 是有限数值（不再是 undefined 回退 0）
    expect(typeof result.sentimentScore).toBe('number');
    expect(Number.isFinite(result.sentimentScore)).toBe(true);

    // riskLevel 是字符串（不再恒为 'low' 兜底）
    expect(typeof result.riskLevel).toBe('string');
    expect(result.riskLevel.length).toBeGreaterThan(0);

    // keywords 是数组（不再是 undefined → []）
    expect(Array.isArray(result.keywords)).toBe(true);
  });

  it('正面日记 keywords/sentimentScore 有效', async () => {
    const result = await analyzeDiary({
      id: 'diary-2',
      date: '2026-08-13',
      content: '今天很开心，心情特别快乐',
      mood: 5,
      createdAt: '2026-08-13T22:00:00.000Z',
    });

    expect(result).not.toBeNull();
    expect(typeof result.sentimentScore).toBe('number');
    expect(Array.isArray(result.keywords)).toBe(true);
  });

  it('空内容返回 null（防御）', async () => {
    const result = await analyzeDiary({
      id: 'diary-3',
      date: '2026-08-13',
      content: '',
      mood: 3,
      createdAt: '2026-08-13T22:00:00.000Z',
    });
    expect(result).toBeNull();
  });

  it('透传 calibration 不破坏返回结构', async () => {
    const result = await analyzeDiary(
      {
        id: 'diary-4',
        date: '2026-08-13',
        content: '今天有点累',
        mood: 3,
        createdAt: '2026-08-13T22:00:00.000Z',
      },
      { priors: { neg: 0, neu: 0, pos: 0 }, temperature: 1.0, sampleCount: 0 },
    );
    expect(result).not.toBeNull();
    expect(typeof result.sentimentScore).toBe('number');
    expect(Array.isArray(result.keywords)).toBe(true);
  });
});
