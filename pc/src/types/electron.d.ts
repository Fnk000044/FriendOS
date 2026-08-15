interface SyncPayloadItem {
  type: 'task' | 'diary' | 'memory';
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  scheduledDate?: string;
  content?: string;
  category?: string;
}

interface SyncServerStatus {
  running: boolean;
  ip: string;
  port: number;
  token: string;
  error?: string;
}

interface LocalModelInfo {
  id: string;
  name: string;
  size: string;
  path: string;
}

interface CudaStatus {
  available: boolean;
  gpuDevices: string[];
  supportsGpuOffloading: boolean;
  error?: string;
}

interface SentimentResult {
  level: 'low' | 'medium' | 'high' | 'crisis';
  score: number;
  positiveProb: number;
  negativeProb: number;
  neutralProb?: number;
  crisisProb?: number;
  /** 主导 4 分类标签（供情感纠错 F1 使用） */
  predictedClass?: 'negative' | 'neutral' | 'positive' | 'crisis';
  keywords: string[];
  needCloud: boolean;
  method: 'keyword' | 'onnx';
  /** 是否应用了用户先验校准 */
  calibrated?: boolean;
  error?: string;
  timestamp: number;
}

interface EmotionAnalysisResult {
  date: string;
  sourceId?: string;
  sentimentScore: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  riskLevel: string;
  keywords: string[];
  socialScore: number;
  sleepPattern: { hour: number; isLateNight: boolean };
  wordCount: number;
  moodRating: number;
}

interface EmotionHealthIndexParams {
  sentimentScore?: number;
  moodRating?: number;
  taskCompletionRate?: number;
  habitConsistency?: number;
  socialScore?: number;
  sleepScore?: number;
}

interface RiskFactors {
  recentEmotions?: Array<{ riskLevel: string }>;
  behaviorRecord?: {
    diaryWritten?: boolean;
    tasksCompleted?: number;
    tasksTotal?: number;
    habitsChecked?: number;
    habitsTotal?: number;
    activeHours?: number[];
  } | null;
  moodTrend?: number[];
  crisisKeywords?: boolean;
}

interface CloudAnalysisResult {
  crisisLevel: 'low' | 'medium' | 'high';
  analysis: string;
  suggestions: string[];
  error?: string;
  timestamp: number;
}

// ── AI 对话陪伴类型 ──────────────────────────────────────────
interface ChatChunk {
  requestId: string;
  delta: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ChatContext {
  avgMood7d?: number;
  moodTrend?: 'improving' | 'stable' | 'declining';
  riskScore?: number;
  riskLevel?: string;
  lastAssessment?: string;
  termPhase?: string;
  stressLevel?: number;
  lateNightHint?: string;
  lastSummary?: string;
  bestIntervention?: string;
}

interface ChatSendResult {
  ok: boolean;
  fullText?: string;
  provider?: string;
  model?: string;
  error?: string;
  code?: 'LLM_UNAVAILABLE' | 'LLM_TIMEOUT' | 'LLM_UNAUTHORIZED' | 'LLM_HTTP_ERROR' | 'LLM_BAD_REQUEST' | 'LLM_UNKNOWN';
}

interface ChatProviderConfig {
  provider: string;
  providerName: string;
  model: string;
  hasKey: boolean;
  availableProviders: Array<{ key: string; name: string }>;
}

interface ChatFallbackResult {
  text: string;
  branch: string;
  isCrisis: boolean;
  /** 会话状态增量（渲染层合并回 chatStore.session） */
  sessionDelta?: ChatSessionDelta;
}

// ── 情感感知多轮对话：会话状态（渲染层持有，主进程只读+返回增量）──
interface ChatSessionState {
  /** 已对话轮数（user 消息计数） */
  turnCount: number;
  /** 最近情绪历史（FIFO 10）：negative/neutral/positive/crisis */
  emotionHistory: string[];
  /** 会话内提取主题（最多 5） */
  topics: string[];
  /** 上下文摘要："用户近况：{topics 前3}；情绪：{dominantEmotion}"（截断 60 字） */
  summary: string;
  /** 已用模板标识（branch:index），用于会话内去重 */
  usedTemplates: string[];
  /** 主导情绪 */
  dominantEmotion: string;
}

interface ChatSessionDelta {
  turnCount?: number;
  emotionHistory?: string[];
  topics?: string[];
  summary?: string;
  usedTemplates?: string[];
  dominantEmotion?: string;
}

// ── 启动自检 ──────────────────────────────────────────────
interface DiagnosticsResult {
  appVersion: string;
  network: { online: boolean };
  model: { onnxLoaded: boolean; onnxAvailable: boolean; method: string };
  apiKey: { hasKey: boolean; provider?: string };
  /** 降级路径：cloud=云对话可用；template=离线模板对话 */
  degradationPath: 'cloud' | 'template';
  demoMode: boolean;
  timestamp: number;
  /** 主进程健康（P2-12）：degraded=true 表示发生过未捕获异常/未处理拒绝 */
  mainProcess?: { degraded: boolean; lastError: string };
}

// ── 风险趋势预测（P2-2 统计学习，method/note 必须如实返回）────────
interface RiskDailyPoint {
  date: string;
  mood?: number | null;            // 1-5
  sentimentScore?: number | null;  // -1..1
  tasksCompleted?: number;
  tasksTotal?: number;
  habitsChecked?: number;
  habitsTotal?: number;
  diaryWritten?: boolean;
  lateNight?: boolean;             // 0-5 点活跃
  riskScore?: number | null;       // 0-100
}

interface RiskPredictionInput {
  dailySeries: RiskDailyPoint[];
  personalBaseline?: {
    mood?: { mean: number; std: number };
    taskCompletion?: { mean: number; std: number };
    habitConsistency?: { mean: number; std: number };
  } | null;
}

interface RiskPredictionResult {
  /** 未来 7 天风险等级上升 ≥1 档的概率（0-1） */
  riskUpgradeProb: number;
  /** 未来 7 天情绪预测（1-5） */
  moodForecast7d: number[];
  riskTrend: 'rising' | 'stable' | 'falling';
  /** 置信度 0-1（样本量/拟合质量） */
  confidence: number;
  method: 'logistic-regression' | 'linear-regression' | 'heuristic-fallback';
  /** 方法学说明（UI 必须展示，引用 docs/risk_methodology.md） */
  note: string;
}

// ── 证据链（P0-6，渲染层纯函数产出）───────────────────────────
interface EvidenceContribution {
  key: 'emotion' | 'behavior' | 'assessment' | 'chat' | 'diary';
  label: string;
  /** 原始信号分 0-100 */
  score: number;
  /** 权重 0-1 */
  weight: number;
  /** score × weight（对总分的贡献） */
  contribution: number;
  status: 'elevated' | 'normal' | 'no_data';
}

interface EvidenceTrigger {
  type: string;
  description: string;
  source: string;
}

interface EvidenceAction {
  label: string;
  /** 路由路径 target（如 /diary/new、/therapy?exercise=breathing） */
  target: string;
}

interface EvidenceChain {
  totalScore: number;
  riskLevel: string;
  contributions: EvidenceContribution[];
  triggers: EvidenceTrigger[];
  actions: EvidenceAction[];
  escalation: {
    escalated: boolean;
    reasons: string[];
    crisisFactorCount: number;
  };
  disclaimer: string;
  /** 方法说明文档路径（docs/risk_methodology.md） */
  methodRef: string;
}

interface ChatGreetingResult {
  text: string;
  branch: string;
}

// ── 本地自进化校准类型（渲染层 ↔ 主进程契约）────────────────
/** 情感先验校准（crisis 通道冻结，不在此结构；crisisFeedback 为方案A个人化误报样本） */
interface SentimentCalibration {
  priors: { neg: number; neu: number; pos: number };
  temperature?: number;
  sampleCount: number;
  /** 近期用户标记的危机误报样本（仅用于无 L1 硬词时的个人化降级） */
  crisisFeedback?: Array<{ text: string; verdict: 'false_alarm' }>;
}

/** 风险个性化（assessment/chat 冻结 λ=1） */
interface RiskPersonalization {
  weightFactors: { emotion: number; behavior: number; diary: number };
  offset: number;
  sampleCount: number;
}

/** 预测校准 */
interface ForecastCalibration {
  horizonBias: number[]; // len 7
  probA: number;
  probB: number;
  sampleCount: number;
}

interface ElectronAPI {
  // 沙箱模式下 platform 走异步 IPC 缓存；isElectron 仍是常量
  // 旧的同步 platform 属性保留（首帧可能为 null），新增 getPlatform() 异步入口
  platform: string | null;
  isElectron: boolean;
  getPlatform: () => Promise<string>;
  onSetLanguage: (callback: (lang: string) => void) => void;
  onExportData: (callback: () => void) => void;
  onImportData: (callback: () => void) => void;
  onShowAbout: (callback: () => void) => void;
  openDataFolder: () => Promise<void>;

  // 自定义存储位置（PRD v3 P1-16）
  storageGetLocation: () => Promise<{ current: string; custom: boolean }>;
  storageSelectLocation: () => Promise<{ canceled: boolean; path?: string; error?: string }>;
  storageMigrate: (targetDir: string) => Promise<{ success: boolean; restartRequired?: boolean; error?: string }>;

  // Sync server
  onSyncReceive: (callback: (items: SyncPayloadItem[]) => void) => () => void;
  onSyncStatusChanged: (callback: (status: SyncServerStatus) => void) => () => void;
  startSyncServer: () => Promise<SyncServerStatus>;
  stopSyncServer: () => Promise<{ success: boolean }>;
  getSyncStatus: () => Promise<SyncServerStatus>;
  removeSyncReceive: () => void;
  removeSyncStatusChanged: () => void;

  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;

  // Local model (removed — kept for type compat of legacy callers)
  // localModel* APIs have been removed along with the Qwen model.

  // Relaunch app (used by SettingsPage reset flow)
  relaunch: () => Promise<void>;

  // Sentiment analysis
  sentimentAnalyze: (text: string, calibration?: SentimentCalibration) => Promise<SentimentResult>;
  sentimentCloudAnalyze: (text: string, context?: { mood?: string | number; date?: string; tags?: string[] }) => Promise<CloudAnalysisResult>;
  sentimentSetApiKey: (apiKey: string) => Promise<{ success: boolean }>;
  sentimentGetModelStatus: () => Promise<{ onnxLoaded: boolean; onnxAvailable: boolean; method: string }>;
  sentimentResetOnnx: () => Promise<{ success: boolean; error?: string }>;

  // Emotion analysis engine
  emotionAnalyzeDiary: (diary: { id?: string; date: string; content: string; mood: number; createdAt?: string }, calibration?: SentimentCalibration) => Promise<EmotionAnalysisResult | null>;
  emotionAnalyzeConversation: (messages: Array<{ role: string; content: string }>, calibration?: SentimentCalibration) => Promise<EmotionAnalysisResult | null>;
  emotionCalculateHealthIndex: (params: EmotionHealthIndexParams) => Promise<number>;
  emotionCalculateRiskLevel: (factors: RiskFactors) => Promise<string>;
  emotionGenerateInsights: (profile: { emotionalHealthIndex: number; dimensions: Record<string, number>; riskLevel: string }) => Promise<string[]>;
  emotionGenerateSuggestions: (profile: { riskLevel: string; dimensions: Record<string, number> }) => Promise<string[]>;

  // Behavior analyzer
  behaviorAnalyzeDaily: (record: any, context?: any, baseline?: any) => Promise<{ anomalies: any[]; riskFactors: any[] }>;
  behaviorAnalyzeTrends: (records: any[]) => Promise<any>;
  behaviorGenerateSummary: (trends: any) => Promise<string>;
  /** 计算个人基线（≥7 天数据，返回基线对象或 null） */
  behaviorCalculateBaseline: (records: any[]) => Promise<any>;

  // Backup / restore
  backupExport: (json: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  backupImport: () => Promise<{ success: boolean; data?: any; canceled?: boolean; error?: string }>;
  /** 心理报告导出 PDF：渲染层传 HTML（用户内容需转义），主进程生成 A4 PDF 并保存 */
  reportExportPdf: (payload: { html: string; defaultName?: string }) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;

  // Storage info + cache cleanup
  getStorageSize: () => Promise<{ total: number; cache: number; appData: number; logs: number }>;
  clearCache: () => Promise<{ success: boolean; error?: string }>;

  // Windows Hello 已移除（PRD v3 P0-9：不再弹系统凭据/PIN）

  // External apps
  openExternal: (path: string) => Promise<{ success: boolean; error?: string }>;

  // API Key encrypted storage (via Electron safeStorage)
  apiKeyExists: (name: string) => Promise<boolean>;
  apiKeyGet: (name: string) => Promise<string>;
  apiKeySet: (name: string, value: string) => Promise<{ success: boolean; error?: string }>;

  // Notifications
  notificationSetReminders: (reminders: any[]) => Promise<any>;
  notificationGetReminders: () => Promise<any[]>;
  notificationAddReminder: (reminder: any) => Promise<any>;
  notificationRemoveReminder: (id: string) => Promise<any>;
  notificationToggleReminder: (id: string) => Promise<any>;
  notificationStartCheck: () => Promise<any>;
  notificationStopCheck: () => Promise<any>;
  notificationTest: () => Promise<any>;
  onNotificationSent: (callback: (data: any) => void) => void;
  removeNotificationSent: () => void;

  // Risk calculation engine (best-effort; may be unavailable in some builds)
  riskCalculate?: (params: {
    emotionRecords: any[];
    behaviorData: Record<string, unknown>;
    assessments: any[];
    conversationSummaries: any[];
    diaries: any[];
    personalization?: RiskPersonalization;
  }) => Promise<any>;

  // AI 对话陪伴（云 LLM 走主进程代理，渲染层不持有 key）
  chatSend: (params: {
    requestId: string;
    messages: ChatMessage[];
    context?: ChatContext;
    systemPrompt?: string;
    providerOverride?: string;
  }) => Promise<ChatSendResult>;
  chatTestConnection: (providerOverride?: string) => Promise<{ success: boolean; latency?: number; model?: string; provider?: string; error?: string }>;
  chatGetProviderConfig: () => Promise<ChatProviderConfig>;
  chatFallback: (params: {
    text: string;
    emotionLabel?: string;
    negativeProb?: number;
    positiveProb?: number;
    crisisProb?: number;
    session?: ChatSessionState;
    now?: string;
  }) => Promise<ChatFallbackResult>;
  chatGreeting: (params: { silentDays?: number; riskRising?: boolean }) => Promise<ChatGreetingResult>;
  onChatChunk: (callback: (chunk: ChatChunk) => void) => () => void;
  removeChatChunk: () => void;

  // 启动自检
  diagnosticsCheck: (params: { demoMode: boolean }) => Promise<DiagnosticsResult>;

  // 主进程降级通知（P2-12：uncaughtException/unhandledRejection 时推送给渲染层）
  onMainDegraded: (callback: (info: { message: string }) => void) => () => void;

  // 风险趋势预测（P2-2 统计学习，method/note 如实返回）
  predictionGetTrend: (input: RiskPredictionInput & { forecastCalibration?: ForecastCalibration }) => Promise<RiskPredictionResult>;

  // 主动风险预警
  riskNotify: (params: {
    level: 'attention' | 'reminder' | 'warning' | 'crisis';
    title: string;
    body: string;
    action?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
