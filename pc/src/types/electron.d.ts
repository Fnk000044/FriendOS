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
  level: 'low' | 'medium' | 'high';
  score: number;
  positiveProb: number;
  negativeProb: number;
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

interface ElectronAPI {
  platform: string;
  isElectron: boolean;
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
}

interface Window {
  electronAPI?: ElectronAPI;
}
