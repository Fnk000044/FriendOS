const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  onSetLanguage: (callback) => {
    const handler = (_event, lang) => callback(lang);
    ipcRenderer.on('set-language', handler);
    return () => ipcRenderer.removeListener('set-language', handler);
  },
  onExportData: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('export-data', handler);
    return () => ipcRenderer.removeListener('export-data', handler);
  },
  onImportData: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('import-data', handler);
    return () => ipcRenderer.removeListener('import-data', handler);
  },
  onShowAbout: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('show-about', handler);
    return () => ipcRenderer.removeListener('show-about', handler);
  },
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),

  // Sync server
  onSyncReceive: (callback) => {
    const handler = (_event, items) => callback(items);
    ipcRenderer.on('sync-receive', handler);
    return () => ipcRenderer.removeListener('sync-receive', handler);
  },
  onSyncStatusChanged: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('sync-status-changed', handler);
    return () => ipcRenderer.removeListener('sync-status-changed', handler);
  },
  startSyncServer: () => ipcRenderer.invoke('start-sync-server'),
  stopSyncServer: () => ipcRenderer.invoke('stop-sync-server'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
  removeSyncReceive: (callback) => {
    if (callback) {
      ipcRenderer.removeListener('sync-receive', callback);
    }
  },
  removeSyncStatusChanged: (callback) => {
    if (callback) {
      ipcRenderer.removeListener('sync-status-changed', callback);
    }
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximize-change', handler);
    return () => ipcRenderer.removeListener('window-maximize-change', handler);
  },

  // External apps
  openExternal: (path) => ipcRenderer.invoke('open-external', path),

  // API Key encrypted storage (via Electron safeStorage)
  apiKeyGet: (name) => ipcRenderer.invoke('api-key-get', name),
  apiKeySet: (name, value) => ipcRenderer.invoke('api-key-set', name, value),

  // Local model
  localModelList: () => ipcRenderer.invoke('local-model-list'),
  localModelInit: (modelPath) => ipcRenderer.invoke('local-model-init', modelPath),
  localModelComplete: (prompt, options) => ipcRenderer.invoke('local-model-complete', prompt, options),
  localModelCompleteStream: (prompt, onChunk, options) => {
    ipcRenderer.removeAllListeners('local-model-chunk');
    const listener = (_event, data) => {
      onChunk(data);
      if (data.done) {
        ipcRenderer.removeListener('local-model-chunk', listener);
      }
    };
    ipcRenderer.on('local-model-chunk', listener);
    ipcRenderer.send('local-model-complete-stream', prompt, options);
    return () => {
      ipcRenderer.removeListener('local-model-chunk', listener);
    };
  },
  localModelDispose: () => ipcRenderer.invoke('local-model-dispose'),
  getCudaStatus: () => ipcRenderer.invoke('get-cuda-status'),

  // Sentiment analysis
  sentimentAnalyze: (text) => ipcRenderer.invoke('sentiment-analyze', text),
  sentimentCloudAnalyze: (text, context) => ipcRenderer.invoke('sentiment-cloud-analyze', text, context),
  sentimentSetApiKey: (apiKey) => ipcRenderer.invoke('sentiment-set-api-key', apiKey),
  sentimentGetModelStatus: () => ipcRenderer.invoke('sentiment-get-model-status'),

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
    ipcRenderer.on('notification:sent', handler);
    return () => ipcRenderer.removeListener('notification:sent', handler);
  },
  removeNotificationSent: (callback) => {
    if (callback) {
      ipcRenderer.removeListener('notification:sent', callback);
    }
  },
});
