import { describe, it, expect } from 'vitest';
import {
  buildEvidenceChain,
  EVIDENCE_DISCLAIMER_KEY,
  EVIDENCE_METHOD_REF,
  SIGNAL_KEYS,
} from '../evidenceChain';

describe('buildEvidenceChain', () => {
  const baseResult = {
    totalScore: 72,
    riskLevel: 'high',
    breakdown: {
      emotion: { score: 80, weight: 0.3 },
      behavior: { score: 72, weight: 0.25 },
      assessment: { score: 64, weight: 0.25 },
      chat: { score: 40, weight: 0.1 },
      diary: { score: 20, weight: 0.1 },
    },
    factors: [
      { type: 'negative_sentiment', weight: 15, description: '近期情感倾向负面' },
      { type: 'low_mood', weight: 30, description: '连续3天心情低落' },
      { type: 'phq9_moderate_severe', weight: 25, description: 'PHQ-9中重度抑郁' },
      { type: 'negative_chat', weight: 10, description: '聊天情感倾向负面' },
    ],
    diagnostics: {
      exclusionsHit: [],
      escalation: { escalated: false, reasons: [], crisisFactorCount: 0 },
    },
  };

  const hasData = {
    emotion: true,
    behavior: true,
    assessment: true,
    chat: true,
    diary: true,
  };

  it('产出 5 条贡献且 Σ(contribution) ≈ totalScore（容差 ±1）', () => {
    const chain = buildEvidenceChain(baseResult, hasData);
    expect(chain.contributions).toHaveLength(SIGNAL_KEYS.length);
    expect(chain.contributions.map(c => c.key)).toEqual([...SIGNAL_KEYS]);

    const sum = chain.contributions.reduce((s, c) => s + c.contribution, 0);
    expect(Math.abs(sum - chain.totalScore)).toBeLessThanOrEqual(1);
    // 总分 = 各贡献之和（自洽：显示的总分就是显示的贡献条之和）
    expect(chain.totalScore).toBe(Math.round(sum));

    // 逐条贡献 = score × weight
    for (const c of chain.contributions) {
      expect(c.contribution).toBeCloseTo(c.score * c.weight, 5);
    }
  });

  it('status 判定：score>=60 → elevated；score=0 且无数据 → no_data；否则 normal', () => {
    const chain = buildEvidenceChain(baseResult, hasData);
    expect(chain.contributions.find(c => c.key === 'emotion')?.status).toBe('elevated');
    expect(chain.contributions.find(c => c.key === 'behavior')?.status).toBe('elevated');
    expect(chain.contributions.find(c => c.key === 'assessment')?.status).toBe('elevated');
    expect(chain.contributions.find(c => c.key === 'chat')?.status).toBe('normal');
    expect(chain.contributions.find(c => c.key === 'diary')?.status).toBe('normal');

    // 无数据：score=0 且 hasData=false → no_data
    const noDataResult = {
      ...baseResult,
      totalScore: 0,
      riskLevel: 'low',
      breakdown: {
        emotion: { score: 0, weight: 0.3 },
        behavior: { score: 0, weight: 0.25 },
        assessment: { score: 0, weight: 0.25 },
        chat: { score: 0, weight: 0.1 },
        diary: { score: 0, weight: 0.1 },
      },
      factors: [],
    };
    const chain2 = buildEvidenceChain(noDataResult, { emotion: false, behavior: false, assessment: false, chat: false, diary: false });
    expect(chain2.contributions.every(c => c.status === 'no_data')).toBe(true);
  });

  it('triggers 由 factors 映射（type → 中文依据 + source）', () => {
    const chain = buildEvidenceChain(baseResult, hasData);
    expect(chain.triggers).toHaveLength(4);
    const triggerTypes = chain.triggers.map(t => t.type);
    expect(triggerTypes).toContain('negative_sentiment');
    expect(triggerTypes).toContain('phq9_moderate_severe');
    const emotionTrigger = chain.triggers.find(t => t.type === 'negative_sentiment');
    expect(emotionTrigger?.source).toBe('emotion');
    const assessmentTrigger = chain.triggers.find(t => t.type === 'phq9_moderate_severe');
    expect(assessmentTrigger?.source).toBe('assessment');
    expect(emotionTrigger?.description).toBeTruthy();
  });

  it('actions 按触发源映射且去重', () => {
    const chain = buildEvidenceChain(baseResult, hasData);
    const targets = chain.actions.map(a => a.target);
    expect(new Set(targets).size).toBe(targets.length);
    // emotion + chat + diary → 写日记
    expect(targets).toContain('/diary/new');
    // behavior → 呼吸练习
    expect(targets).toContain('/therapy?exercise=breathing');
    // assessment → 量表评估
    expect(targets).toContain('/assessment');
  });

  it('危机触发 → 热线动作；escalation 复用 diagnostics', () => {
    const crisisResult = {
      ...baseResult,
      totalScore: 91,
      riskLevel: 'critical',
      factors: [
        ...baseResult.factors,
        { type: 'crisis_in_chat', weight: 40, description: '聊天中出现危机内容' },
      ],
      diagnostics: {
        exclusionsHit: [],
        escalation: {
          escalated: true,
          reasons: ['score_threshold', 'cssrs_acute'],
          crisisFactorCount: 2,
        },
      },
    };
    const chain = buildEvidenceChain(crisisResult, hasData);
    expect(chain.actions.some(a => a.target === '/therapy')).toBe(true);
    expect(chain.escalation.escalated).toBe(true);
    expect(chain.escalation.reasons).toEqual(['score_threshold', 'cssrs_acute']);
    expect(chain.escalation.crisisFactorCount).toBe(2);
    // 升级原因进入 triggers（source=diagnostics）
    expect(chain.triggers.some(t => t.source === 'diagnostics')).toBe(true);
  });

  it('免责声明与方法引用恒定', () => {
    const chain = buildEvidenceChain(baseResult, hasData);
    expect(chain.disclaimer).toBe(EVIDENCE_DISCLAIMER_KEY);
    expect(chain.methodRef).toBe(EVIDENCE_METHOD_REF);
  });

  it('空风险结果也能安全产出（不抛错）', () => {
    const chain = buildEvidenceChain(
      { totalScore: 0, riskLevel: 'low', breakdown: {}, factors: [], diagnostics: undefined },
      { emotion: false, behavior: false, assessment: false, chat: false, diary: false }
    );
    expect(chain.contributions).toHaveLength(5);
    expect(chain.contributions.every(c => c.status === 'no_data')).toBe(true);
    expect(chain.actions.length).toBeGreaterThanOrEqual(1);
    expect(chain.disclaimer).toBe(EVIDENCE_DISCLAIMER_KEY);
  });
});
