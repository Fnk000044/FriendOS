const { contextBridge, ipcRenderer } = require('electron');

// 用 Map 存储 handler 引用，修复 removeSyncReceive/removeNotificationSent 引用不匹配 bug
// 注册时包装成新 handler，移除时用外部 callback 无法匹配 -> 改用 Map 按通道存储
const handlerMap = new Map();

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
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

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    handlerMap.set('window-maximize-change', handler);
    ipcRenderer.on('window-maximize-change', handler);
    return () => {
      ipcRenderer.removeListener('window-maximize-change', handler);
      handlerMap.delete('window-maximize-change');
    };
  },

  // External apps
  openExternal: (path) => ipcRenderer.invoke('open-external', path),

  // API Key encrypted storage (via Electron safeStorage)
  apiKeyExists: (name) => ipcRenderer.invoke('api-key-exists', name),
  apiKeyGet: (name) => ipcRenderer.invoke('api-key-get', name),
  apiKeySet: (name, value) => ipcRenderer.invoke('api-key-set', name, value),

  // Relaunch app (used by SettingsPage reset flow)
  relaunch: () => ipcRenderer.invoke('app-relaunch'),

  // Sentiment analysis
  sentimentAnalyze: (text) => ipcRenderer.invoke('sentiment-analyze', text),
  sentimentCloudAnalyze: (text, context) => ipcRenderer.invoke('sentiment-cloud-analyze', text, context),
  sentimentSetApiKey: (apiKey) => ipcRenderer.invoke('sentiment-set-api-key', apiKey),
  sentimentGetModelStatus: () => ipcRenderer.invoke('sentiment-get-model-status'),
  sentimentResetOnnx: () => ipcRenderer.invoke('sentiment-reset-onnx'),

  // Emotion analysis engine
  emotionAnalyzeDiary: (diary) => ipcRenderer.invoke('emotion:analyzeDiary', diary),
  emotionAnalyzeConversation: (messages) => ipcRenderer.invoke('emotion:analyzeConversation', messages),
  emotionCalculateHealthIndex: (params) => ipcRenderer.invoke('emotion:calculateHealthIndex', params),
  emotionCalculateRiskLevel: (factors) => ipcRenderer.invoke('emotion:calculateRiskLevel', factors),
  emotionGenerateInsights: (profile) => ipcRenderer.invoke('emotion:generateInsights', profile),
  emotionGenerateSuggestions: (profile) => ipcRenderer.invoke('emotion:generateSuggestions', profile),

  // Behavior analyzer
  behaviorAnalyzeDaily: (record, context) => ipcRenderer.invoke('behavior:analyzeDaily', record, context),
  behaviorAnalyzeTrends: (records) => ipcRenderer.invoke('behavior:analyzeTrends', records),
  behaviorGenerateSummary: (trends) => ipcRenderer.invoke('behavior:generateSummary', trends),

  // Risk scoring engine
  riskCalculate: (data) => ipcRenderer.invoke('risk:calculate', data),
  riskGetTrend: (dailyScores, days) => ipcRenderer.invoke('risk:getTrend', dailyScores, days),

  // Notifications
  notificationSetReminders: (reminders) => ipcRenderer.invoke('notification:setReminders', reminders),
  notificationGetReminders: () => ipcRenderer.invoke('notification:getReminders'),
  notificationAddReminder: (reminder) => ipcRenderer.invoke('notification:addReminder', reminder),
  notificationRemoveReminder: (id) => ipcRenderer.invoke('notification:removeReminder', id),
  notificationToggleReminder: (id) => ipcRenderer.invoke('notification:toggleReminder', id),
  notificationStartCheck: () => ipcRenderer.invoke('notification:startCheck'),
  notificationStopCheck: () => ipcRenderer.invoke('notification:stopCheck'),
  notificationTest: () => ipcRenderer.invoke('notification:test'),
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
});
