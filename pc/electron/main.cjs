const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const http = require('http');
const { randomUUID } = require('crypto');
const os = require('os');

const isDev = !app.isPackaged;
let mainWindow = null;

// ── 结构化日志工具 ────────────────────────────────────────────
// 主进程错误处理路径统一调用 logError(operation, err, extra?)
// 输出含 operation / errorType / message 的单行 JSON，便于后续接日志聚合
// 不引入外部依赖；与现有 console.error 语义兼容（仍写 stderr）
function logError(operation, err, extra) {
  const record = {
    level: 'error',
    operation,
    errorType: err && err.name ? err.name : (err && err.constructor ? err.constructor.name : 'Error'),
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  };
  if (extra && typeof extra === 'object') {
    Object.assign(record, extra);
  }
  // 单行 JSON，避免换行破坏日志聚合解析
  try {
    console.error(JSON.stringify(record));
  } catch (_) {
    // 兜底：循环引用或异常时降级为字符串
    console.error(`[logError:${operation}]`, err);
  }
}

// 与 logError 同风格的单行结构化信息日志（level: info，写 stdout）
// 仅用于记录非敏感的诊断元数据，禁止写入日记原文 / API Key 等敏感内容
function logInfo(operation, extra) {
  const record = {
    level: 'info',
    operation,
    timestamp: new Date().toISOString(),
  };
  if (extra && typeof extra === 'object') {
    Object.assign(record, extra);
  }
  try {
    console.log(JSON.stringify(record));
  } catch (_) {
    console.log(`[logInfo:${operation}]`);
  }
}

process.on('uncaughtException', (error) => {
  logError('uncaughtException', error);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('main-process-error', error.message);
  }
});
process.on('unhandledRejection', (reason) => {
  logError('unhandledRejection', reason instanceof Error ? reason : new Error(String(reason)));
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
            logError('http:sync-body-parse', err, { url: req.url, method: req.method });
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
      logError('syncServer.listen', err);
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
      // sandbox: true —— preload.cjs 已改写为仅使用 contextBridge + ipcRenderer
      // （这两个 API 在沙箱模式下可用），不再 require 任何 Node 内置模块，
      // 因此可以安全开启沙箱，让渲染进程/preload 都运行在受限环境中。
      sandbox: true,
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

// 平台标识：沙箱模式下 preload 不能读 process.platform，由主进程提供
ipcMain.handle('get-platform', () => process.platform);

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

// 本地大模型（Qwen3）已移除：对话/报告 AI 流式/危机语义判定均不再依赖。
// 情感分析仍由 ONNX + 关键词两层独立工作，不受影响。

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
      logError('ensureOnnxLoaded', err);
      return null;
    });
  }
  return onnxLoadPromise;
}

// 本地大模型（Qwen3）已移除：SentimentService 第 3 层语义判定不再注入 localModelComplete，
// qwenAnalyze 将返回 null，analyzeEnhanced 自动降级为 L1 关键词 + L2 ONNX 两层判定。

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
    logError('ipc:sentiment-analyze', err);
    // Fallback to keyword analysis
    try {
      return SentimentService.analyze(text);
    } catch (e) {
      logError('ipc:sentiment-analyze.fallback', e);
      return { level: 'low', score: 0.5, positiveProb: 0.5, negativeProb: 0.5, keywords: [], needCloud: false, method: 'keyword', timestamp: Date.now() };
    }
  }
});

ipcMain.handle('sentiment-cloud-analyze', async (_event, text, context) => {
  try {
    const { cloudAnalyze } = require('./services/SentimentService.cjs');
    return await cloudAnalyze(text, context);
  } catch (err) {
    logError('ipc:sentiment-cloud-analyze', err);
    return { crisisLevel: 'low', analysis: '', suggestions: [], error: err.message, timestamp: Date.now() };
  }
});

ipcMain.handle('sentiment-set-api-key', async (_event, key) => {
  try {
    const { setApiKey } = require('./services/SentimentService.cjs');
    return setApiKey(key);
  } catch (err) {
    logError('ipc:sentiment-set-api-key', err);
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
    logError('ipc:api-key-get', err, { keyName: name });
    return '';
  }
});

ipcMain.handle('api-key-set', async (_event, name, value) => {
  try {
    const { setApiKey } = require('./services/ApiKeyStore.cjs');
    setApiKey(name, value);
    return { success: true };
  } catch (err) {
    logError('ipc:api-key-set', err, { keyName: name });
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
    logError('ipc:sentiment-reset-onnx', err);
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
    await fs.promises.writeFile(result.filePath, jsonData, 'utf-8');
    return { success: true, path: result.filePath };
  } catch (err) {
    logError('ipc:backup-export', err);
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
    const content = await fs.promises.readFile(filePath, 'utf-8');
    let data;
    try {
      data = JSON.parse(content);
    } catch (parseErr) {
      logError('ipc:backup-import.parse', parseErr, { filePath });
      return { success: false, error: '文件格式无效，无法解析 JSON' };
    }
    return { success: true, path: filePath, data };
  } catch (err) {
    logError('ipc:backup-import', err);
    return { success: false, error: err.message };
  }
});

// ── 综合风险评分 IPC Handlers ─────────────────────────────────
// 储存信息：返回 userData 目录各子目录大小（应用数据/缓存/日志）
// 异步递归遍历，避免在用户数据目录较大时阻塞主进程事件循环
ipcMain.handle('get-storage-size', async () => {
  try {
    const fs = require('fs');
    const fsp = fs.promises;
    const path = require('path');
    const userDataPath = app.getPath('userData');

    const dirSize = async (dir) => {
      let total = 0;
      let entries;
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch { return 0; } // 目录不存在或无权限
      await Promise.all(entries.map(async (entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          total += await dirSize(full);
        } else {
          try { total += (await fsp.stat(full)).size; } catch {}
        }
      }));
      return total;
    };

    const cacheDirs = ['Cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache', 'Network'];
    const appDataDirs = ['IndexedDB', 'Local Storage', 'Preferences', 'Session Storage', 'WebStorage', 'Shared Dictionary'];
    let cache = 0, appData = 0, logs = 0;

    const [cacheTotal, appDataTotal] = await Promise.all([
      Promise.all(cacheDirs.map((d) => dirSize(path.join(userDataPath, d)))),
      Promise.all(appDataDirs.map((d) => dirSize(path.join(userDataPath, d)))),
    ]);
    cache = cacheTotal.reduce((a, b) => a + b, 0);
    appData = appDataTotal.reduce((a, b) => a + b, 0);

    // 日志文件（sentiment.log 等）
    try {
      const logFile = path.join(userDataPath, 'sentiment.log');
      const stat = await fsp.stat(logFile);
      logs += stat.size;
    } catch {}

    return { total: cache + appData + logs, cache, appData, logs };
  } catch (err) {
    logError('ipc:get-storage-size', err);
    return { total: 0, cache: 0, appData: 0, logs: 0 };
  }
});

// 清理 Chromium 缓存（不影响应用数据）
ipcMain.handle('clear-cache', async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const userDataPath = app.getPath('userData');
    const cacheDirs = ['Cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache'];

    // 先通过 session API 清理，再删除残留目录
    try {
      await session.defaultSession.clearCache();
      await session.defaultSession.clearCodeCache({});
    } catch {}

    for (const d of cacheDirs) {
      const dir = path.join(userDataPath, d);
      if (fs.existsSync(dir)) {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    }
    return { success: true };
  } catch (err) {
    logError('ipc:clear-cache', err);
    return { success: false, error: err.message };
  }
});

// Windows Hello 生物识别可用性检查（结果缓存，避免每次都 spawn PowerShell 阻塞主进程）
let windowsHelloAvailableCache = null; // null = 未探测, { value, ts } = 已探测
const WINDOWS_HELLO_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

ipcMain.handle('windows-hello-available', async () => {
  if (process.platform !== 'win32') return { available: false, reason: '仅支持 Windows' };
  // 缓存命中直接返回
  if (windowsHelloAvailableCache && Date.now() - windowsHelloAvailableCache.ts < WINDOWS_HELLO_CACHE_TTL) {
    return windowsHelloAvailableCache.value;
  }
  try {
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileAsync = promisify(execFile);
    // 检查 WinRT UserConsentVerifier 是否可用（即系统是否配置了 Windows Hello）
    const psScript = `
$assemblies = @('System.Runtime','System.Runtime.InteropServices','Windows.Foundation','Windows.Security.Credentials.UI');
try {
  [Windows.Security.Credentials.UI.UserConsentVerifier,Windows.Security.Credentials.UI,ContentType=WindowsRuntime] | Out-Null
  $verifier = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync('')
  Write-Output 'AVAILABLE'
} catch {
  Write-Output 'NOT_AVAILABLE'
}
`;
    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', psScript], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    const value = { available: stdout.includes('AVAILABLE') };
    windowsHelloAvailableCache = { value, ts: Date.now() };
    return value;
  } catch {
    const value = { available: false, reason: 'Windows Hello 未配置或不可用' };
    windowsHelloAvailableCache = { value, ts: Date.now() };
    return value;
  }
});

// Windows Hello 验证（人脸/PIN）
ipcMain.handle('windows-hello-verify', async () => {
  if (process.platform !== 'win32') return { success: false, error: '仅支持 Windows' };
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // 调用 WinRT UserConsentVerifier.RequestVerificationAsync
    // 返回值 0=Verified, 1=DeviceNotPresent, 2=NotConfiguredForUser, 3=DisabledByPolicy, 4=UserCanceled
    const psScript = `
[Windows.Security.Credentials.UI.UserConsentVerifier,Windows.Security.Credentials.UI,ContentType=WindowsRuntime] | Out-Null
[Windows.Foundation.IAsyncOperation[Windows.Security.Credentials.UI.UserConsentVerificationResult],Windows.Foundation,ContentType=WindowsRuntime] | Out-Null
$op = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync('使用 Windows Hello 解锁 FriendOS')
$res = ($op.AsTask()).Result
Write-Output $res.Value__
`;
    const { stdout } = await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, { encoding: 'utf8', timeout: 60000 });
    const code = parseInt(stdout.trim(), 10);
    // 0 = Verified
    if (code === 0) return { success: true };
    const errors = { 1: '未检测到生物识别设备', 2: 'Windows Hello 未配置', 3: '被组策略禁用', 4: '用户取消' };
    return { success: false, error: errors[code] || '验证失败' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('risk:calculate', async (_event, data) => {
  try {
    const { calculateRiskScore } = require('./services/RiskScoringEngine.cjs');
    const result = calculateRiskScore(data);
    // 诊断归因记录：仅在触发临床升级或排除规则命中时输出单行结构化日志。
    // 只落等级/分数/触发原因/排除规则来源计数等元数据，不落日记原文与命中词条
    const diag = result.diagnostics;
    if (diag && (diag.escalation.escalated || diag.exclusionsHit.length > 0)) {
      logInfo('ipc:risk:calculate', {
        totalScore: result.totalScore,
        riskLevel: result.riskLevel,
        escalated: diag.escalation.escalated,
        escalationReasons: diag.escalation.reasons,
        crisisFactorCount: diag.escalation.crisisFactorCount,
        exclusionSources: diag.exclusionsHit.map(e => e.source),
      });
    }
    return result;
  } catch (err) {
    logError('ipc:risk:calculate', err);
    return {
      totalScore: 0,
      riskLevel: 'low',
      riskLevelInfo: { min: 0, max: 25, label: '低', color: '#22C55E' },
      breakdown: {},
      factors: [],
      diagnostics: { exclusionsHit: [], escalation: { escalated: false, reasons: [], crisisFactorCount: 0 } },
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
    logError('ipc:risk:getTrend', err);
    return { trend: 'stable', change: 0, data: [], average: 0, error: err.message };
  }
});

// ── AI 对话陪伴 IPC（云 LLM 走主进程代理，渲染层不持有 key）────────
// 设计：渲染层调 chat:send，主进程用 Node fetch 调云 LLM，流式 chunk 经
// webContents.send('chat:chunk', {requestId, delta}) 推回渲染层。
// 渲染层 CSP connect-src 仍为 'self'，主进程 Node fetch 不受 CSP 约束。
// 失败/无 key/超时 → 返回错误码，渲染层自动切 ChatFallbackEngine 降级。
ipcMain.handle('chat:send', async (event, { requestId, messages, context, systemPrompt, providerOverride }) => {
  if (!requestId || typeof requestId !== 'string') {
    return { error: 'invalid requestId', code: 'LLM_BAD_REQUEST' };
  }
  try {
    const { chat } = require('./services/ChatLLMService.cjs');
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await chat(win, { messages, context, systemPrompt, providerOverride }, requestId);
    return { ok: true, fullText: result.fullText, provider: result.provider, model: result.model };
  } catch (err) {
    logError('ipc:chat:send', err, { requestId });
    return { ok: false, error: err.message, code: err.code || 'LLM_UNKNOWN' };
  }
});

ipcMain.handle('chat:testConnection', async (_event, providerOverride) => {
  try {
    const { testConnection } = require('./services/ChatLLMService.cjs');
    return await testConnection(providerOverride);
  } catch (err) {
    logError('ipc:chat:testConnection', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('chat:getProviderConfig', async () => {
  try {
    const { getProviderConfig } = require('./services/ChatLLMService.cjs');
    return getProviderConfig();
  } catch (err) {
    logError('ipc:chat:getProviderConfig', err);
    return { provider: 'qwen', hasKey: false, availableProviders: [] };
  }
});

ipcMain.handle('chat:fallback', async (_event, { text, emotionLabel }) => {
  // 渲染层主动请求降级回复（无 key / 超时后用）
  try {
    const { respond } = require('./services/ChatFallbackEngine.cjs');
    return respond(text, emotionLabel);
  } catch (err) {
    logError('ipc:chat:fallback', err);
    return { text: '我在听，能再说清楚一点吗？', branch: 'neutral', isCrisis: false };
  }
});

ipcMain.handle('chat:greeting', async (_event, { silentDays, riskRising }) => {
  try {
    const { greeting } = require('./services/ChatFallbackEngine.cjs');
    return greeting({ silentDays, riskRising });
  } catch (err) {
    logError('ipc:chat:greeting', err);
    return { text: '我在呢，想聊聊吗？', branch: 'greeting' };
  }
});

// ── 风险预警通知 IPC（0.0.6 主动预警）──────────────────────────
// 渲染层 DailyCheckScheduler 决策后调此 IPC，由主进程发系统通知 + 推回渲染层。
ipcMain.handle('risk:notify', async (event, { level, title, body, action }) => {
  try {
    const { sendRiskNotification } = require('./services/NotificationService.cjs');
    const win = BrowserWindow.fromWebContents(event.sender);
    sendRiskNotification({ level, title, body, action }, win);
    return { success: true };
  } catch (err) {
    logError('ipc:risk:notify', err);
    return { success: false, error: err.message };
  }
});

// 安全：设置 Content Security Policy
// 注意：历史上 connect-src 白名单了 deepseek/openai/anthropic 三个云 API，
// 但代码中 SentimentService.cloudAnalyze 已是空实现、ReportAIService 只走规则引擎，
// 从未真正发起对外 HTTPS 请求。保留死域名会扩大攻击面（恶意脚本可借此外联），
// 现已清理。如未来重新接入云 LLM，再按需补回。
app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? "default-src 'self' http://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:5173 ws://localhost:5173;"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self';";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}).catch((err) => {
  logError('app:csp-setup', err);
});

app.whenReady().then(createWindow).catch((err) => {
  logError('app:createWindow', err);
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
});

// 重启应用：渲染进程恢复初始化后调用，主进程退出并重新拉起
ipcMain.handle('app-relaunch', () => {
  app.relaunch();
  app.exit(0);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
