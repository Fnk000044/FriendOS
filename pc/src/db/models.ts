// ChatMessage 历史上由 services/ai/types.ts 定义，AI 对话已移除。
// 此处内联定义以保持 Conversation 表的结构兼容（历史数据可能存在）。
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled';
  categoryId?: string;
  scheduledDate: string;
  dueTime?: string;           // HH:mm 截止时间
  reminderEnabled?: boolean;  // 是否到期提醒
  subtasks?: SubTask[];        // 子任务清单
  sortOrder?: number;          // 拖拽排序序号（小在前，未设置时按 createdAt）
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isRollover: boolean;
  originalDate?: string;
  rolloverCount: number;
  tags: string[];
  estimatedMinutes?: number;
  repeatInterval?: number;
  repeatEnd?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  weather?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  unit?: string;
  reminderTime?: string;
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  count: number;
  note?: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  type: 'diary_extract' | 'manual' | 'idea' | 'insight' | 'bookmark' | 'other';
  source?: string;
  sourceId?: string;
  tags: string[];
  category: string;
  archived: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryCandidate {
  id: string;
  sourceType: 'diary' | 'task' | 'quick_capture';
  sourceId: string;
  sourceDate: string;
  extractedTitle: string;
  extractedContent: string;
  suggestedCategory: string;
  suggestedTags: string[];
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedMemoryId?: string;
  extractedAt: string;
}

export interface DailyRecord {
  id: string;
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  diaryWritten: boolean;
  moodAvg?: number;
  habitsCompleted: number;
  habitsTotal: number;
  habitsCompletionRate: number;
  wordCount: number;
  createdAt: string;
}

export interface QuickCapture {
  id: string;
  content: string;
  type: 'diary' | 'todo' | 'idea' | 'memory' | 'uncategorized';
  processed: boolean;
  processedInto?: {
    diaryId?: string;
    taskId?: string;
    memoryId?: string;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'task' | 'memory' | 'diary';
  color: string;
  icon: string;
  order: number;
}

export interface SyncPayloadItem {
  type: 'task' | 'diary' | 'memory';
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  scheduledDate?: string;
  content?: string;
  category?: string;
}

export interface SyncLog {
  id: string;
  items: SyncPayloadItem[];
  source: string;
  status: 'success' | 'partial' | 'error';
  syncedAt: string;
}

export interface Quote {
  id: string;
  content: string;
  author?: string;
  createdAt: string;
}

// ── Emotion & Risk Detection Models ────────────────────────────

export type RiskLevel = 'low' | 'medium_low' | 'medium' | 'high' | 'critical';

export interface EmotionRecord {
  id: string;
  date: string;
  source: 'diary' | 'chat' | 'combined';
  sourceId?: string;
  sentimentScore: number; // -1 到 1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  riskLevel: RiskLevel;
  keywords: string[];
  socialScore?: number;
  analysis?: string;
  createdAt: string;
}

export interface TypingBehavior {
  avgSpeed: number;        // 平均打字速度 (字符/分钟)
  deleteRate: number;      // 删除键比例 (0-1)
  pauseRate: number;       // 停顿次数/分钟
  sessionDuration: number; // 会话时长 (分钟)
}

export interface BehaviorRecord {
  id: string;
  date: string;
  diaryWritten: boolean;
  diaryWordCount: number;
  moodRating: number | null;
  tasksCompleted: number;
  tasksTotal: number;
  habitsChecked: number;
  habitsTotal: number;
  activeHours: number[];
  chatMessages: number;
  typingBehavior?: TypingBehavior | null; // 打字行为数据（无感识别）
  createdAt: string;
}

export interface HealthProfile {
  id: string;
  date: string;
  emotionalHealthIndex: number; // 0-100
  emotionalVolatility: number;
  riskLevel: RiskLevel;
  dimensions: {
    mood: number;
    stress: number;
    energy: number;
    social: number;
    sleep: number;
    selfCare: number;
  };
  insights: string[];
  suggestions: string[];
  createdAt: string;
}

export interface CrisisLog {
  id: string;
  date: string;
  triggerSource: 'diary' | 'chat';
  triggerContent: string;
  riskLevel: 'high' | 'critical';
  handled: boolean;
  action: string;
  createdAt: string;
}

/**
 * 危机安全计划（Safety Planning Intervention, Stanley & Brown 2012）
 * 单行表（id='default'），六个自由文本字段均加密存储。
 * 用户在高风险/危机时刻可一键调出，作为"识别→干预→转介"闭环的最后一环。
 */
export interface SafetyPlan {
  id: string;                    // 'default'
  version: number;               // 编辑次数
  warningSigns: string;          // ① 预警信号（加密）
  copingStrategies: string;      // ② 自我应对策略（加密）
  distractionActivities: string; // ③ 转移注意力的人与事（加密）
  trustedContacts: string;       // ④ 可信赖联系人（加密）
  professionalResources: string; // ⑤ 专业求助资源（加密）
  reasonsToLive: string;         // ⑥ 活下去的理由（加密）
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  date: string;
  summary: string;
  keyTopics: string[];
  emotionalState: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  sessionId?: string;      // 会话隔离（v11，AI 对话陪伴）
  provider?: 'cloud' | 'fallback';  // 最后一条来源标记
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  type: 'PHQ9' | 'GAD7' | 'PSS10' | 'CSSRS' | 'ISI7' | 'CDRISC10';
  date: string;
  scores: number[];
  totalScore: number;
  level: string;
  suggestions: string;
  createdAt: string;
}

export interface TherapyRecord {
  id: string;
  type: 'thought_record' | 'breathing' | 'mindfulness';
  date: string;
  data: Record<string, unknown>;
  moodBefore: number;
  moodAfter: number;
  createdAt: string;
}

/**
 * 反馈触点类型（统一反馈模型，见 deliverables/qingyuanbei/arch-self-evolution.md §2.2）
 * - sentiment：情感分类纠错（F1）
 * - risk_level：风险等级校准（F2，direction/scope）
 * - behavior：行为洞察对错（F3/P2）
 * - recommendation：干预有效性 / 推荐相关性（F4）
 * - forecast：情绪预测偏差（F5，forecastValue/actualValue/horizon）
 * - crisis_false_alarm：危机提醒误报（方案A 个人化降级信号；text 为触发原文）
 * - early_warning / ai_response：历史遗留触点
 */
export type FeedbackType =
  | 'sentiment'
  | 'ai_response'
  | 'recommendation'
  | 'early_warning'
  | 'risk_level'
  | 'behavior'
  | 'forecast'
  | 'crisis_false_alarm';

export interface FeedbackLog {
  id: string;
  type: FeedbackType;
  targetId?: string;
  /** 用户自由文本（加密字段 encryptField） */
  text?: string;
  /** 原预测标签/等级（可查询枚举） */
  predicted: string;
  feedback: 'accurate' | 'inaccurate';
  accurate?: 'accurate' | 'inaccurate';
  refId?: string;
  /** 用户纠正内容（自由文本/枚举，写入时 encryptField） */
  correction?: string;
  /** 用户纠正后的枚举标签（sentiment 触点，明文） */
  correctedLabel?: string;
  /** 风险/预测方向（risk_level / forecast 触点，明文枚举） */
  direction?: 'overestimate' | 'underestimate';
  /** 风险信号范围（risk_level 触点，明文枚举） */
  scope?: 'emotion' | 'behavior' | 'diary' | 'assessment' | 'chat';
  /** 预测值（forecast 触点，明文数值） */
  forecastValue?: number;
  /** 到期真实值（forecast 触点，明文数值） */
  actualValue?: number;
  /** 预测步长 1..7（forecast 触点，明文数值） */
  horizon?: number;
  createdAt: string;
  timestamp?: number;
}

/**
 * 本地自进化模型（单行，id='default'）
 *
 * 这是「学习参数」的逻辑结构：均为聚合统计（无原文/无 PII），
 * 但按「加密本地」铁律整行 JSON.stringify 后 encryptField 加密落盘
 * （实际存储行见 SelfEvoModelRow）。
 *
 * 危机通道（sentiment.priors 无 crisis 维度）、临床量表（risk 无 assessment/chat 因子）
 * 均不参与个性化，保证危机判定与 C-SSRS/PHQ-9/GAD-7 权威不受反馈影响。
 */
export interface SelfEvoModel {
  id: string; // 'default'
  sentiment: {
    /** 先验偏移 β（neg/neu/pos；crisis 冻结不存） */
    priors: { neg: number; neu: number; pos: number };
    /** 置信度温度重标定 T（默认 1.0） */
    temperature: number;
    sampleCount: number;
  };
  risk: {
    /** 单信号乘法因子 λ（emotion/behavior/diary；assessment/chat 冻结=1） */
    weightFactors: { emotion: number; behavior: number; diary: number };
    /** 全局偏移 δ ∈ [-10, 10] */
    offset: number;
    sampleCount: number;
  };
  intervention: {
    /** 带遗忘因子的有效率 EMA（breathing/mindfulness/thought_record） */
    emaEffectiveness: { breathing: number; mindfulness: number; thought_record: number };
    /** 有效样本量（冷启动判据，< 3 回退纯规则） */
    effectiveN: { breathing: number; mindfulness: number; thought_record: number };
    sampleCount: number;
  };
  forecast: {
    /** 按步长偏差 b_h（长度 7，默认全 0） */
    horizonBias: number[];
    /** Platt 重标定参数 a（默认 1.0） */
    probA: number;
    /** Platt 重标定参数 b（默认 0） */
    probB: number;
    sampleCount: number;
  };
  lastUpdated: number; // epoch ms
  version: number;     // 参数结构版本
}

/**
 * selfEvoModels 表的实际存储行：整行参数 JSON.stringify 后作为单字段加密。
 * id 保持明文（'default'）用于查询；payload 为 encryptField(JSON.stringify(SelfEvoModel))。
 */
export interface SelfEvoModelRow {
  id: string;
  payload: string;
}

/**
 * AI 报告缓存
 * 按 startDate+endDate 复用同一周期报告，避免重复推理
 */
export interface AIReportCache {
  id: string;            // `${startDate}_${endDate}`
  period: string;       // `${startDate} ~ ${endDate}`
  report: any;          // AIReport（避免与 ReportAIService 循环引用）
  generatedAt: string;  // ISO timestamp
}
