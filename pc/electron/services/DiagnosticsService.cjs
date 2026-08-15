/**
 * Diagnostics Service — 启动自检（P0-2）
 *
 * 聚合主进程侧事实，供渲染层 DiagnosticsPanel 展示：
 * - network: require('electron').net.isOnline()
 * - model: SentimentService.getModelStatus()（触发 ensureOnnxLoaded）
 * - apiKey: ChatLLMService.hasUsableKey() 存在性 + provider（不泄露 key 本体）
 * - degradationPath: apiKey.hasKey && network.online ? 'cloud' : 'template'
 * - demoMode: 渲染层传入（localStorage 演示标记）
 * - appVersion: app.getVersion()
 *
 * 不落敏感信息：不返回 API Key 本体、不落日记原文。
 */

const { app, net } = require('electron');

/**
 * @param {object} extra
 * @param {boolean} [extra.demoMode]
 * @returns {Promise<object>} DiagnosticsResult
 */
async function check(extra) {
  const demoMode = Boolean(extra && extra.demoMode);
  const timestamp = Date.now();

  // 网络：Electron net.isOnline()（考虑渲染层 CSP 与代理，主进程判断）
  let online = false;
  try {
    online = net.isOnline();
  } catch (_) {
    online = false;
  }

  // 模型：触发 ONNX 加载（懒加载）后取状态
  let model = { onnxLoaded: false, onnxAvailable: false, method: 'keyword' };
  try {
    const SentimentService = require('./SentimentService.cjs');
    if (typeof SentimentService.tryLoadOnnxModel === 'function') {
      await SentimentService.tryLoadOnnxModel();
    }
    model = SentimentService.getModelStatus();
  } catch (err) {
    model = { onnxLoaded: false, onnxAvailable: false, method: 'keyword', error: err && err.message };
  }

  // API Key：只判断存在性与 provider，不泄露 key 本体
  let apiKey = { hasKey: false };
  try {
    const ChatLLMService = require('./ChatLLMService.cjs');
    apiKey = {
      hasKey: ChatLLMService.hasUsableKey(),
      provider: ChatLLMService.getProviderConfig().provider,
    };
  } catch (err) {
    apiKey = { hasKey: false, error: err && err.message };
  }

  // 降级路径：有 Key 且在线 → cloud；否则 → template（离线模板对话已就绪）
  const degradationPath = apiKey.hasKey && online ? 'cloud' : 'template';

  let appVersion = '';
  try {
    appVersion = app.getVersion();
  } catch (_) {
    appVersion = '';
  }

  return {
    appVersion,
    network: { online },
    model,
    apiKey,
    degradationPath,
    demoMode,
    timestamp,
  };
}

module.exports = { check };
