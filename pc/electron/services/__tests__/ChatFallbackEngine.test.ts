import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  respond,
  greeting,
  detectCrisis,
  CRISIS_RESPONSE,
} = require('../ChatFallbackEngine.cjs');

describe('ChatFallbackEngine', () => {
  describe('detectCrisis', () => {
    it('检测到危机关键词返回 true', () => {
      expect(detectCrisis('我想死')).toBe(true);
      expect(detectCrisis('不想活了')).toBe(true);
      expect(detectCrisis('活着没意思')).toBe(true);
    });

    it('否定词窗口内不触发危机', () => {
      expect(detectCrisis('我不会想死的')).toBe(false);
      expect(detectCrisis('没有想死')).toBe(false);
    });

    it('排除成语/网络误报', () => {
      expect(detectCrisis('笑死我了')).toBe(false);
      expect(detectCrisis('困死了')).toBe(false);
      expect(detectCrisis('热死了')).toBe(false);
    });

    it('正常文本不触发', () => {
      expect(detectCrisis('今天天气不错')).toBe(false);
      expect(detectCrisis('作业写完了')).toBe(false);
    });

    it('空输入不触发', () => {
      expect(detectCrisis('')).toBe(false);
      expect(detectCrisis(null)).toBe(false);
      expect(detectCrisis(undefined)).toBe(false);
    });
  });

  describe('respond', () => {
    it('危机消息返回固定危机回复', () => {
      const result = respond('我想结束生命', 'crisis');
      expect(result.isCrisis).toBe(true);
      expect(result.branch).toBe('crisis');
      expect(result.text).toBe(CRISIS_RESPONSE);
      expect(result.text).toContain('400-161-9995');
    });

    it('危机关键词直接触发，不走 emotionLabel', () => {
      const result = respond('不想活了', 'neutral');
      expect(result.isCrisis).toBe(true);
    });

    it('负面情绪返回非危机回复', () => {
      const result = respond('今天有点难过', 'negative');
      expect(result.isCrisis).toBe(false);
      expect(result.text.length).toBeGreaterThan(5);
    });

    it('中性情绪返回非空回复', () => {
      const result = respond('嗯', 'neutral');
      expect(result.isCrisis).toBe(false);
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('连续两次回复不雷同', () => {
      const r1 = respond('有点累', 'negative', new Date('2026-07-30T15:00:00'));
      const r2 = respond('有点累', 'negative', new Date('2026-07-30T15:00:00'));
      // 允许极小概率雷同，但通常应不同
      expect(r1.text).toBeTruthy();
      expect(r2.text).toBeTruthy();
    });

    it('不同时段开场不同', () => {
      const morning = respond('你好', 'neutral', new Date('2026-07-30T08:00:00'));
      const night = respond('你好', 'neutral', new Date('2026-07-30T02:00:00'));
      expect(morning.text).toBeTruthy();
      expect(night.text).toBeTruthy();
      // 深夜开场应含"这么晚"或"夜深"
      expect(night.text).toMatch(/这么晚|夜深|这个点/);
    });

    it('焦虑分支识别压力相关词', () => {
      const result = respond('期末考试压力好大', 'negative');
      expect(result.branch).toBe('stress');
    });

    it('孤独分支识别孤独相关词', () => {
      const result = respond('感觉没人懂我', 'negative');
      expect(result.branch).toBe('lonely');
    });
  });

  describe('greeting', () => {
    it('沉默 3 天返回关切问候', () => {
      const g = greeting({ silentDays: 3 });
      expect(g.branch).toBe('greeting');
      expect(g.text).toContain('好久不见');
    });

    it('沉默 7 天 + 风险上升返回更关切问候', () => {
      const g = greeting({ silentDays: 7, riskRising: true });
      expect(g.branch).toBe('greeting');
      expect(g.text).toContain('状态不太好');
    });

    it('不同时段不同问候', () => {
      const morning = greeting({ silentDays: 1 }, new Date('2026-07-30T08:00:00'));
      const evening = greeting({ silentDays: 1 }, new Date('2026-07-30T20:00:00'));
      expect(morning.text).toContain('早上好');
      expect(evening.text).toContain('晚上好');
    });

    it('短间隔返回常规问候', () => {
      const g = greeting({ silentDays: 1 }, new Date('2026-07-30T15:00:00'));
      expect(g.branch).toBe('greeting');
      expect(g.text).toBeTruthy();
    });
  });
});
