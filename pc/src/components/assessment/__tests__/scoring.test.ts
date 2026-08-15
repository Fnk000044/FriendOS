import { describe, it, expect } from 'vitest';

/**
 * 评估量表评分逻辑测试
 * 验证 PHQ-9、GAD-7、PSS-10 的评分阈值和分级
 */

// PHQ-9 评分分级 (Kroenke et al., 2001)
function getPHQ9Level(scores: number[]): string {
  const total = scores.reduce((a, b) => a + b, 0);
  if (total <= 4) return 'minimal';
  if (total <= 9) return 'mild';
  if (total <= 14) return 'moderate';
  if (total <= 19) return 'moderately_severe';
  return 'severe';
}

// GAD-7 评分分级 (Spitzer et al., 2006)
function getGAD7Level(scores: number[]): string {
  const total = scores.reduce((a, b) => a + b, 0);
  if (total <= 4) return 'minimal';
  if (total <= 9) return 'mild';
  if (total <= 14) return 'moderate';
  return 'severe';
}

// PSS-10 评分分级 (Cohen et al., 1983)
// 包含反向计分：items 4,5,7,9 (index 3,4,6,8)
function getPSS10Level(rawScores: number[]): string {
  const reverseIndices = [3, 4, 6, 8];
  const total = rawScores.reduce((sum, score, i) => {
    const adjusted = reverseIndices.includes(i) ? (4 - score) : score;
    return sum + adjusted;
  }, 0);
  if (total <= 13) return 'low';
  if (total <= 26) return 'moderate';
  return 'high';
}

describe('PHQ-9 Scoring', () => {
  it('should classify minimal (0-4)', () => {
    expect(getPHQ9Level([0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe('minimal');
    expect(getPHQ9Level([1, 1, 1, 1, 0, 0, 0, 0, 0])).toBe('minimal');
  });

  it('should classify mild (5-9)', () => {
    expect(getPHQ9Level([1, 1, 1, 1, 1, 0, 0, 0, 0])).toBe('mild');
    expect(getPHQ9Level([2, 2, 2, 2, 1, 0, 0, 0, 0])).toBe('mild');
  });

  it('should classify moderate (10-14)', () => {
    expect(getPHQ9Level([2, 2, 2, 2, 2, 0, 0, 0, 0])).toBe('moderate');
    expect(getPHQ9Level([2, 2, 2, 2, 2, 2, 2, 0, 0])).toBe('moderate');
  });

  it('should classify moderately_severe (15-19)', () => {
    expect(getPHQ9Level([2, 2, 2, 2, 2, 2, 2, 2, 1])).toBe('moderately_severe');
  });

  it('should classify severe (20-27)', () => {
    expect(getPHQ9Level([3, 3, 3, 3, 3, 3, 3, 3, 0])).toBe('severe');
    expect(getPHQ9Level([3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe('severe');
  });

  it('should handle boundary values correctly', () => {
    // Exactly 4 = minimal
    expect(getPHQ9Level([1, 1, 1, 1, 0, 0, 0, 0, 0])).toBe('minimal');
    // Exactly 5 = mild
    expect(getPHQ9Level([1, 1, 1, 1, 1, 0, 0, 0, 0])).toBe('mild');
    // Exactly 9 = mild
    expect(getPHQ9Level([2, 2, 2, 2, 1, 0, 0, 0, 0])).toBe('mild');
    // Exactly 10 = moderate
    expect(getPHQ9Level([2, 2, 2, 2, 2, 0, 0, 0, 0])).toBe('moderate');
  });
});

describe('GAD-7 Scoring', () => {
  it('should classify minimal (0-4)', () => {
    expect(getGAD7Level([0, 0, 0, 0, 0, 0, 0])).toBe('minimal');
  });

  it('should classify mild (5-9)', () => {
    expect(getGAD7Level([1, 1, 1, 1, 1, 0, 0])).toBe('mild');
  });

  it('should classify moderate (10-14)', () => {
    expect(getGAD7Level([2, 2, 2, 2, 2, 0, 0])).toBe('moderate');
  });

  it('should classify severe (15-21)', () => {
    expect(getGAD7Level([3, 3, 3, 3, 3, 0, 0])).toBe('severe');
    expect(getGAD7Level([3, 3, 3, 3, 3, 3, 3])).toBe('severe');
  });
});

describe('PSS-10 Scoring', () => {
  it('should handle reverse scoring for items 4,5,7,9 (index 3,4,6,8)', () => {
    // All zeros: reverse items (3,4,6,8) become 4-0=4, total = 4*4 = 16
    const allZeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(getPSS10Level(allZeros)).toBe('moderate'); // 16 = moderate

    // All 4s: forward items (0,1,2,5,7,9) = 6*4=24, reverse items = 4*(4-4)=0, total = 24
    const allFours = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    expect(getPSS10Level(allFours)).toBe('moderate'); // 24 = moderate
  });

  it('should classify low stress (0-13)', () => {
    // Low forward scores, high reverse scores (so reverse of high = low)
    // Forward items 0,1,2,5,7,9: all 0 = 0
    // Reverse items 3,4,6,8: all 4, reverse = 4-4 = 0, total = 0
    const lowStress = [0, 0, 0, 4, 4, 0, 4, 0, 4, 0];
    expect(getPSS10Level(lowStress)).toBe('low'); // 0 = low
  });

  it('should classify moderate stress (14-26)', () => {
    // Forward: [2,2,2,2,2,2,2,2,2,2]
    // Reverse items 3,4,6,8: 4*(4-2) = 8
    // Forward items 0,1,2,5,7,9: 6*2 = 12
    // Total = 20
    const moderateStress = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    expect(getPSS10Level(moderateStress)).toBe('moderate');
  });

  it('should classify high stress (27-40)', () => {
    // Forward items all 4: 6*4 = 24
    // Reverse items all 0: 4*(4-0) = 16
    // Total = 40
    const highStress = [4, 4, 4, 0, 0, 4, 0, 4, 0, 4];
    expect(getPSS10Level(highStress)).toBe('high'); // 40 = high
  });
});
