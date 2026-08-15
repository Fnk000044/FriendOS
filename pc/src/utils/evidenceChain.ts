import type { TranslationKey } from '../i18n/translations';

/**
 * evidenceChain.ts — 风险证据链纯函数（P0-6）
 *
 * 把主进程 RiskScoringEngine 返回的「黑盒分数」（totalScore / breakdown / factors /
 * diagnostics）转成叙事化、可解释的证据链：5 信号贡献 → 触发依据 → 建议动作 → 免责声明。
 *
 * 设计约束：
 * - 纯函数、零依赖（可单测、可离线）；不访问 window / electronAPI / DB。
 * - 贡献值 contribution = score × weight，Σ(contribution) ≈ totalScore（容差 ±1，
 *   因为引擎先对每个信号分四舍五入再加权求和）。
 * - 所有文案以 TranslationKey 字符串返回，由 UI 层 t() 解析，保证 zh-CN / en 成对。
 * - 方法学诚实：status 区分 elevated / normal / no_data；免责声明恒定存在。
 */

// ── 信号定义 ──────────────────────────────────────────────────
export const SIGNAL_KEYS = ['emotion', 'behavior', 'assessment', 'chat', 'diary'] as const;
export type SignalKey = (typeof SIGNAL_KEYS)[number];

export type HasDataMap = Record<SignalKey, boolean>;

/** 信号标签（i18n key，复用 risk.dim_*） */
const SIGNAL_LABEL_KEYS: Record<SignalKey, TranslationKey> = {
  emotion: 'risk.dim_emotion',
  behavior: 'risk.dim_behavior',
  assessment: 'risk.dim_assessment',
  chat: 'risk.dim_chat',
  diary: 'risk.dim_diary',
};

/** 因子 type → 信号源（用于把 factors 归因到 5 信号） */
const FACTOR_SOURCE: Record<string, SignalKey> = {
  // 情绪
  negative_sentiment: 'emotion',
  high_risk_emotion: 'emotion',
  emotion_volatility: 'emotion',
  // 行为
  no_diary: 'behavior',
  low_mood: 'behavior',
  task_drop: 'behavior',
  habit_break: 'behavior',
  late_night: 'behavior',
  // 量表
  phq9_severe: 'assessment',
  phq9_moderate_severe: 'assessment',
  phq9_moderate: 'assessment',
  phq9_mild: 'assessment',
  gad7_severe: 'assessment',
  gad7_moderate: 'assessment',
  gad7_mild: 'assessment',
  pss10_high: 'assessment',
  pss10_moderate: 'assessment',
  cssrs_high_risk: 'assessment',
  cssrs_ideation: 'assessment',
  // 聊天
  crisis_in_chat: 'chat',
  negative_chat: 'chat',
  // 日记
  crisis_in_diary: 'diary',
  low_mood_diary: 'diary',
  negative_diary: 'diary',
};

/** 危机类因子（触发热线建议） */
const CRISIS_TYPES = new Set([
  'crisis_in_chat',
  'crisis_in_diary',
  'cssrs_high_risk',
  'cssrs_ideation',
]);

/** 升级原因码 → i18n key（视图层 t() 解析） */
export const ESCALATION_REASON_KEYS: Record<string, TranslationKey> = {
  score_threshold: 'evidence.reason_score_threshold',
  cssrs_acute: 'evidence.reason_cssrs_acute',
  multi_channel_crisis: 'evidence.reason_multi_channel_crisis',
};

/** 免责声明（i18n key，恒定存在） */
export const EVIDENCE_DISCLAIMER_KEY: TranslationKey = 'evidence.disclaimer_text';

/** 方法说明文档路径（对外统一引用） */
export const EVIDENCE_METHOD_REF = 'docs/risk_methodology.md';

/** 具名 breakdown 形状（与 RiskDashboardPage 的 RiskBreakdown / 引擎返回一致） */
export interface RiskBreakdownLike {
  emotion?: { score: number; weight: number };
  behavior?: { score: number; weight: number };
  assessment?: { score: number; weight: number };
  chat?: { score: number; weight: number };
  diary?: { score: number; weight: number };
}

// ── 入参类型（与 RiskScoringEngine 返回值对齐）─────────────────
export interface RiskResultLike {
  totalScore: number;
  riskLevel: string;
  breakdown?: Record<string, { score: number; weight: number }> | RiskBreakdownLike;
  factors?: Array<{ type: string; weight: number; description: string }>;
  diagnostics?: {
    exclusionsHit: unknown[];
    escalation: {
      escalated: boolean;
      reasons: string[];
      crisisFactorCount: number;
    };
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 构建风险证据链
 * @param riskResult 主进程 risk:calculate 返回值（totalScore/breakdown/factors/diagnostics）
 * @param hasData 各信号源是否有数据（决定 no_data 判定）
 */
export function buildEvidenceChain(
  riskResult: RiskResultLike,
  hasData: HasDataMap
): EvidenceChain {
  const riskLevel = riskResult.riskLevel || 'low';

  // 1. 5 信号贡献（score × weight）
  const breakdown = (riskResult.breakdown ?? {}) as Record<string, { score: number; weight: number }>;
  const contributions: EvidenceContribution[] = SIGNAL_KEYS.map((key) => {
    const item = breakdown[key];
    const score = item && typeof item.score === 'number' ? item.score : 0;
    const weight = item && typeof item.weight === 'number' ? item.weight : 0;
    const hasSignalData = !!hasData[key];

    let status: EvidenceContribution['status'];
    if (score >= 60) {
      status = 'elevated';
    } else if (score === 0 && !hasSignalData) {
      status = 'no_data';
    } else {
      status = 'normal';
    }

    return {
      key,
      label: SIGNAL_LABEL_KEYS[key],
      score,
      weight,
      contribution: round2(score * weight),
      status,
    };
  });

  // 证据链的总分 = 各可见贡献之和（自洽：显示的总分就是显示的贡献条之和）。
  // 对真实引擎输出，此值与原 totalScore 相差 ≤1（引擎先对每个信号分四舍五入再加权）。
  const totalScore = Math.round(
    contributions.reduce((s, c) => s + c.contribution, 0)
  );

  // 2. 触发依据（factors 归因 + 升级原因）
  const factors = Array.isArray(riskResult.factors) ? riskResult.factors : [];
  const triggers: EvidenceTrigger[] = factors.map((f) => ({
    type: f.type,
    description: f.description,
    source: FACTOR_SOURCE[f.type] || 'assessment',
  }));

  const escalation = riskResult.diagnostics?.escalation ?? {
    escalated: false,
    reasons: [] as string[],
    crisisFactorCount: 0,
  };
  (escalation.reasons || []).forEach((reason) => {
    triggers.push({
      type: 'escalation',
      description: reason,
      source: 'diagnostics',
    });
  });

  // 3. 建议动作（去重，按触发源映射）
  const actions: EvidenceAction[] = [];
  const addAction = (label: TranslationKey, target: string) => {
    if (!actions.some((a) => a.target === target)) {
      actions.push({ label, target });
    }
  };

  const sourceSet = new Set(triggers.map((t) => t.source));
  const hasCrisis =
    escalation.escalated ||
    factors.some((f) => CRISIS_TYPES.has(f.type)) ||
    triggers.some((t) => t.type === 'escalation');

  if (hasCrisis) {
    addAction('evidence.action_hotline', '/therapy');
  }
  if (sourceSet.has('emotion') || sourceSet.has('chat') || sourceSet.has('diary')) {
    addAction('evidence.action_diary', '/diary/new');
  }
  if (sourceSet.has('behavior')) {
    addAction('evidence.action_breathing', '/therapy?exercise=breathing');
  }
  if (sourceSet.has('assessment')) {
    addAction('evidence.action_assessment', '/assessment');
  }
  // 没有任何触发源时给一条最基础的安抚动作，避免空态
  if (actions.length === 0) {
    addAction('evidence.action_diary', '/diary/new');
  }

  // 4. 升级信息 + 免责 + 方法引用
  return {
    totalScore,
    riskLevel,
    contributions,
    triggers,
    actions,
    escalation: {
      escalated: !!escalation.escalated,
      reasons: Array.isArray(escalation.reasons) ? escalation.reasons : [],
      crisisFactorCount: typeof escalation.crisisFactorCount === 'number' ? escalation.crisisFactorCount : 0,
    },
    disclaimer: EVIDENCE_DISCLAIMER_KEY,
    methodRef: EVIDENCE_METHOD_REF,
  };
}
