const { contextBridge, ipcRenderer } = require('electron');

// 沙箱模式说明：
// - `require('electron')` 在沙箱下被 Electron 白名单允许，仅暴露 contextBridge / ipcRenderer /
//   webFrame / clipboard 等渲染进程可用 API。本文件只用 contextBridge + ipcRenderer。
// - 不再 require 任何 Node 内置模块（fs/path/child_process 等），因此 main.cjs 可安全开启 sandbox: true。
// - process.platform 在沙箱下不可用（process 被剥离），改为通过 IPC 取值（get-platform）。

// 按通道维护 handler 集合（修复审计 P2-4：旧 Map 每通道只存一个 handler，
// 两处同时订阅同一事件时后注册者覆盖先注册者，先者的 cleanup 会误删后者的监听）
const handlerMap = new Map(); // channel -> Set<handler>

function on(channel, callback) {
  const handler = (_event, ...args) => callback(...args);
  if (!handlerMap.has(channel)) handlerMap.set(channel, new Set());
  handlerMap.get(channel).add(handler);
  ipcRenderer.on(channel, handler);
  return () => {
    const set = handlerMap.get(channel);
    if (set) {
      set.delete(handler);
      if (set.size === 0) handlerMap.delete(channel);
    }
    ipcRenderer.removeListener(channel, handler);
  };
}

function off(channel) {
  const set = handlerMap.get(channel);
  if (set) {
    for (const handler of set) {
      ipcRenderer.removeListener(channel, handler);
    }
    set.clear();
    handlerMap.delete(channel);
  }
}

// 平台标识走 IPC，避免沙箱下访问 process.platform
let _cachedPlatform = null;

contextBridge.exposeInMainWorld('electronAPI', {
  // platform/isElectron：保留同步语义兼容现有调用方
  // isElectron 仍是常量 true；platform 用 IPC 缓存，调用方在首帧可能拿到 null
  // （实际上 main.cjs 在 app.whenReady 后才创建窗口，IPC 已就绪；为安全起见提供 getPlatform() 异步入口）
  get isElectron() { return true; },
  get platform() { return _cachedPlatform; },
  getPlatform: async () => {
    if (_cachedPlatform) return _cachedPlatform;
    _cachedPlatform = await ipcRenderer.invoke('get-platform');
    return _cachedPlatform;
  },
  onSetLanguage: (callback) => on('set-language', callback),
  // Backup / Export
  backupExport: (jsonData) => ipcRenderer.invoke('backup-export', jsonData),
  backupImport: () => ipcRenderer.invoke('backup-import'),
  // 心理报告导出 PDF（HTML 由渲染层构建，主进程生成 A4 PDF）
  reportExportPdf: (payload) => ipcRenderer.invoke('report-export-pdf', payload),
  // Storage info + cache cleanup
  getStorageSize: () => ipcRenderer.invoke('get-storage-size'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  // Windows Hello 已移除（PRD v3 P0-9：不再弹系统凭据/PIN）
  onExportData: (callback) => on('export-data', callback),
  onImportData: (callback) => on('import-data', callback),
  onShowAbout: (callback) => on('show-about', callback),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  // 自定义存储位置（PRD v3 P1-16）
  storageGetLocation: () => ipcRenderer.invoke('storage:getLocation'),
  storageSelectLocation: () => ipcRenderer.invoke('storage:selectLocation'),
  storageMigrate: (targetDir) => ipcRenderer.invoke('storage:migrate', targetDir),

  // Sync server
  onSyncReceive: (callback) => on('sync-receive', callback),
  onSyncStatusChanged: (callback) => on('sync-status-changed', callback),
  startSyncServer: () => ipcRenderer.invoke('start-sync-server'),
  stopSyncServer: () => ipcRenderer.invoke('stop-sync-server'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
  // 保留向后兼容：移除该通道的全部监听
  removeSyncReceive: () => off('sync-receive'),
  removeSyncStatusChanged: () => off('sync-status-changed'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => on('window-maximize-change', callback),

  // External apps
  openExternal: (path) => ipcRenderer.invoke('open-external', path),

  // API Key encrypted storage (via Electron safeStorage)
  apiKeyExists: (name) => ipcRenderer.invoke('api-key-exists', name),
  apiKeyGet: (name) => ipcRenderer.invoke('api-key-get', name),
  apiKeySet: (name, value) => ipcRenderer.invoke('api-key-set', name, value),

  // Relaunch app (used by SettingsPage reset flow)
  relaunch: () => ipcRenderer.invoke('app-relaunch'),

  // Sentiment analysis（第 2 参透传用户情感先验校准，危机通道冻结）
  sentimentAnalyze: (text, calibration) => ipcRenderer.invoke('sentiment-analyze', text, calibration),
  sentimentCloudAnalyze: (text, context) => ipcRenderer.invoke('sentiment-cloud-analyze', text, context),
  sentimentSetApiKey: (apiKey) => ipcRenderer.invoke('sentiment-set-api-key', apiKey),
  sentimentGetModelStatus: () => ipcRenderer.invoke('sentiment-get-model-status'),
  sentimentResetOnnx: () => ipcRenderer.invoke('sentiment-reset-onnx'),

  // Emotion analysis engine
  emotionAnalyzeDiary: (diary, calibration) => ipcRenderer.invoke('emotion:analyzeDiary', diary, calibration),
  emotionAnalyzeConversation: (messages, calibration) => ipcRenderer.invoke('emotion:analyzeConversation', messages, calibration),
  emotionCalculateHealthIndex: (params) => ipcRenderer.invoke('emotion:calculateHealthIndex', params),
  emotionCalculateRiskLevel: (factors) => ipcRenderer.invoke('emotion:calculateRiskLevel', factors),
  emotionGenerateInsights: (profile) => ipcRenderer.invoke('emotion:generateInsights', profile),
  emotionGenerateSuggestions: (profile) => ipcRenderer.invoke('emotion:generateSuggestions', profile),

  // Behavior analyzer
  behaviorAnalyzeDaily: (record, context) => ipcRenderer.invoke('behavior:analyzeDaily', record, context),
  behaviorAnalyzeTrends: (records) => ipcRenderer.invoke('behavior:analyzeTrends', records),
  behaviorGenerateSummary: (trends) => ipcRenderer.invoke('behavior:generateSummary', trends),
  behaviorCalculateBaseline: (records) => ipcRenderer.invoke('behavior:calculateBaseline', records),

  // Risk scoring engine
  riskCalculate: (data) => ipcRenderer.invoke('risk:calculate', data),
  riskGetTrend: (dailyScores, days) => ipcRenderer.invoke('risk:getTrend', dailyScores, days),

  // AI 对话陪伴（云 LLM 走主进程代理，渲染层不持有 key）
  chatSend: (params) => ipcRenderer.invoke('chat:send', params),
  chatTestConnection: (providerOverride) => ipcRenderer.invoke('chat:testConnection', providerOverride),
  chatGetProviderConfig: () => ipcRenderer.invoke('chat:getProviderConfig'),
  chatFallback: (params) => ipcRenderer.invoke('chat:fallback', params),
  chatGreeting: (params) => ipcRenderer.invoke('chat:greeting', params),
  onChatChunk: (callback) => on('chat:chunk', callback),
  removeChatChunk: () => off('chat:chunk'),

  // Risk notification (主动预警)
  riskNotify: (params) => ipcRenderer.invoke('risk:notify', params),

  // 启动自检（P0-2）
  diagnosticsCheck: (params) => ipcRenderer.invoke('diagnostics:check', params),

  // 主进程降级通知（P2-12：uncaughtException/unhandledRejection 时告知渲染层）
  onMainDegraded: (callback) => on('main:degraded', callback),

  // 风险趋势预测（P2-2）
  predictionGetTrend: (input) => ipcRenderer.invoke('prediction:getTrend', input),

  // Notifications
  notificationSetReminders: (reminders) => ipcRenderer.invoke('notification:setReminders', reminders),
  notificationGetReminders: () => ipcRenderer.invoke('notification:getReminders'),
  notificationAddReminder: (reminder) => ipcRenderer.invoke('notification:addReminder', reminder),
  notificationRemoveReminder: (id) => ipcRenderer.invoke('notification:removeReminder', id),
  notificationToggleReminder: (id) => ipcRenderer.invoke('notification:toggleReminder', id),
  notificationStartCheck: () => ipcRenderer.invoke('notification:startCheck'),
  notificationStopCheck: () => ipcRenderer.invoke('notification:stopCheck'),
  notificationTest: () => ipcRenderer.invoke('notification:test'),
  onNotificationSent: (callback) => on('notification:sent', callback),
  removeNotificationSent: () => off('notification:sent'),
});
