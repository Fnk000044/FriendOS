/**
 * Chat LLM Service — 对话式 AI 陪伴的 LLM 调用编排
 *
 * 设计要点（参见 docs/比赛增强计划 第一阶段）：
 * - 云 API 通过主进程代理：渲染层绝不持有/直接发 API Key，所有外联请求由 main.cjs 用 Node fetch 发起。
 *   渲染层 CSP connect-src 仍为 'self'，主进程 Node fetch 不受 CSP 约束，安全卖点不破。
 * - Provider 抽象为接口，默认通义千问，可切 DeepSeek，答辩说"可一键切换"。
 * - 降级链：云可用 → 云；不可用/无 key → 由调用方切 ChatFallbackEngine。本服务只负责云调用。
 * - 失败/无 key → 抛 { code: 'LLM_UNAVAILABLE' }；30 秒无 chunk → abort → 抛 { code: 'LLM_TIMEOUT' }。
 * - Token 预算：system ≤ 500；历史最近 10 轮原文，更早用 summary；总 ≤ 4096。
 *
 * Key 从 ApiKeyStore.getApiKey('chat_llm') 读，不进渲染层、不进日志。
 */

// 延迟 require：ApiKeyStore 依赖 electron app，仅在主进程运行时可用
function getApiKeyStore() {
  return require('./ApiKeyStore.cjs');
}

// ── Provider 抽象 ───────────────────────────────────────────

/**
 * @typedef {Object} ChatMessage
 * @property {'system'|'user'|'assistant'} role
 * @property {string} content
 * @property {number} [timestamp]
 */

/**
 * @typedef {Object} ChatContext
 * @property {number} [avgMood7d]        近 7 天平均心情 1-5
 * @property {string} [moodTrend]        improving/stable/declining
 * @property {number} [riskScore]        当前风险分 0-100
 * @property {string} [riskLevel]        low/medium_low/medium/high/critical
 * @property {string} [lastAssessment]   最近量表结果描述
 * @property {string} [termPhase]        学期阶段
 * @property {number} [stressLevel]     应激水平 0-100
 * @property {string} [lateNightHint]   深夜活跃提示
 * @property {string} [lastSummary]     最近一次对话摘要（跨会话记忆）
 * @property {string} [bestIntervention] 个人最有效干预
 */

/**
 * @typedef {Object} ChatRequest
 * @property {ChatMessage[]} messages   历史消息（已截断到最近 10 轮）
 * @property {ChatContext} [context]     注入上下文
 * @property {string} [systemPrompt]    system prompt（已含人设）
 * @property {string} [providerOverride] 临时覆盖 provider
 */

const STREAM_TIMEOUT_MS = 30_000; // 30 秒无 chunk → abort
const MAX_HISTORY_ROUNDS = 10;    // 最近 10 轮原文

// Provider 配置表（OpenAI 兼容 /v1/chat/completions）
const PROVIDERS = {
  qwen: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-plus',
    authHeader: (key) => `Bearer ${key}`,
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    authHeader: (key) => `Bearer ${key}`,
  },
};

/**
 * 选择 provider：优先用 override，否则用已配置的默认 provider（存 ApiKeyStore 'chat_llm_provider'）
 */
function resolveProvider(override) {
  const providerKey = override || getApiKeyStore().getApiKey('chat_llm_provider') || 'qwen';
  return PROVIDERS[providerKey] ? { key: providerKey, ...PROVIDERS[providerKey] } : null;
}

/**
 * 把上下文对象拼成自然语言段落，注入 system prompt 尾部
 */
function buildContextBlock(context) {
  if (!context) return '';
  const lines = [];
  if (typeof context.avgMood7d === 'number') {
    lines.push(`- 近 7 天平均心情：${context.avgMood7d.toFixed(1)}/5`);
  }
  if (context.moodTrend) lines.push(`- 情绪趋势：${context.moodTrend}`);
  if (typeof context.riskScore === 'number' && context.riskLevel) {
    lines.push(`- 当前风险等级：${context.riskLevel}（${context.riskScore}/100）`);
  }
  if (context.lastAssessment) lines.push(`- 最近一次量表：${context.lastAssessment}`);
  if (context.termPhase) lines.push(`- 学期阶段：${context.termPhase}`);
  if (typeof context.stressLevel === 'number') lines.push(`- 应激水平：${context.stressLevel}/100`);
  if (context.lateNightHint) lines.push(`- ${context.lateNightHint}`);
  if (context.lastSummary) lines.push(`- 上次对话要点：${context.lastSummary}`);
  if (context.bestIntervention) lines.push(`- 个人最有效干预：${context.bestIntervention}`);
  return lines.length > 0 ? `\n\n[用户近况]\n${lines.join('\n')}` : '';
}

/**
 * 拼最终 messages 数组：system（含上下文） + 历史（截断）+ 最新 user
 */
function composeMessages({ systemPrompt, messages, context }) {
  const sys = (systemPrompt || '') + buildContextBlock(context);
  const result = [];
  if (sys) result.push({ role: 'system', content: sys });
  // 截断历史：保留最近 MAX_HISTORY_ROUNDS*2 条（user+assistant 成对）
  const trimmed = messages.slice(-MAX_HISTORY_ROUNDS * 2);
  for (const m of trimmed) {
    result.push({ role: m.role, content: m.content });
  }
  return result;
}

/**
 * 调 LLM，流式推送 chunk。
 * @param {object} win  BrowserWindow 实例，用于 webContents.send 推流
 * @param {ChatRequest} req
 * @param {string} requestId 渲染层生成，用于区分多次并发请求
 * @returns {Promise<{fullText: string, provider: string, model: string}>}
 */
async function chat(win, req, requestId) {
  const provider = resolveProvider(req.providerOverride);
  if (!provider) {
    const err = new Error('No chat LLM provider configured');
    err.code = 'LLM_UNAVAILABLE';
    throw err;
  }

  const apiKey = getApiKeyStore().getApiKey('chat_llm');
  if (!apiKey) {
    const err = new Error('Chat LLM API key not set');
    err.code = 'LLM_UNAVAILABLE';
    throw err;
  }

  const messages = composeMessages(req);
  const body = JSON.stringify({
    model: provider.model,
    messages,
    stream: true,
    max_tokens: 600, // 3-5 句约 200-400 token，留余量
    temperature: 0.8,
  });

  const controller = new AbortController();
  let lastChunkAt = Date.now();
  let timeoutTimer = null;
  let fullText = '';

  // 超时保护：30 秒无 chunk → abort
  const armTimeout = () => {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(() => {
      controller.abort();
    }, STREAM_TIMEOUT_MS);
  };
  armTimeout();

  try {
    const res = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': provider.authHeader(apiKey),
      },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const err = new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 200)}`);
      err.code = res.status === 401 || res.status === 403 ? 'LLM_UNAUTHORIZED' : 'LLM_HTTP_ERROR';
      throw err;
    }
    if (!res.body) {
      const err = new Error('LLM response has no body');
      err.code = 'LLM_HTTP_ERROR';
      throw err;
    }

    // 解析 SSE：data: {...}\n\n，末尾 data: [DONE]
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      lastChunkAt = Date.now();
      armTimeout();

      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const rawEvent = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of rawEvent.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content
              ?? json.choices?.[0]?.message?.content
              ?? '';
            if (delta) {
              fullText += delta;
              if (win && !win.isDestroyed()) {
                win.webContents.send('chat:chunk', { requestId, delta });
              }
            }
          } catch (_) {
            // 单条 JSON 解析失败不中断流
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error(`LLM stream timeout (no chunk for ${STREAM_TIMEOUT_MS}ms)`);
      e.code = 'LLM_TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }

  return { fullText, provider: provider.key, model: provider.model };
}

/**
 * 测试连通性（设置页用）：发一个 ping 请求，返回延迟和模型名
 */
async function testConnection(providerOverride) {
  const provider = resolveProvider(providerOverride);
  if (!provider) return { success: false, error: 'No provider configured' };
  const apiKey = getApiKeyStore().getApiKey('chat_llm');
  if (!apiKey) return { success: false, error: 'API key not set' };

  const t0 = Date.now();
  try {
    const res = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': provider.authHeader(apiKey),
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
        max_tokens: 1,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { success: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
    }
    return { success: true, latency: Date.now() - t0, model: provider.model, provider: provider.key };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 获取当前 provider 配置（不泄露 key）
 */
function getProviderConfig() {
  const providerKey = getApiKeyStore().getApiKey('chat_llm_provider') || 'qwen';
  const hasKey = !!getApiKeyStore().getApiKey('chat_llm');
  const p = PROVIDERS[providerKey] || PROVIDERS.qwen;
  return {
    provider: providerKey,
    providerName: p.name,
    model: p.model,
    hasKey,
    availableProviders: Object.keys(PROVIDERS).map(k => ({ key: k, name: PROVIDERS[k].name })),
  };
}

module.exports = {
  chat,
  testConnection,
  getProviderConfig,
  PROVIDERS,
};
