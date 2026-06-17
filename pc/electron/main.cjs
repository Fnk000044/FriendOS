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
    iconPath = path.join(path.dirname(app.getPath('exe')), 'resources', 'app.asar.unpacked', 'build', 'icon.png');
  } else {
    iconPath = path.join(__dirname, '..', 'build', 'icon.png');
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
      preload: path.join(path.dirname(app.getPath('exe')), 'resources', 'app.asar', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
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

// No local models - AI chat uses online API only
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
    const { dispose } = require('./services/LocalModelService.cjs');
    const { getModelPath } = require('./services/ModelRegistry.cjs');
    await dispose(); // Clear any cached model

    // Always prefer the registry path over the frontend path
    const registryPath = getModelPath('qwen3:0.6b');
    const FS = require('fs');

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
  try {
    const { completeStream } = require('./services/LocalModelService.cjs');

    await completeStream(prompt, {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 512,
      systemPrompt: options.systemPrompt,
    }, (token) => {
      event.sender.send('local-model-chunk', { token });
    });
    event.sender.send('local-model-chunk', { done: true });
  } catch (err) {
    console.error('[local-model-complete-stream] Error:', err);
    event.sender.send('local-model-chunk', { error: err.message, done: true });
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
    const { getModelStatus } = require('./services/SentimentService.cjs');
    return getModelStatus();
  } catch (err) {
    return { onnxLoaded: false, onnxAvailable: false, method: 'keyword', error: err.message };
  }
});

// 安全：设置 Content Security Policy（仅开发模式启用严格 CSP）
if (isDev) {
  app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const csp = "default-src 'self' http://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:5173 ws://localhost:5173 https://api.deepseek.com;";
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
}

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
