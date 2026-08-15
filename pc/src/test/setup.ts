import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB for Dexie
import 'fake-indexeddb/auto';

// jsdom 无 navigator.clipboard，提供最小 stub 避免 HotlineCard 等组件复制路径抛错
if (!('clipboard' in navigator)) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn().mockResolvedValue('') },
    configurable: true,
  });
}
// document.execCommand 在 jsdom 中缺失，HotlineCard fallback 路径会兜底捕获
if (typeof (document as any).execCommand !== 'function') {
  (document as any).execCommand = vi.fn(() => false);
}

// Mock Electron API
(window as any).electronAPI = {
  platform: 'win32',
  isElectron: true,
  apiKeyGet: vi.fn().mockResolvedValue(null),
  apiKeySet: vi.fn().mockResolvedValue({ success: true }),
  sentimentAnalyze: vi.fn().mockResolvedValue({
    level: 'low',
    score: 0.5,
    positiveProb: 0.5,
    negativeProb: 0.5,
    crisisProb: 0,
    keywords: [],
    needCloud: false,
    method: 'keyword',
    timestamp: Date.now(),
  }),
  sentimentGetModelStatus: vi.fn().mockResolvedValue({ onnxLoaded: false }),
  onSyncReceive: vi.fn().mockReturnValue(() => {}),
  onSyncStatusChanged: vi.fn().mockReturnValue(() => {}),
  onSetLanguage: vi.fn().mockReturnValue(() => {}),
  minimizeWindow: vi.fn(),
  maximizeWindow: vi.fn(),
  closeWindow: vi.fn(),
  isMaximized: vi.fn().mockResolvedValue(false),
  onMaximizeChange: vi.fn().mockReturnValue(() => {}),
  openExternal: vi.fn().mockResolvedValue({ success: true }),
  relaunch: vi.fn().mockResolvedValue(undefined),
  emotionAnalyzeDiary: vi.fn().mockResolvedValue({}),
  emotionAnalyzeConversation: vi.fn().mockResolvedValue({}),
  emotionCalculateHealthIndex: vi.fn().mockResolvedValue(75),
  emotionCalculateRiskLevel: vi.fn().mockResolvedValue('low'),
  emotionGenerateInsights: vi.fn().mockResolvedValue([]),
  emotionGenerateSuggestions: vi.fn().mockResolvedValue([]),
  behaviorAnalyzeDaily: vi.fn().mockResolvedValue({}),
  behaviorAnalyzeTrends: vi.fn().mockResolvedValue({}),
  behaviorGenerateSummary: vi.fn().mockResolvedValue(''),
  notificationSetReminders: vi.fn().mockResolvedValue({ success: true }),
  notificationGetReminders: vi.fn().mockResolvedValue([]),
  notificationAddReminder: vi.fn().mockResolvedValue({ success: true }),
  notificationRemoveReminder: vi.fn().mockResolvedValue({ success: true }),
  notificationToggleReminder: vi.fn().mockResolvedValue({ success: true }),
  notificationStartCheck: vi.fn().mockResolvedValue({ success: true }),
  notificationStopCheck: vi.fn().mockResolvedValue({ success: true }),
  notificationTest: vi.fn().mockResolvedValue({ success: true }),
  onNotificationSent: vi.fn().mockReturnValue(() => {}),
  removeNotificationSent: vi.fn(),
  startSyncServer: vi.fn().mockResolvedValue({ running: false }),
  stopSyncServer: vi.fn().mockResolvedValue({ success: true }),
  getSyncStatus: vi.fn().mockResolvedValue({ running: false }),
  removeSyncReceive: vi.fn(),
  removeSyncStatusChanged: vi.fn(),
  sentimentCloudAnalyze: vi.fn().mockResolvedValue(null),
  sentimentSetApiKey: vi.fn().mockResolvedValue({ success: true }),
  openDataFolder: vi.fn(),
  chatSend: vi.fn().mockResolvedValue({ ok: false, code: 'LLM_UNAVAILABLE', error: 'no key' }),
  chatTestConnection: vi.fn().mockResolvedValue({ success: false, error: 'no key' }),
  chatGetProviderConfig: vi.fn().mockResolvedValue({ provider: 'qwen', providerName: '通义千问', model: 'qwen-plus', hasKey: false, availableProviders: [{ key: 'qwen', name: '通义千问' }] }),
  chatFallback: vi.fn().mockResolvedValue({ text: '我在听，能再说清楚一点吗？', branch: 'neutral', isCrisis: false }),
  chatGreeting: vi.fn().mockResolvedValue({ text: '我在呢，想聊聊吗？', branch: 'greeting' }),
  onChatChunk: vi.fn().mockReturnValue(() => {}),
  removeChatChunk: vi.fn(),
  riskNotify: vi.fn().mockResolvedValue({ success: true }),
  // 与真实 main.cjs 返回结构对齐：diagnostics.escalation 必须存在，
  // 否则组件解构 diagnostics.escalation.escalated 会崩（修复审计 P2-10）
  riskCalculate: vi.fn().mockResolvedValue({
    totalScore: 30,
    riskLevel: 'medium_low',
    breakdown: {},
    factors: [],
    diagnostics: { exclusionsHit: [], escalation: { escalated: false, reasons: [], crisisFactorCount: 0 } },
    summary: '',
    timestamp: Date.now(),
  }),
  reportExportPdf: vi.fn().mockResolvedValue({ success: false, canceled: true }),
  diagnosticsCheck: vi.fn().mockResolvedValue({
    appVersion: '0.0.5',
    network: { online: false },
    model: { onnxLoaded: true, onnxAvailable: true, method: 'onnx' },
    apiKey: { hasKey: false },
    degradationPath: 'template',
    demoMode: false,
    timestamp: Date.now(),
  }),
  predictionGetTrend: vi.fn().mockResolvedValue({
    riskUpgradeProb: 0.3,
    moodForecast7d: [3, 3, 3, 2, 2, 3, 3],
    riskTrend: 'stable',
    confidence: 0.6,
    method: 'heuristic-fallback',
    note: '样本不足，采用启发式回退（详见 docs/risk_methodology.md）',
  }),
  behaviorCalculateBaseline: vi.fn().mockResolvedValue(null),
};
