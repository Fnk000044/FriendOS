const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const http = require('http');
const { randomUUID } = require('crypto');
const os = require('os');

const isDev = !app.isPackaged;
let mainWindow = null;

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('main-process-error', error.message);
  }
});
process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled rejection:', reason);
});

// Resolve native module path from app.asar.unpacked in packaged builds
function getUnpackedModulePath(moduleName) {
  return path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'node_modules', moduleName);
}

// Sync server state
let syncServer = null;
let syncPort = 0;
let syncToken = '';
let syncTokenCreatedAt = 0;
const SYNC_TOKEN_TTL = 10 * 60 * 1000; // 10 分钟过期
let serverRunning = false;

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

function startSyncServer() {
  return new Promise((resolve) => {
    if (syncServer) {
      resolve({ running: true, ip: getLanIp(), port: syncPort, token: syncToken, qrDataUrl: '' });
      return;
    }

    syncToken = randomUUID();
    syncTokenCreatedAt = Date.now();
    const ip = getLanIp();

    syncServer = http.createServer((req, res) => {
      // 安全修复：CORS 限制为局域网 IP
      const origin = req.headers.origin || '';
      const referer = req.headers.referer || '';
      const isLocalRequest = origin.includes('localhost') || origin.includes('127.0.0.1') ||
        origin.includes('192.168.') || origin.includes('10.') || origin.includes('172.') ||
        referer.includes('localhost') || referer.includes('127.0.0.1');
      if (isLocalRequest) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (!origin) {
        // 无 Origin 的请求（如 curl）只允许本地 IP
        const clientIp = req.socket.remoteAddress || '';
        const isLocalIp = clientIp === '127.0.0.1' || clientIp === '::1' ||
          clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp.startsWith('172.');
        if (isLocalIp) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && req.url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', app: 'FriendOS' }));
        return;
      }

      if (req.method === 'POST' && req.url === '/api/sync') {
        const MAX_BODY_SIZE = 1024 * 1024;
        let body = '';
        let bodyTooLarge = false;
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > MAX_BODY_SIZE) {
            bodyTooLarge = true;
            req.destroy();
          }
        });
        req.on('end', () => {
          if (bodyTooLarge) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request body too large' }));
            return;
          }
          try {
            const data = JSON.parse(body);
            // 安全修复：Token 过期检查
            if (!syncToken || Date.now() - syncTokenCreatedAt > SYNC_TOKEN_TTL) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Token expired，请重新获取同步码' }));
              return;
            }
            if (data.token !== syncToken) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid token' }));
              return;
            }
            if (!Array.isArray(data.items)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid items format' }));
              return;
            }
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('sync-receive', data.items);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: data.items.length }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    syncServer.listen(0, '0.0.0.0', () => {
      syncPort = syncServer.address().port;
      serverRunning = true;
      const status = { running: true, ip, port: syncPort, token: syncToken };
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sync-status-changed', status);
      }
      resolve(status);
    });

    syncServer.on('error', (err) => {
      syncServer = null;
      serverRunning = false;
      resolve({ error: err.message });
    });
  });
}

function stopSyncServer() {
  if (!syncServer) return;
  try { syncServer.close(); } catch (_) { /* ignore */ }
  syncServer = null;
  serverRunning = false;
  syncPort = 0;
  syncToken = '';
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync-status-changed', {
      running: false, ip: '', port: 0, token: '', qrDataUrl: '',
    });
  }
}

function createWindow() {
  // Set unique app ID for Windows taskbar
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.friendos.app');
  }

  // Load icon using nativeImage
  const { nativeImage } = require('electron');
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(path.dirname(app.getPath('exe')), 'resources', 'app.asar.unpacked', 'build', 'custom-icon.ico');
  } else {
    iconPath = path.join(__dirname, '..', 'build', 'custom-icon.ico');
  }

  let appIcon;
  try {
    appIcon = nativeImage.createFromPath(iconPath);
    if (appIcon.isEmpty()) {
      console.log('[FriendOS] Failed to load icon from:', iconPath);
      appIcon = undefined;
    }
  } catch (err) {
    console.log('[FriendOS] Error loading icon:', err);
    appIcon = undefined;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'FriendOS',
    icon: appIcon || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox: true 会导致 preload.cjs 中的 require() 失败（沙箱限制 Node.js API）
      // 本项目 preload 使用 CommonJS require 加载模块，需保持 false
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
    },
    show: false,
    backgroundColor: '#F8FAFC',
    autoHideMenuBar: true,
    frame: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // 从 exe 位置推导 resources/app.asar 路径
    const exeDir = path.dirname(app.getPath('exe'));
    const indexPath = path.join(exeDir, 'resources', 'app.asar', 'dist', 'index.html');
    console.log('[FriendOS] Loading index from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximize-change', false);
  });

  // 安全：阻止渲染进程导航到非预期 URL
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
    if (!url.startsWith(allowed)) {
      event.preventDefault();
      console.warn('[Security] Blocked navigation to:', url);
    }
  });

  // 安全：阻止渲染进程打开新窗口
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // 安全：限制权限请求
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

ipcMain.handle('open-data-folder', async () => {
  const userDataPath = app.getPath('userData');
  await shell.openPath(userDataPath);
});

// Sync server IPC handlers
ipcMain.handle('start-sync-server', async () => {
  return await startSyncServer();
});

ipcMain.handle('stop-sync-server', () => {
  stopSyncServer();
  return { success: true };
});

ipcMain.handle('get-sync-status', () => ({
  running: serverRunning,
  ip: getLanIp(),
  port: syncPort,
  token: syncToken,
}));

// Window control IPC handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isMaximized() : false;
});

// Open external applications（安全修复：URL 编码绕过防护 + UNC 路径检查 + 长度限制）
ipcMain.handle('open-external', async (_event, filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: '无效路径' };
    }

    const MAX_PATH_LENGTH = 1024;
    if (filePath.length > MAX_PATH_LENGTH) {
      return { success: false, error: '路径长度超出限制' };
    }

    // URL 解码后再校验，防止编码绕过
    let decoded;
    try {
      decoded = decodeURIComponent(filePath);
    } catch (_) {
      decoded = filePath;
    }
    decoded = decoded.toLowerCase().trim();

    // 协议黑名单
    const dangerousPatterns = ['javascript:', 'data:', 'shell:', 'vbscript:', 'ms-mshtml', 'ms-itss', 'wscript', '&#', '\\x', '\0'];
    if (dangerousPatterns.some(p => decoded.includes(p))) {
      return { success: false, error: '不允许的协议类型' };
    }

    // 阻止 UNC 路径
    if (decoded.startsWith('\\\\')) {
      return { success: false, error: '不允许访问 UNC 路径' };
    }

    // URL 使用 shell.openExternal（有协议校验）
    const allowedPrefixes = ['http://', 'https://'];
    const isAllowedProtocol = allowedPrefixes.some(p => decoded.startsWith(p));

    if (isAllowedProtocol) {
      const { shell: { openExternal } } = require('electron');
      await openExternal(filePath);
      return { success: true };
    }

    // 文件使用 shell.openPath（仅允许安全扩展名）
    const safeExtensions = ['.txt', '.md', '.jpg', '.jpeg', '.png', '.gif', '.mp3', '.mp4', '.wav'];
    const hasSafeExtension = safeExtensions.some(ext => decoded.endsWith(ext));

    if (!hasSafeExtension) {
      return { success: false, error: '不支持的文件类型' };
    }

    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..') || normalizedPath.includes('\0')) {
      return { success: false, error: '路径包含非法字符' };
    }

    await shell.openPath(normalizedPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Local model state (disabled - no local models)
let localModelContext = null;
let currentLocalModelPath = null;

// Local model state
// List available local models from registry
ipcMain.handle('local-model-list', async () => {
  try {
    const { listAvailableModels } = require('./services/ModelRegistry.cjs');
    const models = listAvailableModels();
    return models.map(m => ({
      id: m.id,
      name: m.name,
      size: m.size,
      path: m.available ? require('./services/ModelRegistry.cjs').getModelPath(m.id) : '',
      available: m.available,
      description: m.description,
    }));
  } catch (err) {
    console.error('[local-model-list] Error:', err);
    return [];
  }
});

// Initialize local model
ipcMain.handle('local-model-init', async (_event, modelPath) => {
  try {
    const { getModelPath } = require('./services/ModelRegistry.cjs');
    const FS = require('fs');

    // Always prefer the registry path over the frontend path
    const registryPath = getModelPath('qwen3.5:0.8b');

    if (registryPath && FS.existsSync(registryPath)) {
      console.log('[local-model-init] Using registry path:', registryPath);
      return { success: true };
    }

    // Fallback to the path from frontend
    if (modelPath && FS.existsSync(modelPath)) {
      console.log('[local-model-init] Using frontend path:', modelPath);
      return { success: true };
    }

    return { success: false, error: '模型文件不存在: ' + (registryPath || modelPath) };
  } catch (err) {
    console.error('[local-model-init] Error:', err);
    return { success: false, error: err.message };
  }
});

// Chat completion with local model
// prompt: 纯文本用户消息（不含 ChatML 标记）
// options: { temperature, maxTokens, systemPrompt }
ipcMain.handle('local-model-complete', async (_event, prompt, options = {}) => {
  try {
    const { complete } = require('./services/LocalModelService.cjs');
    const response = await complete(prompt, {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 256,
      topP: options.topP || 0.8,
      topK: options.topK || 20,
      systemPrompt: options.systemPrompt,
    });
    return { response };
  } catch (err) {
    console.error('[local-model-complete] Error:', err);
    return { error: err.message };
  }
});

// Streaming chat completion with local model (event-based)
// prompt: 纯文本用户消息（不含 ChatML 标记）
// options: { temperature, maxTokens, systemPrompt }
ipcMain.on('local-model-complete-stream', async (event, prompt, options = {}) => {
  // 防御：检查 sender 是否已销毁，避免向已关闭窗口发送消息
  const sender = event.sender;
  const isDestroyed = () => !sender || sender.isDestroyed();

  try {
    const { completeStream } = require('./services/LocalModelService.cjs');

    // 后端超时保护（120秒，比前端180秒短，让后端先超时发 error）
    const STREAM_TIMEOUT_MS = 120000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('模型推理超时（120秒），请检查模型状态或重新初始化')), STREAM_TIMEOUT_MS)
    );

    await Promise.race([
      completeStream(prompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2048,
        topP: options.topP || 0.8,
        topK: options.topK || 20,
        systemPrompt: options.systemPrompt,
      }, (token) => {
        if (!isDestroyed()) {
          sender.send('local-model-chunk', { token });
        }
      }),
      timeoutPromise,
    ]);

    if (!isDestroyed()) {
      sender.send('local-model-chunk', { done: true });
    }
  } catch (err) {
    console.error('[local-model-complete-stream] Error:', err);
    // Eval has failed / KV slot 错误：后台自动 dispose+重新加载模型，让前端下次调用可恢复
    const errMsg = (err && err.message) || '';
    if (errMsg.includes('Eval has failed') || errMsg.includes('KV slot') || errMsg.includes('could not find a KV slot') || errMsg.includes('模型推理失败')) {
      console.log('[local-model-complete-stream] Auto-disposing model for recovery after eval failure');
      try {
        const { dispose } = require('./services/LocalModelService.cjs');
        await dispose();
      } catch (disposeErr) {
        console.error('[local-model-complete-stream] Dispose during recovery failed:', disposeErr);
      }
    }
    if (!isDestroyed()) {
      sender.send('local-model-chunk', { error: errMsg || '模型推理失败', done: true });
    }
  }
});

// CUDA status handler
ipcMain.handle('get-cuda-status', async () => {
  try {
    let llamaPath;
    if (app.isPackaged) {
      // Must point to specific file, not directory (ESM requirement)
      const indexPath = path.join(getUnpackedModulePath('node-llama-cpp'), 'dist', 'index.js');
      llamaPath = require('url').pathToFileURL(indexPath).href;
    } else {
      llamaPath = 'node-llama-cpp';
    }
    const { getLlama } = await import(llamaPath);
    const llama = await getLlama();
    const gpuDevices = await llama.getGpuDeviceNames();
    return {
      available: gpuDevices.length > 0,
      gpuDevices,
      supportsGpuOffloading: llama.supportsGpuOffloading,
    };
  } catch (err) {
    return {
      available: false,
      gpuDevices: [],
      supportsGpuOffloading: false,
      error: err.message,
    };
  }
});

// Dispose local model
ipcMain.handle('local-model-dispose', async () => {
  try {
    const { dispose } = require('./services/LocalModelService.cjs');
    await dispose();
    localModelContext = null;
    currentLocalModelPath = null;
    return { success: true };
  } catch (err) {
    console.error('[local-model-dispose] Error:', err);
    return { success: false, error: err.message };
  }
});

// ── Sentiment Analysis IPC Handlers ──────────────────────────────

// Register Emotion Analysis Engine handlers
const { registerHandlers: registerEmotionHandlers } = require('./services/EmotionAnalysisEngine.cjs');
registerEmotionHandlers(ipcMain);

// Register Behavior Analyzer handlers
const { registerHandlers: registerBehaviorHandlers } = require('./services/BehaviorAnalyzer.cjs');
registerBehaviorHandlers(ipcMain);

// Register Notification Service handlers
const { registerHandlers: registerNotificationHandlers } = require('./services/NotificationService.cjs');
registerNotificationHandlers(ipcMain, () => mainWindow);

// 延迟加载 ONNX 模型：首次使用情感分析时才加载
const SentimentService = require('./services/SentimentService.cjs');
let onnxLoadPromise = null;
function ensureOnnxLoaded() {
  if (!onnxLoadPromise) {
    console.log('[FriendOS] Lazy-loading ONNX model on first use...');
    onnxLoadPromise = SentimentService.tryLoadOnnxModel().then(session => {
      if (session) {
        console.log('[FriendOS] ✅ ONNX sentiment model loaded successfully');
      } else {
        console.log('[FriendOS] ❌ ONNX model failed to load');
      }
      return session;
    }).catch(err => {
      console.error('[FriendOS] ❌ ONNX model load error:', err.message);
      return null;
    });
  }
  return onnxLoadPromise;
}

// 注入 Qwen3 模型调用函数到 SentimentService
// systemPrompt 和 userMessage 分离，由 LlamaChatSession 自动包装为 ChatML
SentimentService.setLocalModelComplete(async (prompt, options = {}) => {
  try {
    const { complete } = require('./services/LocalModelService.cjs');
    const response = await complete(prompt, {
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 256,
      systemPrompt: options.systemPrompt,
    });
    return { response };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('sentiment-analyze', async (_event, text) => {
  try {
    // 参数校验：限制文本长度，防止超长输入拖慢分析
    if (typeof text !== 'string' || text.length > 10000) {
      return { level: 'low', score: 0.5, positiveProb: 0.5, negativeProb: 0.5, keywords: [], needCloud: false, method: 'keyword', timestamp: Date.now(), error: '文本过长或格式无效' };
    }
    // 确保 ONNX 模型已加载（首次调用时延迟加载）
    await ensureOnnxLoaded();
    // Use enhanced analysis (combines ONNX + keyword)
    return await SentimentService.analyzeEnhanced(text);
  } catch (err) {
    console.error('[sentiment-analyze] Error:', err);
    // Fallback to keyword analysis
    try {
      return SentimentService.analyze(text);
    } catch (e) {
      return { level: 'low', score: 0.5, positiveProb: 0.5, negativeProb: 0.5, keywords: [], needCloud: false, method: 'keyword', timestamp: Date.now() };
    }
  }
});

ipcMain.handle('sentiment-cloud-analyze', async (_event, text, context) => {
  try {
    const { cloudAnalyze } = require('./services/SentimentService.cjs');
    return await cloudAnalyze(text, context);
  } catch (err) {
    console.error('[sentiment-cloud-analyze] Error:', err);
    return { crisisLevel: 'low', analysis: '', suggestions: [], error: err.message, timestamp: Date.now() };
  }
});

ipcMain.handle('sentiment-set-api-key', async (_event, key) => {
  try {
    const { setApiKey } = require('./services/SentimentService.cjs');
    return setApiKey(key);
  } catch (err) {
    console.error('[sentiment-set-api-key] Error:', err);
    return { success: false, error: err.message };
  }
});

// ── API Key 加密存储 IPC Handlers ─────────────────────────────
ipcMain.handle('api-key-exists', async (_event, name) => {
  try {
    const { getApiKey } = require('./services/ApiKeyStore.cjs');
    const key = getApiKey(name);
    return !!key;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('api-key-get', async (_event, name) => {
  try {
    const { getApiKey } = require('./services/ApiKeyStore.cjs');
    return getApiKey(name);
  } catch (err) {
    console.error('[api-key-get] Error:', err);
    return '';
  }
});

ipcMain.handle('api-key-set', async (_event, name, value) => {
  try {
    const { setApiKey } = require('./services/ApiKeyStore.cjs');
    setApiKey(name, value);
    return { success: true };
  } catch (err) {
    console.error('[api-key-set] Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sentiment-get-model-status', async () => {
  try {
    // 检查状态时触发模型加载（如果尚未加载）
    ensureOnnxLoaded();
    const { getModelStatus, tryLoadOnnxModel } = require('./services/SentimentService.cjs');
    return getModelStatus();
  } catch (err) {
    return { onnxLoaded: false, onnxAvailable: false, method: 'keyword', error: err.message };
  }
});

// 恢复初始化时重置 ONNX 状态
ipcMain.handle('sentiment-reset-onnx', async () => {
  try {
    onnxLoadPromise = null;
    const { resetOnnxState } = require('./services/SentimentService.cjs');
    resetOnnxState();
    console.log('[FriendOS] ONNX state reset for app reset');
    return { success: true };
  } catch (err) {
    console.error('[sentiment-reset-onnx] Error:', err);
    return { success: false, error: err.message };
  }
});

// ── 备份导入导出 IPC Handlers ─────────────────────────────────
ipcMain.handle('backup-export', async (_event, jsonData) => {
  try {
    // 参数校验：限制备份大小（10MB）
    if (typeof jsonData !== 'string' || jsonData.length > 10 * 1024 * 1024) {
      return { success: false, error: '备份数据过大或格式无效' };
    }
    const { dialog } = require('electron');
    const fs = require('fs');
    const today = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出数据备份',
      defaultPath: `lifeos-backup-${today}.json`,
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) {
      return { success: false, error: '用户取消了导出', canceled: true };
    }
    fs.writeFileSync(result.filePath, jsonData, 'utf-8');
    return { success: true, path: result.filePath };
  } catch (err) {
    console.error('[backup-export] Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('backup-import', async () => {
  try {
    const { dialog } = require('electron');
    const fs = require('fs');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入数据备份',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: '用户取消了导入', canceled: true };
    }
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;
    try {
      data = JSON.parse(content);
    } catch (parseErr) {
      return { success: false, error: '文件格式无效，无法解析 JSON' };
    }
    return { success: true, path: filePath, data };
  } catch (err) {
    console.error('[backup-import] Error:', err);
    return { success: false, error: err.message };
  }
});

// ── 综合风险评分 IPC Handlers ─────────────────────────────────
ipcMain.handle('risk:calculate', async (_event, data) => {
  try {
    const { calculateRiskScore } = require('./services/RiskScoringEngine.cjs');
    return calculateRiskScore(data);
  } catch (err) {
    console.error('[risk:calculate] Error:', err);
    return {
      totalScore: 0,
      riskLevel: 'low',
      riskLevelInfo: { min: 0, max: 25, label: '低', color: '#22C55E' },
      breakdown: {},
      factors: [],
      summary: '无法计算风险评分',
      timestamp: Date.now(),
      error: err.message,
    };
  }
});

ipcMain.handle('risk:getTrend', async (_event, dailyScores, days = 7) => {
  try {
    const { calculateRiskTrend } = require('./services/RiskScoringEngine.cjs');
    return calculateRiskTrend(dailyScores, days);
  } catch (err) {
    console.error('[risk:getTrend] Error:', err);
    return { trend: 'stable', change: 0, data: [], average: 0, error: err.message };
  }
});

// 安全：设置 Content Security Policy
app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? "default-src 'self' http://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:5173 ws://localhost:5173 https://api.deepseek.com https://api.openai.com https://api.anthropic.com;"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.deepseek.com https://api.openai.com https://api.anthropic.com;";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}).catch((err) => {
  console.error('[FriendOS] CSP setup failed:', err);
});

app.whenReady().then(createWindow).catch((err) => {
  console.error('[FriendOS] Failed to start:', err);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  stopSyncServer();

  try {
    const { stopReminderCheck } = require('./services/NotificationService.cjs');
    stopReminderCheck();
  } catch (_) { /* ignore */ }

  try {
    const { dispose } = require('./services/LocalModelService.cjs');
    await dispose();
  } catch (_) { /* ignore */ }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
