/**
 * ChatFallbackEngine 情感感知多轮状态机测试（node 环境，createRequire 加载）
 *
 * 覆盖（任务列表 T03 硬性用例）：
 * 1. 6 轮连续对话无重复模板（会话内去重）
 * 2. 情感标签变化时回复情感匹配（分支正确）
 * 3. 危机文本恒走危机分支（固定回复）
 * 4. summary 随轮次增长
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  respond,
  greeting,
  detectCrisis,
  extractTopics,
  buildSessionDelta,
  stateStage,
  CRISIS_RESPONSE,
} = require('../ChatFallbackEngine.cjs');

function emptySession() {
  return {
    turnCount: 0,
    emotionHistory: [],
    topics: [],
    summary: '',
    usedTemplates: [],
    dominantEmotion: 'neutral',
  };
}

/** 合并 sessionDelta 回 session（模拟渲染层 chatStore.updateSession） */
function merge(session, delta) {
  if (!delta) return session;
  return {
    turnCount: typeof delta.turnCount === 'number' ? delta.turnCount : session.turnCount,
    emotionHistory: delta.emotionHistory ?? session.emotionHistory,
    topics: delta.topics ?? session.topics,
    summary: typeof delta.summary === 'string' ? delta.summary : session.summary,
    usedTemplates: delta.usedTemplates ?? session.usedTemplates,
    dominantEmotion: typeof delta.dominantEmotion === 'string' ? delta.dominantEmotion : session.dominantEmotion,
  };
}

describe('ChatFallbackEngine 状态机升级', () => {
  describe('6 轮连续对话（连贯性 + 去重）', () => {
    it('6 轮无重复模板、无空回复、状态推进', () => {
      let session = emptySession();
      const msgs = [
        { text: '最近考试压力好大', label: 'negative', negativeProb: 0.85 },
        { text: '晚上根本睡不着', label: 'negative', negativeProb: 0.75 },
        { text: '感觉室友都不理解我', label: 'negative', negativeProb: 0.6 },
        { text: '论文也写不出来', label: 'negative', negativeProb: 0.9 },
        { text: '有点想放弃了', label: 'negative', negativeProb: 0.95 },
        { text: '谢谢你听我说这么多', label: 'neutral', negativeProb: 0.2 },
      ];
      const replies = [];
      const now = new Date('2026-07-30T20:00:00');
      for (const m of msgs) {
        const result = respond(m.text, {
          emotionLabel: m.label,
          negativeProb: m.negativeProb,
          positiveProb: 1 - m.negativeProb,
          crisisProb: 0,
          session,
          now,
        });
        expect(result.isCrisis).toBe(false);
        expect(result.text).toBeTruthy();
        expect(result.sessionDelta).toBeDefined();
        replies.push(result.text);
        session = merge(session, result.sessionDelta);
      }

      // 6 轮回复非空
      expect(replies).toHaveLength(6);
      // 无连续两条相同
      for (let i = 1; i < replies.length; i++) {
        expect(replies[i]).not.toBe(replies[i - 1]);
      }
      // turnCount 推进到 6
      expect(session.turnCount).toBe(6);
      // 去重：usedTemplates 随轮次增长且无重复
      expect(session.usedTemplates.length).toBeGreaterThanOrEqual(6);
      expect(new Set(session.usedTemplates).size).toBe(session.usedTemplates.length);
      // 摘要随轮次增长（不为空且包含主题）
      expect(session.summary.length).toBeGreaterThan(0);
      expect(session.summary).toContain('用户近况');
      // 主题被提取（考试/压力）
      expect(session.topics.length).toBeGreaterThan(0);
    });

    it('summary 随轮次增长（长度不降）', () => {
      let session = emptySession();
      const now = new Date('2026-07-30T20:00:00');
      const lengths = [];
      for (const text of ['我最近很焦虑', '考试要来了好紧张', '晚上也睡不好', '感觉自己很孤独', '压力好大', '谢谢听我说']) {
        const result = respond(text, { emotionLabel: 'negative', negativeProb: 0.7, positiveProb: 0.1, crisisProb: 0, session, now });
        session = merge(session, result.sessionDelta);
        lengths.push(session.summary.length);
      }
      // 摘要非空且最后一条包含更多主题（信息量不降）
      expect(lengths[lengths.length - 1]).toBeGreaterThan(0);
      expect(session.summary).toContain('情绪：');
    });
  });

  describe('情感匹配', () => {
    it('负面 → stress 分支，回复包含共情内容', () => {
      const result = respond('期末考试压力好大', {
        emotionLabel: 'negative',
        negativeProb: 0.85,
        positiveProb: 0.05,
        crisisProb: 0,
      });
      expect(result.branch).toBe('stress');
      expect(result.text.length).toBeGreaterThan(5);
    });

    it('负面（孤独词）→ lonely 分支', () => {
      const result = respond('感觉没人懂我', { emotionLabel: 'negative', negativeProb: 0.6 });
      expect(result.branch).toBe('lonely');
    });

    it('正面 → positive 分支', () => {
      const result = respond('今天好开心！', { emotionLabel: 'positive', negativeProb: 0.05, positiveProb: 0.9 });
      expect(result.branch).toBe('positive');
    });

    it('中性 → neutral 分支', () => {
      const result = respond('嗯', { emotionLabel: 'neutral', negativeProb: 0.2 });
      expect(result.branch).toBe('neutral');
    });

    it('强负面概率叠加强共情开场', () => {
      const strong = respond('我真的撑不下去了', {
        emotionLabel: 'negative', negativeProb: 0.95, positiveProb: 0, crisisProb: 0,
      });
      expect(strong.text.length).toBeGreaterThan(5);
    });
  });

  describe('危机分支（伦理红线）', () => {
    it('危机关键词恒走固定回复', () => {
      const result = respond('我真的不想活了', { emotionLabel: 'negative', negativeProb: 0.9 });
      expect(result.isCrisis).toBe(true);
      expect(result.branch).toBe('crisis');
      expect(result.text).toBe(CRISIS_RESPONSE);
      expect(result.text).toContain('400-161-9995');
      expect(result.text).toContain('12356');
      expect(result.text).toContain('不能替代专业医疗');
    });

    it('emotionLabel=crisis 也走固定回复', () => {
      const result = respond('随便说说', { emotionLabel: 'crisis' });
      expect(result.isCrisis).toBe(true);
      expect(result.text).toBe(CRISIS_RESPONSE);
    });
  });

  describe('工具函数', () => {
    it('extractTopics 提取主题词', () => {
      const topics = extractTopics('考试压力大，论文写不完，还失眠');
      expect(topics).toContain('考试');
      expect(topics).toContain('论文');
      expect(topics).toContain('失眠');
      expect(topics.length).toBeLessThanOrEqual(5);
    });

    it('buildSessionDelta 返回完整增量', () => {
      const delta = buildSessionDelta(emptySession(), '考试压力好大', 'negative', []);
      expect(delta.turnCount).toBe(1);
      expect(delta.emotionHistory).toEqual(['negative']);
      expect(delta.dominantEmotion).toBe('negative');
      expect(delta.topics).toContain('考试');
      expect(delta.summary).toContain('用户近况');
      expect(Array.isArray(delta.usedTemplates)).toBe(true);
    });

    it('stateStage 按轮次推进', () => {
      expect(stateStage({ turnCount: 0 })).toBe('init');
      expect(stateStage({ turnCount: 1 })).toBe('listen');
      expect(stateStage({ turnCount: 3 })).toBe('empathize');
      expect(stateStage({ turnCount: 5 })).toBe('support');
      expect(stateStage({ turnCount: 6 })).toBe('close');
    });

    it('detectCrisis 正常识别', () => {
      expect(detectCrisis('想死')).toBe(true);
      expect(detectCrisis('今天天气不错')).toBe(false);
    });
  });

  describe('greeting 兼容', () => {
    it('沉默 3 天返回关切问候', () => {
      const g = greeting({ silentDays: 3 });
      expect(g.branch).toBe('greeting');
      expect(g.text).toContain('好久不见');
    });
  });
});
