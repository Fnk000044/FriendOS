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
  crisisProb?: number;
  keywords: string[];
  needCloud: boolean;
  method: 'keyword' | 'onnx';
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
}

interface ChatGreetingResult {
  text: string;
  branch: string;
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
  sentimentAnalyze: (text: string) => Promise<SentimentResult>;
  sentimentCloudAnalyze: (text: string, context?: { mood?: string | number; date?: string; tags?: string[] }) => Promise<CloudAnalysisResult>;
  sentimentSetApiKey: (apiKey: string) => Promise<{ success: boolean }>;
  sentimentGetModelStatus: () => Promise<{ onnxLoaded: boolean; onnxAvailable: boolean; method: string }>;
  sentimentResetOnnx: () => Promise<{ success: boolean; error?: string }>;

  // Emotion analysis engine
  emotionAnalyzeDiary: (diary: { id?: string; date: string; content: string; mood: number; createdAt?: string }) => Promise<EmotionAnalysisResult | null>;
  emotionAnalyzeConversation: (messages: Array<{ role: string; content: string }>) => Promise<EmotionAnalysisResult | null>;
  emotionCalculateHealthIndex: (params: EmotionHealthIndexParams) => Promise<number>;
  emotionCalculateRiskLevel: (factors: RiskFactors) => Promise<string>;
  emotionGenerateInsights: (profile: { emotionalHealthIndex: number; dimensions: Record<string, number>; riskLevel: string }) => Promise<string[]>;
  emotionGenerateSuggestions: (profile: { riskLevel: string; dimensions: Record<string, number> }) => Promise<string[]>;

  // Behavior analyzer
  behaviorAnalyzeDaily: (record: any, context?: any, baseline?: any) => Promise<{ anomalies: any[]; riskFactors: any[] }>;
  behaviorAnalyzeTrends: (records: any[]) => Promise<any>;
  behaviorGenerateSummary: (trends: any) => Promise<string>;

  // Backup / restore
  backupExport: (json: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  backupImport: () => Promise<{ success: boolean; data?: any; canceled?: boolean; error?: string }>;

  // Storage info + cache cleanup
  getStorageSize: () => Promise<{ total: number; cache: number; appData: number; logs: number }>;
  clearCache: () => Promise<{ success: boolean; error?: string }>;

  // Windows Hello biometric unlock
  windowsHelloAvailable: () => Promise<{ available: boolean; reason?: string }>;
  windowsHelloVerify: () => Promise<{ success: boolean; error?: string }>;

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
  chatFallback: (params: { text: string; emotionLabel?: string }) => Promise<ChatFallbackResult>;
  chatGreeting: (params: { silentDays?: number; riskRising?: boolean }) => Promise<ChatGreetingResult>;
  onChatChunk: (callback: (chunk: ChatChunk) => void) => () => void;
  removeChatChunk: () => void;

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
