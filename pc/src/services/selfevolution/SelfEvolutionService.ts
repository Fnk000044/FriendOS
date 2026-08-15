/**
 * SelfEvolutionService — 基于用户反馈的本地自进化（P0 最小闭环）
 *
 * 职责：
 * - recordFeedback()：写入 feedbackLogs（text/correction 字段级加密）+ 触发参数重算
 * - computeSentimentCalibration()：情感先验偏移 β（危机通道冻结）
 * - computeRiskPersonalization()：风险单信号因子 λ + 全局偏移 δ（量表/危机冻结）
 * - computeInterventionEma()：干预有效率 EMA（带遗忘因子，冷启动回退）
 * - computeForecastCalibration()：预测步长偏差 + Platt 概率重标定（P1）
 *
 * 统一策略（见 deliverables/qingyuanbei/arch-self-evolution.md §3.5）：
 * - 收缩 shrinkage：param = global + w·(learned - global)，w = min(1, N/10)
 * - 有界 clamp：先验 ±1.0、λ ∈ [0.7,1.3]、δ ∈ [-10,10]
 * - 冷启动回退：情感 5 / 风险 8 / 干预 3 / 预测 5 次样本门槛
 * - 30 天漂移衰减：lastUpdated 距今 > 30 天 → 参数向全局半衰期回退
 *
 * 数据落盘：selfEvoModels 单行（id='default'），整行参数 JSON.stringify 后
 * encryptField 加密；读取用 decryptField 对旧明文优雅兼容。
 * 加密密钥仅在渲染层，不进 IPC、不进日志。
 */

import { db } from '../../db';
import { encryptField, decryptField } from '../../db/crypto';
import type { FeedbackType, SelfEvoModel } from '../../db/models';
import type {
  SentimentCalibration,
  RiskPersonalization,
  InterventionCalibration,
  ForecastCalibration,
  SelfEvolutionSnapshot,
  InterventionType,
} from './types';

// ── 常量 ──────────────────────────────────────────────────────
const SELF_EVO_ID = 'default';
const MODEL_VERSION = 1;

/** 收缩拐点：样本达 N0 后收缩权重 w=1（完全采信学习值） */
const SHRINKAGE_N0 = 10;

/** 各模块冷启动样本门槛 */
export const SENTIMENT_MIN_SAMPLES = 5;
export const RISK_MIN_SAMPLES = 8;
export const INTERVENTION_MIN_SAMPLES = 3;
export const FORECAST_MIN_SAMPLES = 5;

/** 危机误报个人化（方案A）：反馈窗口 30 天 + 最多携带 20 条样本 */
const CRISIS_FEEDBACK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const CRISIS_FEEDBACK_MAX_SAMPLES = 20;

/** 30 天漂移衰减（半衰期系数） */
const DRIFT_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DRIFT_HALF = 0.5;

// 情感先验学习率：η = η0 / (1 + decay·N)
const SENTIMENT_ETA0 = 0.1;
const SENTIMENT_DECAY = 0.05;
const PRIOR_BOUND = 1.0;
// 反馈日志不记录类别概率，采用保守的固定"预测/纠正类置信度"近似
const PRED_PROB = 0.6;
const CORRECT_PROB = 0.6;

// 风险校准学习率：ηδ=1.0、ηλ=0.05，随样本衰减
const RISK_ETA_DELTA = 1.0;
const RISK_ETA_LAMBDA = 0.05;
const RISK_DECAY = 0.05;
const LAMBDA_MIN = 0.7;
const LAMBDA_MAX = 1.3;
const OFFSET_MIN = -10;
const OFFSET_MAX = 10;

// 干预 EMA
const INTERVENTION_ALPHA = 0.3;

// 预测偏差 EMA
const FORECAST_ALPHA = 0.2;

const PRIOR_KEYS = ['neg', 'neu', 'pos'] as const;
const INTERVENTION_TYPES: InterventionType[] = ['breathing', 'mindfulness', 'thought_record'];

/** 情感 4 分类 → 先验 key（crisis 冻结，无对应 key） */
const CLASS_TO_PRIOR: Record<string, 'neg' | 'neu' | 'pos' | null> = {
  negative: 'neg',
  neutral: 'neu',
  positive: 'pos',
  crisis: null,
};

// ── 纯函数工具 ────────────────────────────────────────────────

export function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** 收缩权重 w = min(1, N / N0) */
export function shrinkage(N: number): number {
  if (!Number.isFinite(N) || N <= 0) return 0;
  return Math.min(1, N / SHRINKAGE_N0);
}

/** 默认模型（全局基线） */
export function defaultModel(): SelfEvoModel {
  return {
    id: SELF_EVO_ID,
    sentiment: {
      priors: { neg: 0, neu: 0, pos: 0 },
      temperature: 1.0,
      sampleCount: 0,
    },
    risk: {
      weightFactors: { emotion: 1.0, behavior: 1.0, diary: 1.0 },
      offset: 0,
      sampleCount: 0,
    },
    intervention: {
      emaEffectiveness: { breathing: 0.5, mindfulness: 0.5, thought_record: 0.5 },
      effectiveN: { breathing: 0, mindfulness: 0, thought_record: 0 },
      sampleCount: 0,
    },
    forecast: {
      horizonBias: [0, 0, 0, 0, 0, 0, 0],
      probA: 1.0,
      probB: 0,
      sampleCount: 0,
    },
    lastUpdated: Date.now(),
    version: MODEL_VERSION,
  };
}

/**
 * 30 天漂移衰减：参数向全局基线半衰期回退，并刷新 lastUpdated。
 * 纯函数，便于单测。
 */
export function applyDriftDecay(model: SelfEvoModel, now: number = Date.now()): SelfEvoModel {
  if (!model || now - model.lastUpdated <= DRIFT_DAYS_MS) return model;

  const next: SelfEvoModel = structuredCloneSafe(model);
  const half = DRIFT_HALF;

  // 情感先验 → 0
  for (const k of PRIOR_KEYS) {
    next.sentiment.priors[k] = round4(next.sentiment.priors[k] * half);
  }
  next.sentiment.temperature = round4(1 + (next.sentiment.temperature - 1) * half);

  // 风险 λ → 1.0、δ → 0
  next.risk.weightFactors.emotion = round4(1 + (next.risk.weightFactors.emotion - 1) * half);
  next.risk.weightFactors.behavior = round4(1 + (next.risk.weightFactors.behavior - 1) * half);
  next.risk.weightFactors.diary = round4(1 + (next.risk.weightFactors.diary - 1) * half);
  next.risk.offset = round4(next.risk.offset * half);

  // 干预 EMA → 0.5、有效样本量折半
  for (const t of INTERVENTION_TYPES) {
    next.intervention.emaEffectiveness[t] = round4(0.5 + (next.intervention.emaEffectiveness[t] - 0.5) * half);
    next.intervention.effectiveN[t] = round4(next.intervention.effectiveN[t] * half);
  }

  // 预测偏差 → 0、Platt → 1.0 / 0
  next.forecast.horizonBias = next.forecast.horizonBias.map((b) => round4(b * half));
  next.forecast.probA = round4(1 + (next.forecast.probA - 1) * half);
  next.forecast.probB = round4(next.forecast.probB * half);

  next.lastUpdated = now;
  return next;
}

function structuredCloneSafe<T>(v: T): T {
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
}

/**
 * 情感先验在线更新（每条纠正反馈一条）。
 * 危机通道（crisis）不参与、不存储、不被修改。
 */
export function updateSentimentPriorsPure(
  priors: { neg: number; neu: number; pos: number },
  predictedClass: string,
  correctedClass: string,
  sampleCount: number,
): { neg: number; neu: number; pos: number } {
  const next = { neg: priors.neg ?? 0, neu: priors.neu ?? 0, pos: priors.pos ?? 0 };
  const eta = SENTIMENT_ETA0 / (1 + SENTIMENT_DECAY * Math.max(0, sampleCount));

  const cStar = CLASS_TO_PRIOR[correctedClass];
  const cPred = CLASS_TO_PRIOR[predictedClass];

  // 增大纠正类先验，减小被纠错类先验（crisis 无 key，天然跳过）
  if (cStar) next[cStar] += eta * (1 - CORRECT_PROB);
  if (cPred) next[cPred] -= eta * PRED_PROB;

  // 有界 clamp ±1.0
  for (const k of PRIOR_KEYS) next[k] = clamp(next[k], -PRIOR_BOUND, PRIOR_BOUND);

  // 零和：减去均值，保持分布（保留全精度，输出时再 round，保证严格零和）
  const mean = (next.neg + next.neu + next.pos) / 3;
  for (const k of PRIOR_KEYS) next[k] = clamp(next[k] - mean, -PRIOR_BOUND, PRIOR_BOUND);

  return next;
}

/**
 * 风险方向性反馈更新（纯函数）。
 * - direction=overestimate → δ -= ηδ（下调整体风险）
 * - direction=underestimate → δ += ηδ
 * - scope 点名某信号 → λ_scope ± ηλ（可个性化信号：emotion/behavior/diary）
 * assessment/chat 冻结，λ 恒为 1。
 */
export function updateRiskPure(
  risk: SelfEvoModel['risk'],
  direction: 'overestimate' | 'underestimate',
  scope?: string,
): SelfEvoModel['risk'] {
  const next: SelfEvoModel['risk'] = {
    weightFactors: { ...risk.weightFactors },
    offset: risk.offset,
    sampleCount: risk.sampleCount,
  };
  const n = Math.max(0, risk.sampleCount);
  const etaDelta = RISK_ETA_DELTA / (1 + RISK_DECAY * n);
  const etaLambda = RISK_ETA_LAMBDA / (1 + RISK_DECAY * n);

  const sign = direction === 'underestimate' ? 1 : -1;
  next.offset = clamp(round4(next.offset + sign * etaDelta), OFFSET_MIN, OFFSET_MAX);

  if (scope === 'emotion' || scope === 'behavior' || scope === 'diary') {
    next.weightFactors[scope] = clamp(
      round4(next.weightFactors[scope] + sign * etaLambda),
      LAMBDA_MIN,
      LAMBDA_MAX,
    );
  }

  return next;
}

/** 干预有效率 EMA：α·r + (1-α)·e */
export function updateEma(e: number, r: number, alpha: number = INTERVENTION_ALPHA): number {
  return round4(clamp(alpha * r + (1 - alpha) * e, 0, 1));
}

// ── 校准结果构建（读时收缩 + 冷启动回退）──────────────────────

export function buildSentimentCalibration(model: SelfEvoModel): SentimentCalibration {
  const N = model.sentiment.sampleCount;
  if (N < SENTIMENT_MIN_SAMPLES) {
    return { priors: { neg: 0, neu: 0, pos: 0 }, temperature: 1.0, sampleCount: 0 };
  }
  const w = shrinkage(N);
  return {
    priors: {
      neg: round4(model.sentiment.priors.neg * w),
      neu: round4(model.sentiment.priors.neu * w),
      pos: round4(model.sentiment.priors.pos * w),
    },
    temperature: round4(model.sentiment.temperature),
    sampleCount: N,
  };
}

export function buildRiskPersonalization(model: SelfEvoModel): RiskPersonalization {
  const N = model.risk.sampleCount;
  if (N < RISK_MIN_SAMPLES) {
    return { weightFactors: { emotion: 1, behavior: 1, diary: 1 }, offset: 0, sampleCount: 0 };
  }
  const w = shrinkage(N);
  const lambda = (raw: number) => clamp(round4(1 + w * (raw - 1)), LAMBDA_MIN, LAMBDA_MAX);
  return {
    weightFactors: {
      emotion: lambda(model.risk.weightFactors.emotion),
      behavior: lambda(model.risk.weightFactors.behavior),
      diary: lambda(model.risk.weightFactors.diary),
    },
    offset: clamp(round4(model.risk.offset * w), OFFSET_MIN, OFFSET_MAX),
    sampleCount: N,
  };
}

// ── 持久化（selfEvoModels 单行，整行加密）─────────────────────

async function loadOrCreateModel(): Promise<SelfEvoModel> {
  const row = await db.selfEvoModels.get(SELF_EVO_ID);
  if (!row || !row.payload) return defaultModel();

  const plain = await decryptField(row.payload);
  if (!plain) return defaultModel();

  try {
    const parsed = JSON.parse(plain) as SelfEvoModel;
    const base = defaultModel();
    // 结构版本升级 / 字段缺失时合并默认值（向后兼容）
    const model: SelfEvoModel = {
      ...base,
      ...parsed,
      sentiment: { ...base.sentiment, ...(parsed.sentiment || {}) },
      risk: { ...base.risk, ...(parsed.risk || {}) },
      intervention: { ...base.intervention, ...(parsed.intervention || {}) },
      forecast: { ...base.forecast, ...(parsed.forecast || {}) },
      id: SELF_EVO_ID,
    };
    return applyDriftDecay(model);
  } catch (err) {
    console.warn('[SelfEvolutionService] failed to parse model, resetting:', err);
    return defaultModel();
  }
}

async function saveModel(model: SelfEvoModel): Promise<void> {
  model.lastUpdated = Date.now();
  model.version = MODEL_VERSION;
  const payload = await encryptField(JSON.stringify(model));
  await db.selfEvoModels.put({ id: SELF_EVO_ID, payload: payload ?? '' });
}

// ── 反馈记录 ──────────────────────────────────────────────────

export interface RecordFeedbackInput {
  type: FeedbackType;
  /** 原预测标签/等级（枚举，可查询） */
  predicted?: string;
  feedback: 'accurate' | 'inaccurate';
  /** 用户自由文本（加密） */
  text?: string;
  refId?: string;
  targetId?: string;
  /** 用户纠正内容（加密） */
  correction?: string;
  /** 纠正后的枚举标签（sentiment 4 分类） */
  correctedLabel?: string;
  direction?: 'overestimate' | 'underestimate';
  scope?: 'emotion' | 'behavior' | 'diary' | 'assessment' | 'chat';
  forecastValue?: number;
  actualValue?: number;
  horizon?: number;
}

/**
 * 记录一条反馈并触发对应模块参数重算。
 * text/correction 写前 encryptField（幂等，enc:: 前缀检测）。
 */
export async function recordFeedback(input: RecordFeedbackInput): Promise<void> {
  try {
    const encryptedText = await encryptField(input.text || undefined);
    const encryptedCorrection = await encryptField(input.correction || undefined);

    const feedback = input.feedback;
    const now = Date.now();
    await db.feedbackLogs.add({
      id: crypto.randomUUID(),
      type: input.type,
      targetId: input.targetId,
      text: encryptedText ?? undefined,
      predicted: input.predicted || '',
      feedback,
      accurate: feedback,
      refId: input.refId || '',
      correction: encryptedCorrection ?? undefined,
      correctedLabel: input.correctedLabel,
      direction: input.direction,
      scope: input.scope,
      forecastValue: input.forecastValue,
      actualValue: input.actualValue,
      horizon: input.horizon,
      createdAt: new Date().toISOString(),
      timestamp: now,
    });

    // 触发参数重算（情感 / 风险为在线更新）
    await recomputeAfterFeedback(input);
  } catch (err) {
    console.warn('[SelfEvolutionService] recordFeedback failed:', err);
  }
}

async function recomputeAfterFeedback(input: RecordFeedbackInput): Promise<void> {
  const model = await loadOrCreateModel();
  let changed = false;

  if (input.type === 'sentiment' && input.correctedLabel && input.predicted) {
    model.sentiment.priors = updateSentimentPriorsPure(
      model.sentiment.priors,
      input.predicted,
      input.correctedLabel,
      model.sentiment.sampleCount,
    );
    model.sentiment.sampleCount += 1;
    changed = true;
  } else if (input.type === 'risk_level') {
    // 「正好」仅记录确认、不调整参数；有方向时才更新 δ/λ。任何反馈都累计样本。
    if (input.direction) {
      model.risk = updateRiskPure(model.risk, input.direction, input.scope);
    }
    model.risk.sampleCount += 1;
    changed = true;
  }
  // 干预 / 预测为「懒计算」，在 compute* 中读取反馈日志与 therapyRecords 聚合，
  // 无需在此处增量更新（避免双写源不一致）。

  if (changed) {
    await saveModel(model);
  }
}

// ── 校准读取 ──────────────────────────────────────────────────

/** 情感先验校准（供 sentiment-analyze / emotion:analyzeDiary 透传） */
export async function computeSentimentCalibration(): Promise<SentimentCalibration> {
  const model = await loadOrCreateModel();
  const base = buildSentimentCalibration(model);

  // 方案A 配套：携带近期"危机误报"反馈样本（text 为触发原文，加密存储）。
  // 主进程仅在"ONNX 单路危机 + 无 L1 硬词"时用相似度投票降级，压误报不压真危机。
  try {
    const since = Date.now() - CRISIS_FEEDBACK_WINDOW_MS;
    const rows = await db.feedbackLogs.where('type').equals('crisis_false_alarm').toArray();
    const recent = rows
      .filter((r) => r.feedback === 'inaccurate' && (r.timestamp || 0) >= since)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, CRISIS_FEEDBACK_MAX_SAMPLES);
    const crisisFeedback: Array<{ text: string; verdict: 'false_alarm' }> = [];
    for (const r of recent) {
      if (!r.text) continue;
      const plain = await decryptField(r.text);
      if (plain && plain.trim().length >= 4) {
        crisisFeedback.push({ text: plain.slice(0, 300), verdict: 'false_alarm' });
      }
    }
    if (crisisFeedback.length > 0) {
      return { ...base, crisisFeedback };
    }
  } catch (err) {
    console.warn('[SelfEvolutionService] load crisis feedback failed:', err);
  }
  return base;
}

/** 风险个性化（供 risk:calculate 透传） */
export async function computeRiskPersonalization(): Promise<RiskPersonalization> {
  const model = await loadOrCreateModel();
  return buildRiskPersonalization(model);
}

/**
 * 干预有效率 EMA（懒计算，聚合 therapyRecords 隐式信号 + recommendation 显式反馈）。
 * 冷启动判据：effectiveN[type] < INTERVENTION_MIN_SAMPLES → 调用方回退纯规则。
 */
export async function computeInterventionEma(): Promise<InterventionCalibration> {
  // 1. 隐式信号：therapyRecords（moodBefore/moodAfter）
  const therapyRecords = await db.therapyRecords.orderBy('date').toArray();
  const series: Record<InterventionType, number[]> = {
    breathing: [],
    mindfulness: [],
    thought_record: [],
  };
  for (const r of therapyRecords) {
    const type = r.type as InterventionType;
    if (!INTERVENTION_TYPES.includes(type)) continue;
    if (typeof r.moodBefore !== 'number' || typeof r.moodAfter !== 'number') continue;
    series[type].push(r.moodAfter > r.moodBefore ? 1 : 0);
  }

  // 2. 显式反馈：feedbackLogs(type='recommendation')，correction ∈ helpful/neutral/not_helpful
  const recFeedbacks = await db.feedbackLogs.where('type').equals('recommendation').toArray();
  recFeedbacks.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  for (const f of recFeedbacks) {
    const type = f.refId as InterventionType;
    if (!INTERVENTION_TYPES.includes(type)) continue;
    const raw = await decryptField(f.correction);
    series[type].push(mapExplicitEffectiveness(raw));
  }

  const result: InterventionCalibration = {
    emaEffectiveness: { breathing: 0.5, mindfulness: 0.5, thought_record: 0.5 },
    effectiveN: { breathing: 0, mindfulness: 0, thought_record: 0 },
    sampleCount: 0,
  };
  let total = 0;
  for (const t of INTERVENTION_TYPES) {
    const rs = series[t];
    let e = 0.5;
    for (const r of rs) e = updateEma(e, r);
    result.emaEffectiveness[t] = e;
    result.effectiveN[t] = rs.length;
    total += rs.length;
  }
  result.sampleCount = total;

  // 干预 EMA 为「懒计算」：每次从 therapyRecords + 显式反馈源数据重算，
  // 不持久化（避免把全局 lastUpdated 刷新、抑制其它模块的 30 天漂移衰减）。
  return result;
}

function mapExplicitEffectiveness(raw: string | null | undefined): number {
  switch (raw) {
    case 'helpful': return 1;
    case 'neutral': return 0.5;
    case 'not_helpful': return 0;
    default: return 0.5;
  }
}

/** 预测校准（懒计算，聚合 forecast 反馈的步长偏差；Platt 重标定 P1 保留默认） */
export async function computeForecastCalibration(): Promise<ForecastCalibration> {
  const model = await loadOrCreateModel();
  const feedbacks = await db.feedbackLogs.where('type').equals('forecast').toArray();

  const bias: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const f of feedbacks) {
    if (typeof f.forecastValue !== 'number' || typeof f.actualValue !== 'number') continue;
    const h = f.horizon || 1;
    if (h >= 1 && h <= 7) bias[h].push(f.actualValue - f.forecastValue);
  }

  const totalN = feedbacks.filter(
    (f) => typeof f.forecastValue === 'number' && typeof f.actualValue === 'number',
  ).length;

  let horizonBias: number[];
  if (totalN < FORECAST_MIN_SAMPLES) {
    horizonBias = [0, 0, 0, 0, 0, 0, 0];
  } else {
    horizonBias = [1, 2, 3, 4, 5, 6, 7].map((h) => {
      const errs = bias[h];
      let b = 0;
      for (const err of errs) b = FORECAST_ALPHA * err + (1 - FORECAST_ALPHA) * b;
      return round4(b);
    });
  }

  // 预测校准为「懒计算」：从 forecast 反馈源数据重算，不持久化（同上，避免抑制漂移衰减）。
  return {
    horizonBias,
    probA: model.forecast.probA,
    probB: model.forecast.probB,
    sampleCount: totalN,
  };
}

// ── 重置 ──────────────────────────────────────────────────────

/** 设置页「重置个性化校准」：删除 selfEvoModels 单行（可选清空反馈） */
export async function resetCalibration(options: { clearFeedback?: boolean } = {}): Promise<void> {
  try {
    await db.selfEvoModels.delete(SELF_EVO_ID);
    if (options.clearFeedback) {
      await db.feedbackLogs.clear();
    }
  } catch (err) {
    console.warn('[SelfEvolutionService] resetCalibration failed:', err);
  }
}

// ── 知己度快照 ────────────────────────────────────────────────

/** 知己度模块聚合快照（0-100 进度环 + 分维度 + 30 天时间线） */
export async function getSelfEvolutionSnapshot(): Promise<SelfEvolutionSnapshot> {
  const model = await loadOrCreateModel();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const recentFeedbacks = (await db.feedbackLogs.toArray())
    .filter((f) => (f.timestamp || Date.parse(f.createdAt || '') || 0) >= thirtyDaysAgo)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const sentimentCal = buildSentimentCalibration(model);
  const riskCal = buildRiskPersonalization(model);
  const intervention = await computeInterventionEma();

  return {
    hasModel: true,
    sentiment: {
      sampleCount: model.sentiment.sampleCount,
      calibrated: sentimentCal.sampleCount >= SENTIMENT_MIN_SAMPLES,
    },
    risk: {
      sampleCount: model.risk.sampleCount,
      calibrated: riskCal.sampleCount >= RISK_MIN_SAMPLES,
    },
    intervention: {
      sampleCount: intervention.sampleCount,
      calibrated: intervention.sampleCount >= INTERVENTION_MIN_SAMPLES,
      effectiveN: intervention.effectiveN,
    },
    timeline: recentFeedbacks.map((f) => ({
      id: f.id,
      type: f.type,
      labelKey: feedbackTimelineLabel(f.type),
      createdAt: f.timestamp || Date.parse(f.createdAt || '') || Date.now(),
    })),
    lastUpdated: model.lastUpdated,
  };
}

function feedbackTimelineLabel(type: FeedbackType): string {
  switch (type) {
    case 'sentiment': return 'selfevo.timeline_sentiment';
    case 'risk_level': return 'selfevo.timeline_risk';
    case 'recommendation': return 'selfevo.timeline_intervention';
    case 'forecast': return 'selfevo.timeline_forecast';
    case 'behavior': return 'selfevo.timeline_behavior';
    case 'early_warning': return 'selfevo.timeline_early_warning';
    default: return 'selfevo.timeline_other';
  }
}
