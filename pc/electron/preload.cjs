const { contextBridge, ipcRenderer } = require('electron');

// 沙箱模式说明：
// - `require('electron')` 在沙箱下被 Electron 白名单允许，仅暴露 contextBridge / ipcRenderer /
//   webFrame / clipboard 等渲染进程可用 API。本文件只用 contextBridge + ipcRenderer。
// - 不再 require 任何 Node 内置模块（fs/path/child_process 等），因此 main.cjs 可安全开启 sandbox: true。
// - process.platform 在沙箱下不可用（process 被剥离），改为通过 IPC 取值（get-platform）。

<<<<<<< HEAD
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
=======
// 用 Map 存储 handler 引用，修复 removeSyncReceive/removeNotificationSent 引用不匹配 bug
// 注册时包装成新 handler，移除时用外部 callback 无法匹配 -> 改用 Map 按通道存储
const handlerMap = new Map();
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

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
<<<<<<< HEAD
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
=======
  onSetLanguage: (callback) => {
    const handler = (_event, lang) => callback(lang);
    handlerMap.set('set-language', handler);
    ipcRenderer.on('set-language', handler);
    return () => {
      ipcRenderer.removeListener('set-language', handler);
      handlerMap.delete('set-language');
    };
  },
  // Backup / Export
  backupExport: (jsonData) => ipcRenderer.invoke('backup-export', jsonData),
  backupImport: () => ipcRenderer.invoke('backup-import'),
  // Storage info + cache cleanup
  getStorageSize: () => ipcRenderer.invoke('get-storage-size'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  // Windows Hello biometric unlock
  windowsHelloAvailable: () => ipcRenderer.invoke('windows-hello-available'),
  windowsHelloVerify: () => ipcRenderer.invoke('windows-hello-verify'),
  onExportData: (callback) => {
    const handler = () => callback();
    handlerMap.set('export-data', handler);
    ipcRenderer.on('export-data', handler);
    return () => {
      ipcRenderer.removeListener('export-data', handler);
      handlerMap.delete('export-data');
    };
  },
  onImportData: (callback) => {
    const handler = () => callback();
    handlerMap.set('import-data', handler);
    ipcRenderer.on('import-data', handler);
    return () => {
      ipcRenderer.removeListener('import-data', handler);
      handlerMap.delete('import-data');
    };
  },
  onShowAbout: (callback) => {
    const handler = () => callback();
    handlerMap.set('show-about', handler);
    ipcRenderer.on('show-about', handler);
    return () => {
      ipcRenderer.removeListener('show-about', handler);
      handlerMap.delete('show-about');
    };
  },
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),

  // Sync server
  onSyncReceive: (callback) => {
    const handler = (_event, items) => callback(items);
    handlerMap.set('sync-receive', handler);
    ipcRenderer.on('sync-receive', handler);
    return () => {
      ipcRenderer.removeListener('sync-receive', handler);
      handlerMap.delete('sync-receive');
    };
  },
  onSyncStatusChanged: (callback) => {
    const handler = (_event, status) => callback(status);
    handlerMap.set('sync-status-changed', handler);
    ipcRenderer.on('sync-status-changed', handler);
    return () => {
      ipcRenderer.removeListener('sync-status-changed', handler);
      handlerMap.delete('sync-status-changed');
    };
  },
  startSyncServer: () => ipcRenderer.invoke('start-sync-server'),
  stopSyncServer: () => ipcRenderer.invoke('stop-sync-server'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
  // 保留向后兼容：通过 Map 存储的 handler 引用正确移除
  removeSyncReceive: () => {
    const handler = handlerMap.get('sync-receive');
    if (handler) {
      ipcRenderer.removeListener('sync-receive', handler);
      handlerMap.delete('sync-receive');
    }
  },
  removeSyncStatusChanged: () => {
    const handler = handlerMap.get('sync-status-changed');
    if (handler) {
      ipcRenderer.removeListener('sync-status-changed', handler);
      handlerMap.delete('sync-status-changed');
    }
  },
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
<<<<<<< HEAD
  onMaximizeChange: (callback) => on('window-maximize-change', callback),
=======
  onMaximizeChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    handlerMap.set('window-maximize-change', handler);
    ipcRenderer.on('window-maximize-change', handler);
    return () => {
      ipcRenderer.removeListener('window-maximize-change', handler);
      handlerMap.delete('window-maximize-change');
    };
  },
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  // External apps
  openExternal: (path) => ipcRenderer.invoke('open-external', path),

  // API Key encrypted storage (via Electron safeStorage)
  apiKeyExists: (name) => ipcRenderer.invoke('api-key-exists', name),
  apiKeyGet: (name) => ipcRenderer.invoke('api-key-get', name),
  apiKeySet: (name, value) => ipcRenderer.invoke('api-key-set', name, value),

  // Relaunch app (used by SettingsPage reset flow)
  relaunch: () => ipcRenderer.invoke('app-relaunch'),

<<<<<<< HEAD
  // Sentiment analysis（第 2 参透传用户情感先验校准，危机通道冻结）
  sentimentAnalyze: (text, calibration) => ipcRenderer.invoke('sentiment-analyze', text, calibration),
=======
  // Sentiment analysis
  sentimentAnalyze: (text) => ipcRenderer.invoke('sentiment-analyze', text),
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  sentimentCloudAnalyze: (text, context) => ipcRenderer.invoke('sentiment-cloud-analyze', text, context),
  sentimentSetApiKey: (apiKey) => ipcRenderer.invoke('sentiment-set-api-key', apiKey),
  sentimentGetModelStatus: () => ipcRenderer.invoke('sentiment-get-model-status'),
  sentimentResetOnnx: () => ipcRenderer.invoke('sentiment-reset-onnx'),

  // Emotion analysis engine
<<<<<<< HEAD
  emotionAnalyzeDiary: (diary, calibration) => ipcRenderer.invoke('emotion:analyzeDiary', diary, calibration),
  emotionAnalyzeConversation: (messages, calibration) => ipcRenderer.invoke('emotion:analyzeConversation', messages, calibration),
=======
  emotionAnalyzeDiary: (diary) => ipcRenderer.invoke('emotion:analyzeDiary', diary),
  emotionAnalyzeConversation: (messages) => ipcRenderer.invoke('emotion:analyzeConversation', messages),
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  emotionCalculateHealthIndex: (params) => ipcRenderer.invoke('emotion:calculateHealthIndex', params),
  emotionCalculateRiskLevel: (factors) => ipcRenderer.invoke('emotion:calculateRiskLevel', factors),
  emotionGenerateInsights: (profile) => ipcRenderer.invoke('emotion:generateInsights', profile),
  emotionGenerateSuggestions: (profile) => ipcRenderer.invoke('emotion:generateSuggestions', profile),

  // Behavior analyzer
  behaviorAnalyzeDaily: (record, context) => ipcRenderer.invoke('behavior:analyzeDaily', record, context),
  behaviorAnalyzeTrends: (records) => ipcRenderer.invoke('behavior:analyzeTrends', records),
  behaviorGenerateSummary: (trends) => ipcRenderer.invoke('behavior:generateSummary', trends),
<<<<<<< HEAD
  behaviorCalculateBaseline: (records) => ipcRenderer.invoke('behavior:calculateBaseline', records),
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  // Risk scoring engine
  riskCalculate: (data) => ipcRenderer.invoke('risk:calculate', data),
  riskGetTrend: (dailyScores, days) => ipcRenderer.invoke('risk:getTrend', dailyScores, days),

  // AI 对话陪伴（云 LLM 走主进程代理，渲染层不持有 key）
  chatSend: (params) => ipcRenderer.invoke('chat:send', params),
  chatTestConnection: (providerOverride) => ipcRenderer.invoke('chat:testConnection', providerOverride),
  chatGetProviderConfig: () => ipcRenderer.invoke('chat:getProviderConfig'),
  chatFallback: (params) => ipcRenderer.invoke('chat:fallback', params),
  chatGreeting: (params) => ipcRenderer.invoke('chat:greeting', params),
<<<<<<< HEAD
  onChatChunk: (callback) => on('chat:chunk', callback),
  removeChatChunk: () => off('chat:chunk'),
=======
  onChatChunk: (callback) => {
    const handler = (_event, data) => callback(data);
    handlerMap.set('chat:chunk', handler);
    ipcRenderer.on('chat:chunk', handler);
    return () => {
      ipcRenderer.removeListener('chat:chunk', handler);
      handlerMap.delete('chat:chunk');
    };
  },
  removeChatChunk: () => {
    const handler = handlerMap.get('chat:chunk');
    if (handler) {
      ipcRenderer.removeListener('chat:chunk', handler);
      handlerMap.delete('chat:chunk');
    }
  },
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  // Risk notification (主动预警)
  riskNotify: (params) => ipcRenderer.invoke('risk:notify', params),

<<<<<<< HEAD
  // 启动自检（P0-2）
  diagnosticsCheck: (params) => ipcRenderer.invoke('diagnostics:check', params),

  // 主进程降级通知（P2-12：uncaughtException/unhandledRejection 时告知渲染层）
  onMainDegraded: (callback) => on('main:degraded', callback),

  // 风险趋势预测（P2-2）
  predictionGetTrend: (input) => ipcRenderer.invoke('prediction:getTrend', input),

=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  // Notifications
  notificationSetReminders: (reminders) => ipcRenderer.invoke('notification:setReminders', reminders),
  notificationGetReminders: () => ipcRenderer.invoke('notification:getReminders'),
  notificationAddReminder: (reminder) => ipcRenderer.invoke('notification:addReminder', reminder),
  notificationRemoveReminder: (id) => ipcRenderer.invoke('notification:removeReminder', id),
  notificationToggleReminder: (id) => ipcRenderer.invoke('notification:toggleReminder', id),
  notificationStartCheck: () => ipcRenderer.invoke('notification:startCheck'),
  notificationStopCheck: () => ipcRenderer.invoke('notification:stopCheck'),
  notificationTest: () => ipcRenderer.invoke('notification:test'),
<<<<<<< HEAD
  onNotificationSent: (callback) => on('notification:sent', callback),
  removeNotificationSent: () => off('notification:sent'),
=======
  onNotificationSent: (callback) => {
    const handler = (_event, data) => callback(data);
    handlerMap.set('notification:sent', handler);
    ipcRenderer.on('notification:sent', handler);
    return () => {
      ipcRenderer.removeListener('notification:sent', handler);
      handlerMap.delete('notification:sent');
    };
  },
  removeNotificationSent: () => {
    const handler = handlerMap.get('notification:sent');
    if (handler) {
      ipcRenderer.removeListener('notification:sent', handler);
      handlerMap.delete('notification:sent');
    }
  },
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
});
