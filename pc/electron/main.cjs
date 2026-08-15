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

// ── 主进程致命错误处理（P2-12 加固）───────────────────────────
// 原则：uncaughtException 之后主进程处于未定义状态，不应无限"带病运行"。
// - 首次异常：记录 + 标记降级状态 + 通知渲染层（用户可感知）
// - 60 秒窗口内连续 ≥3 次：视为带病运行，优雅退出（app.quit），5 秒未退出则强制兜底
// - unhandledRejection 多为可恢复的异步失败：仅记录 + 标记降级，不退出
const fatalState = {
  degraded: false,
  lastError: '',
  crashCount: 0,
  firstCrashAt: 0,
};
const CRASH_WINDOW_MS = 60 * 1000;
const CRASH_LIMIT = 3;

function markDegraded(error) {
  const message = error && error.message ? error.message : String(error);
  const firstTime = !fatalState.degraded;
  fatalState.degraded = true;
  fatalState.lastError = message;
  // 仅在状态跃迁时通知一次，避免连续错误轰炸渲染层
  if (firstTime && mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('main:degraded', { message });
    } catch { /* ignore */ }
  }
}

function gracefulExit(code, reason) {
  try {
    logInfo('graceful-exit', { reason, code });
    if (mainWindow && !mainWindow.isDestroyed()) {
      try { mainWindow.webContents.send('main-process-error', reason); } catch { /* ignore */ }
    }
    // app.quit() 走 before-quit/will-quit 优雅路径；若被阻止，5 秒后强制退出兜底
    const forceTimer = setTimeout(() => {
      try { app.exit(code); } catch { /* ignore */ }
    }, 5000);
    if (typeof forceTimer.unref === 'function') forceTimer.unref();
    app.quit();
  } catch {
    try { app.exit(code); } catch { /* ignore */ }
  }
}

process.on('uncaughtException', (error) => {
  logError('uncaughtException', error);
  markDegraded(error);

  const now = Date.now();
  if (now - fatalState.firstCrashAt > CRASH_WINDOW_MS) {
    fatalState.firstCrashAt = now;
    fatalState.crashCount = 0;
  }
  fatalState.crashCount += 1;
  if (fatalState.crashCount >= CRASH_LIMIT) {
    logError('uncaughtException.fatal', new Error(
      `连续 ${fatalState.crashCount} 次未捕获异常（${CRASH_WINDOW_MS / 1000}s 窗口），主进程带病运行，优雅退出`
    ));
    gracefulExit(1, `连续 ${fatalState.crashCount} 次未捕获异常，应用即将退出`);
  }
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logError('unhandledRejection', error);
  markDegraded(error);
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

// ── 自定义存储位置（PRD v3 P1-16） ───────────────────────────
// 配置文件存放在"默认 userData"下（应用首次启动时的位置），
// 启动早期 applyCustomStorageLocation() 读取并重定向 userData。
const STORAGE_LOCATION_FILE = 'friendos-storage-location.json';

function defaultUserDataPath() {
  // 若已重定向，配置文件仍在原始默认位置：app.getPath('appData') + 应用名
  // Electron 默认 userData = appData/FriendOS
  return path.join(app.getPath('appData'), 'FriendOS');
}

// 是否存在数据目录（与 storage:migrate 的 CANDIDATES 保持一致）
function hasDataDirs(dir) {
  try {
    const fs = require('fs');
    return ['FriendOS.leveldb', 'Local Storage', 'IndexedDB'].some((n) => fs.existsSync(path.join(dir, n)));
  } catch { return false; }
}

function applyCustomStorageLocation() {
  try {
    const locFile = path.join(defaultUserDataPath(), STORAGE_LOCATION_FILE);
    const fs = require('fs');
    if (fs.existsSync(locFile)) {
      const cfg = JSON.parse(fs.readFileSync(locFile, 'utf8'));
      if (cfg.path && fs.existsSync(cfg.path)) {
        // P2-7 加固：目标位置没有任何数据目录、而默认位置有数据时，
        // 说明上次迁移并未真正搬走数据——保持默认位置并告警，
        // 避免用户"数据看似消失"。
        const defaultDir = defaultUserDataPath();
        if (!hasDataDirs(cfg.path) && hasDataDirs(defaultDir)) {
          console.warn('[FriendOS] 自定义存储位置不含数据目录，回退默认位置（上次迁移可能未完成）');
        } else {
          app.setPath('userData', cfg.path);
        }
      }
    }
  } catch (err) {
    console.warn('[FriendOS] applyCustomStorageLocation error:', err.message);
  }
}

ipcMain.handle('storage:getLocation', () => {
  try {
    const locFile = path.join(defaultUserDataPath(), STORAGE_LOCATION_FILE);
    const fs = require('fs');
    if (fs.existsSync(locFile)) {
      const cfg = JSON.parse(fs.readFileSync(locFile, 'utf8'));
      return { current: cfg.path || app.getPath('userData'), custom: true };
    }
  } catch (err) { /* ignore */ }
  return { current: app.getPath('userData'), custom: false };
});

ipcMain.handle('storage:selectLocation', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: '选择数据存储位置',
    });
    if (result.canceled || result.filePaths.length === 0) return { canceled: true };
    return { canceled: false, path: result.filePaths[0] };
  } catch (err) {
    logError('ipc:storage:selectLocation', err);
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('storage:migrate', async (_event, targetDir) => {
  const fs = require('fs');
  const fsp = require('fs/promises');
  try {
    if (!targetDir || typeof targetDir !== 'string') return { success: false, error: '目标路径无效' };
    const src = app.getPath('userData');
    const target = targetDir;
    if (!fs.existsSync(target)) await fsp.mkdir(target, { recursive: true });

    // 复制数据目录：兼容新旧两种 Electron 布局（修复审计 P2-7）
    // - FriendOS.leveldb + Local Storage：旧版/自建布局
    // - IndexedDB：现代 Chromium 布局（Dexie 数据的实际落盘处）
    // 只复制实际存在的目录，并在复制后统计校验，向调用方如实报告迁移内容。
    const CANDIDATES = ['FriendOS.leveldb', 'Local Storage', 'IndexedDB'];

    const dirStat = async (dir, depth = 0) => {
      if (depth > 5) return { files: 0, bytes: 0 };
      let files = 0;
      let bytes = 0;
      let entries;
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch { return { files: 0, bytes: 0 }; }
      for (const entry of entries.slice(0, 5000)) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const sub = await dirStat(full, depth + 1);
          files += sub.files;
          bytes += sub.bytes;
        } else {
          try {
            const st = await fsp.stat(full);
            files += 1;
            bytes += st.size;
          } catch { /* ignore */ }
        }
      }
      return { files, bytes };
    };

    const migrated = [];
    for (const name of CANDIDATES) {
      const s = path.join(src, name);
      if (!fs.existsSync(s)) continue;
      const d = path.join(target, name);
      await fsp.cp(s, d, { recursive: true, force: true });
      const stat = await dirStat(d);
      migrated.push({ name, copied: true, files: stat.files, bytes: stat.bytes });
    }

    if (migrated.length === 0) {
      return { success: false, error: '未找到可迁移的本地数据（可能尚无数据，或存储布局未知）' };
    }

    // 写配置文件（默认位置一份 + 新位置一份，双保险）
    const cfg = { path: target, migratedAt: new Date().toISOString() };
    const cfgStr = JSON.stringify(cfg, null, 2);
    await fsp.mkdir(defaultUserDataPath(), { recursive: true });
    await fsp.writeFile(path.join(defaultUserDataPath(), STORAGE_LOCATION_FILE), cfgStr, 'utf8');
    try {
      await fsp.writeFile(path.join(target, STORAGE_LOCATION_FILE), cfgStr, 'utf8');
    } catch (err) { /* 新位置不可写不影响主配置 */ }

    return { success: true, restartRequired: true, migrated };
  } catch (err) {
    logError('ipc:storage:migrate', err);
    return { success: false, error: err.message };
  }
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

ipcMain.handle('sentiment-analyze', async (_event, text, calibration) => {
  try {
    // 参数校验：限制文本长度，防止超长输入拖慢分析
    if (typeof text !== 'string' || text.length > 10000) {
      return { level: 'low', score: 0.5, positiveProb: 0.5, negativeProb: 0.5, keywords: [], needCloud: false, method: 'keyword', timestamp: Date.now(), error: '文本过长或格式无效' };
    }
    // 确保 ONNX 模型已加载（首次调用时延迟加载）
    await ensureOnnxLoaded();
    // Use enhanced analysis (combines ONNX + keyword)，透传用户情感先验校准（危机通道冻结）
    return await SentimentService.analyzeEnhanced(text, calibration);
  } catch (err) {
    logError('ipc:sentiment-analyze', err);
    // Fallback to keyword analysis
    try {
      return SentimentService.analyze(text, calibration);
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

// 恢复初始化时重置 ONNX 状态（异步：等待 in-flight 加载并释放原生 session）
ipcMain.handle('sentiment-reset-onnx', async () => {
  try {
    onnxLoadPromise = null;
    const { resetOnnxState } = require('./services/SentimentService.cjs');
    await resetOnnxState();
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

// ── 心理报告导出 PDF ─────────────────────────────────
// 渲染层构建完整报告 HTML（用户内容已转义），主进程用隐藏窗口渲染为 A4 PDF。
ipcMain.handle('report-export-pdf', async (_event, payload) => {
  let printWin = null;
  try {
    if (!payload || typeof payload.html !== 'string' || payload.html.length === 0 || payload.html.length > 4 * 1024 * 1024) {
      return { success: false, error: '报告内容无效或过大' };
    }
    const { dialog, BrowserWindow } = require('electron');

    // 文件名清洗：替换非法字符，限制长度，保证 .pdf 后缀
    const base = (typeof payload.defaultName === 'string' && payload.defaultName.trim())
      ? payload.defaultName.trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 80)
      : `friendos-report-${new Date().toISOString().slice(0, 10)}`;
    const defaultName = base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出心理报告 (PDF)',
      defaultPath: defaultName,
      filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
    });
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    printWin = new BrowserWindow({
      show: false,
      width: 794,      // A4 @96dpi 宽度
      height: 1123,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
    });
    await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(payload.html));
    // 等待字体与布局稳定后再打印，避免字体未加载导致的空白页
    await new Promise((resolve) => setTimeout(resolve, 300));
    const pdf = await printWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'printableArea' },
    });
    await require('fs').promises.writeFile(result.filePath, pdf);
    return { success: true, path: result.filePath };
  } catch (err) {
    logError('ipc:report-export-pdf', err);
    return { success: false, error: err.message };
  } finally {
    if (printWin && !printWin.isDestroyed()) {
      printWin.destroy();
    }
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

    // 递归深度与单层条目上限（修复审计 P2-2：原实现无界递归，目录异常大时耗时失控）
    const MAX_DEPTH = 4;
    const MAX_ENTRIES_PER_DIR = 5000;

    const dirSize = async (dir, depth = 0) => {
      if (depth > MAX_DEPTH) return 0;
      let total = 0;
      let entries;
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch { return 0; } // 目录不存在或无权限
      const limited = entries.slice(0, MAX_ENTRIES_PER_DIR);
      await Promise.all(limited.map(async (entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          total += await dirSize(full, depth + 1);
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

// Windows Hello 可用性检查已随 windows-hello-verify 一并移除（PRD v3 P0-9）
ipcMain.handle('risk:calculate', async (_event, data) => {
  try {
    const { calculateRiskScore } = require('./services/RiskScoringEngine.cjs');
    // personalization 由渲染层按需附带（已解密纯数值校准层），透传给引擎
    const result = calculateRiskScore(data, data && data.personalization);
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
  // 入口校验（修复审计 P1-5）：限制 messages 形状与总文本量，防止超长内容打爆云请求
  try {
    if (!Array.isArray(messages) || messages.length > 40) {
      return { ok: false, error: 'messages 无效或过多', code: 'LLM_BAD_REQUEST' };
    }
    let totalChars = 0;
    for (const m of messages) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
        return { ok: false, error: 'messages 格式无效', code: 'LLM_BAD_REQUEST' };
      }
      totalChars += m.content.length;
    }
    if (totalChars > 100000) {
      return { ok: false, error: 'messages 总长度超限', code: 'LLM_BAD_REQUEST' };
    }
    if (systemPrompt != null && (typeof systemPrompt !== 'string' || systemPrompt.length > 20000)) {
      return { ok: false, error: 'systemPrompt 无效或过长', code: 'LLM_BAD_REQUEST' };
    }
  } catch (err) {
    logError('ipc:chat:send.validate', err, { requestId });
    return { ok: false, error: '请求校验失败', code: 'LLM_BAD_REQUEST' };
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

ipcMain.handle('chat:fallback', async (_event, params) => {
  // 渲染层主动请求降级回复（无 key / 超时后用）
  // params: { text, emotionLabel?, negativeProb?, positiveProb?, crisisProb?, session?, now? }
  try {
    const { respond } = require('./services/ChatFallbackEngine.cjs');
    if (params && typeof params === 'object' && !Array.isArray(params) && 'text' in params) {
      return respond(params.text, params);
    }
    // 兼容旧调用方：chatFallback({ text, emotionLabel })
    const { text, emotionLabel } = params || {};
    return respond(text, emotionLabel);
  } catch (err) {
    logError('ipc:chat:fallback', err);
    return { text: '我在听，能再说清楚一点吗？', branch: 'neutral', isCrisis: false, sessionDelta: undefined };
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

// ── 启动自检 IPC（P0-2）──────────────────────────────────────
// 渲染层 DiagnosticsPanel 挂载时调用；不泄露 API Key 本体。
ipcMain.handle('diagnostics:check', async (_event, params) => {
  const mainProcessInfo = {
    degraded: fatalState.degraded,
    lastError: fatalState.lastError,
  };
  try {
    const { check } = require('./services/DiagnosticsService.cjs');
    const result = await check(params || {});
    return { ...result, mainProcess: mainProcessInfo };
  } catch (err) {
    logError('ipc:diagnostics:check', err);
    return {
      appVersion: '',
      network: { online: false },
      model: { onnxLoaded: false, onnxAvailable: false, method: 'keyword' },
      apiKey: { hasKey: false },
      degradationPath: 'template',
      demoMode: Boolean(params && params.demoMode),
      timestamp: Date.now(),
      mainProcess: mainProcessInfo,
      error: err.message,
    };
  }
});

// ── 风险趋势预测 IPC（P2-2）──────────────────────────────────
// 输入 { dailySeries, personalBaseline } → RiskPredictionResult（method/note 如实返回）
ipcMain.handle('prediction:getTrend', async (_event, input) => {
  try {
    const { predict } = require('./services/RiskTrendPredictor.cjs');
    return predict(input || {});
  } catch (err) {
    logError('ipc:prediction:getTrend', err);
    return {
      riskUpgradeProb: 0.5,
      moodForecast7d: [],
      riskTrend: 'stable',
      confidence: 0,
      method: 'heuristic-fallback',
      note: '预测服务暂不可用：' + (err && err.message ? err.message : String(err)),
    };
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
  // 应用自定义存储位置（必须在 createWindow 之前，IndexedDB 初始化依赖 userData）
  applyCustomStorageLocation();
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
