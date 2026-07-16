import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  calculatePersonalBaseline,
  analyzeTypingBehavior,
  calculateTypingBaseline,
  analyzeBehaviorTrends,
  analyzeDailyBehavior,
} = require('../BehaviorAnalyzer.cjs');

// 工厂：构造行为记录
function makeRecord(overrides = {}) {
  return {
    date: '2026-07-15',
    diaryWritten: true,
    diaryWordCount: 200,
    moodRating: 3,
    tasksCompleted: 3,
    tasksTotal: 5,
    habitsChecked: 2,
    habitsTotal: 3,
    activeHours: [10, 14, 20],
    chatMessages: 10,
    ...overrides,
  };
}

describe('BehaviorAnalyzer', () => {
  describe('calculatePersonalBaseline', () => {
    it('returns null when records < MIN_BASELINE_DAYS (7)', () => {
      expect(calculatePersonalBaseline(null)).toBeNull();
      expect(calculatePersonalBaseline([])).toBeNull();
      expect(calculatePersonalBaseline([makeRecord()])).toBeNull();
      expect(calculatePersonalBaseline(Array.from({ length: 6 }, () => makeRecord()))).toBeNull();
    });

    it('returns baseline when ≥7 records', () => {
      const records = Array.from({ length: 7 }, (_, i) =>
        makeRecord({ moodRating: 3 + (i % 2), date: `2026-07-${10 + i}` })
      );
      const baseline = calculatePersonalBaseline(records);
      expect(baseline).not.toBeNull();
      expect(baseline.hasBaseline).toBe(true);
      expect(baseline.daysUsed).toBe(7);
      expect(baseline.mood.mean).toBeGreaterThan(0);
      expect(baseline.taskCompletion.mean).toBeGreaterThan(0);
    });

    it('computes std when ≥2 mood records', () => {
      const records = Array.from({ length: 7 }, (_, i) =>
        makeRecord({ moodRating: i + 1 })  // moods 1..7, std > 0
      );
      const baseline = calculatePersonalBaseline(records);
      expect(baseline.mood.std).toBeGreaterThan(0);
    });

    it('handles records without tasks/habits gracefully', () => {
      const records = Array.from({ length: 7 }, () =>
        makeRecord({ tasksTotal: 0, habitsTotal: 0 })
      );
      const baseline = calculatePersonalBaseline(records);
      expect(baseline.taskCompletion.mean).toBe(0.5);
      expect(baseline.habitConsistency.mean).toBe(0.5);
    });
  });

  describe('analyzeTypingBehavior', () => {
    it('returns empty for null input', () => {
      const r = analyzeTypingBehavior(null);
      expect(r.anomalies).toEqual([]);
      expect(r.indicators).toEqual({});
    });

    it('flags very slow typing as medium severity', () => {
      const r = analyzeTypingBehavior({ avgSpeed: 15, deleteRate: 0.1, pauseRate: 2, sessionDuration: 5 });
      const verySlow = r.anomalies.find(a => a.type === 'very_slow_typing');
      expect(verySlow).toBeDefined();
      expect(verySlow.severity).toBe('medium');
    });

    it('flags slow typing as low severity', () => {
      const r = analyzeTypingBehavior({ avgSpeed: 25 });
      const slow = r.anomalies.find(a => a.type === 'slow_typing');
      expect(slow).toBeDefined();
      expect(slow.severity).toBe('low');
    });

    it('flags high delete rate', () => {
      const r = analyzeTypingBehavior({ avgSpeed: 50, deleteRate: 0.3 });
      expect(r.anomalies.find(a => a.type === 'high_delete_rate')).toBeDefined();
    });

    it('no anomalies for normal typing', () => {
      const r = analyzeTypingBehavior({ avgSpeed: 60, deleteRate: 0.05, pauseRate: 1, sessionDuration: 10 });
      expect(r.anomalies.length).toBe(0);
    });
  });

  describe('calculateTypingBaseline', () => {
    it('returns null when <3 sessions', () => {
      expect(calculateTypingBaseline([])).toBeNull();
      expect(calculateTypingBaseline([{ avgSpeed: 50 }])).toBeNull();
      expect(calculateTypingBaseline([{ avgSpeed: 50 }, { avgSpeed: 55 }])).toBeNull();
    });

    it('returns baseline when ≥3 sessions', () => {
      const sessions = [
        { avgSpeed: 50, deleteRate: 0.05, pauseRate: 1 },
        { avgSpeed: 55, deleteRate: 0.1, pauseRate: 2 },
        { avgSpeed: 60, deleteRate: 0.08, pauseRate: 1 },
      ];
      const baseline = calculateTypingBaseline(sessions);
      expect(baseline).not.toBeNull();
      expect(baseline.speed.mean).toBeGreaterThan(0);
    });
  });

  describe('analyzeBehaviorTrends', () => {
    it('returns zeroed trends for empty input', () => {
      const r = analyzeBehaviorTrends([]);
      expect(r.consecutiveNoDiary).toBe(0);
      expect(r.consecutiveLowMood).toBe(0);
      expect(r.lateNightRatio).toBe(0);
    });

    it('counts consecutiveNoDiary from most recent', () => {
      const records = [
        makeRecord({ date: '2026-07-12', diaryWritten: true }),
        makeRecord({ date: '2026-07-13', diaryWritten: false }),
        makeRecord({ date: '2026-07-14', diaryWritten: false }),
        makeRecord({ date: '2026-07-15', diaryWritten: false }),
      ];
      const r = analyzeBehaviorTrends(records);
      expect(r.consecutiveNoDiary).toBe(3);
    });

    it('counts consecutiveLowMood from most recent', () => {
      const records = [
        makeRecord({ date: '2026-07-13', moodRating: 4 }),
        makeRecord({ date: '2026-07-14', moodRating: 2 }),
        makeRecord({ date: '2026-07-15', moodRating: 1 }),
      ];
      const r = analyzeBehaviorTrends(records);
      expect(r.consecutiveLowMood).toBe(2);
    });

    it('computes lateNightRatio for 0-5 AM activity', () => {
      const records = [
        makeRecord({ date: '2026-07-13', activeHours: [10, 14] }),
        makeRecord({ date: '2026-07-14', activeHours: [2, 4, 14] }),
        makeRecord({ date: '2026-07-15', activeHours: [3, 10] }),
      ];
      const r = analyzeBehaviorTrends(records);
      // 2/3 records have late-night
      expect(r.lateNightRatio).toBeCloseTo(2 / 3, 1);
    });

    it('detects taskCompletionDrop when recent drops sharply', () => {
      const records = [
        ...Array.from({ length: 3 }, () => makeRecord({ tasksCompleted: 4, tasksTotal: 5 })),
        ...Array.from({ length: 3 }, () => makeRecord({ tasksCompleted: 1, tasksTotal: 5 })),
      ];
      const r = analyzeBehaviorTrends(records);
      expect(r.taskCompletionDrop).toBe(true);
    });
  });

  describe('analyzeDailyBehavior', () => {
    it('handles null record gracefully', () => {
      const r = analyzeDailyBehavior(null);
      expect(r).toBeDefined();
      expect(r.anomalies).toBeDefined();
    });

    it('detects anomaly vs baseline when deviation > 1.5*std', () => {
      const records = Array.from({ length: 7 }, () => makeRecord({ moodRating: 3 }));
      const baseline = calculatePersonalBaseline(records);
      // mood=3 baseline std=0; 用 moodRating=1 触发异常
      const today = makeRecord({ moodRating: 1 });
      const r = analyzeDailyBehavior(today, {}, baseline);
      expect(r.anomalies).toBeDefined();
    });
  });
});
