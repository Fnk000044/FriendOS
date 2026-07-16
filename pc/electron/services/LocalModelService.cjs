/**
 * Local Model Service using node-llama-cpp
 * Loads GGUF models for local inference in Electron
 *
 * 设计要点：
 * - model 和 context 是重量级对象，缓存复用
 * - LlamaChatSession 是轻量级对象，每次调用新建（因为内部维护对话历史，
 *   不同调用方如 SentimentService/AIService 不能共享同一个 session）
 * - systemPrompt 在创建 session 时注入，由 LlamaChatSession 自动包装为 ChatML
 */

const { getModelPath } = require('./ModelRegistry.cjs');
const { app } = require('electron');
const path = require('path');

let model = null;
let context = null;
let llamaModule = null;
let currentModelId = null;
let sequence = null;

/**
 * Dynamically import node-llama-cpp (ESM module)
 */
async function getLlamaModule() {
  if (!llamaModule) {
    if (app.isPackaged) {
      const indexPath = path.join(
        app.getAppPath(), '..', 'app.asar.unpacked',
        'node_modules', 'node-llama-cpp', 'dist', 'index.js'
      );
      const fileUrl = require('url').pathToFileURL(indexPath).href;
      console.log('[LocalModelService] Importing from:', fileUrl);
      llamaModule = await import(fileUrl);
    } else {
      llamaModule = await import('node-llama-cpp');
    }
  }
  return llamaModule;
}

/**
 * 确保模型和 context 已加载（缓存复用）
 */
async function ensureModel() {
  if (model && context) return;

  const modelPath = getModelPath('qwen3.5:0.8b');
  if (!modelPath) {
    throw new Error('No bundled model found. Please ensure the model file exists.');
  }

  if (model) await dispose();

  console.log('[LocalModelService] Loading model from:', modelPath);

  const { getLlama } = await getLlamaModule();
  const llama = await getLlama();

  model = await llama.loadModel({ modelPath });
  // contextSize 设为 2048（0.8B 模型足够），减少 KV cache 内存压力
  // flashAttention 显式 false（部分模型/硬件下 flash attention 不稳定可能触发 eval 失败）
  context = await model.createContext({ contextSize: 2048, flashAttention: false });
  sequence = context.getSequence();
  currentModelId = 'qwen3.5:0.8b';

  console.log('[LocalModelService] Model loaded successfully');
}

/**
 * 创建一个新的 chat session
 * 复用同一个 sequence，通过 contextShift 管理上下文窗口
 *
 * 关键修复：
 * - dispose 时使用 { disposeSequence: false }，仅销毁 session 不销毁共享 sequence
 *   （之前默认 dispose() 会调用 sequence.dispose()，导致第二次调用时 sequence 已销毁 → Eval has failed）
 * - 每次创建 session 前先 clearHistory 清空 KV cache，防止上下文残留导致 llama_decode 失败
 */
async function createSession(systemPrompt) {
  await ensureModel();

  const { LlamaChatSession } = await getLlamaModule();

  const sessionOpts = {
    contextSequence: sequence,
    // contextShift 保留系统提示词，仅擦除最早的对话回复
    contextShift: { size: 512, strategy: 'eraseFirstResponseAndKeepFirstSystem' },
  };
  if (systemPrompt) {
    sessionOpts.systemPrompt = systemPrompt;
  }

  const session = new LlamaChatSession(sessionOpts);
  // 复用 sequence 时先清空历史 KV cache，避免残留 token 导致 llama_decode 返回非 0
  try {
    await sequence.clearHistory();
  } catch (e) {
    console.warn('[LocalModelService] clearHistory on new session skipped:', e?.message);
  }
  return session;
}

/**
 * 剥离 Qwen3.5 thinking 模式的 <think>...</think> 区间
 * 模型可能把思考内容以文本形式输出（即使追加 /no_think），需要过滤掉
 * @param {string} text - 原始文本
 * @returns {string} 剥离 think 标签后的纯正文
 */
function stripThinking(text) {
  if (!text) return '';
  // 移除完整的 <think>...</think> 区间（非贪婪）
  let out = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  // 移除未闭合的残留 <think>... （流式末尾可能不完整）
  out = out.replace(/<think>[\s\S]*$/g, '');
  // 移除可能残留的 </think> 标签
  out = out.replace(/<\/think>/g, '');
  return out;
}

/**
 * 流式 think 标签状态机
 * 跨 chunk 处理 <think>...</think> 区间，确保不完整标签正确缓冲
 */
class ThinkFilter {
  constructor() {
    this.inThinking = false;
    this.buffer = '';
  }

  /**
   * 输入新 chunk，返回应输出给用户的纯正文部分
   * @param {string} chunk
   * @returns {string}
   */
  feed(chunk) {
    if (!chunk) return '';
    this.buffer += chunk;
    let output = '';

    while (this.buffer.length > 0) {
      if (this.inThinking) {
        // 在 thinking 区间内，寻找 </think> 结束标签
        const endIdx = this.buffer.indexOf('</think>');
        if (endIdx !== -1) {
          // 找到结束标签，跳过标签本身
          this.buffer = this.buffer.slice(endIdx + '</think>'.length);
          this.inThinking = false;
        } else {
          // 未找到结束标签，保留缓冲等待下一个 chunk
          // 但为防止无限缓冲，保留最后 8 字符（</think> 长度）即可
          if (this.buffer.length > 8) {
            this.buffer = this.buffer.slice(-8);
          }
          break;
        }
      } else {
        // 在正文区间，寻找 <think> 开始标签
        const startIdx = this.buffer.indexOf('<think>');
        if (startIdx !== -1) {
          // 输出标签前的正文
          output += this.buffer.slice(0, startIdx);
          this.buffer = this.buffer.slice(startIdx + '<think>'.length);
          this.inThinking = true;
        } else {
          // 未找到开始标签，输出大部分缓冲，保留最后 7 字符（<think> 长度）防止截断
          if (this.buffer.length > 7) {
            const keep = 7;
            output += this.buffer.slice(0, -keep);
            this.buffer = this.buffer.slice(-keep);
          }
          break;
        }
      }
    }

    return output;
  }

  /**
   * 流结束时，flush 缓冲中剩余的正文（无未闭合 think 标签时）
   * @returns {string}
   */
  flush() {
    if (this.inThinking) {
      // 流结束时仍在 thinking 区间，丢弃所有思考内容
      this.buffer = '';
      this.inThinking = false;
      return '';
    }
    const out = this.buffer;
    this.buffer = '';
    return out;
  }
}

/**
 * Non-streaming chat completion
 * Qwen3.5-0.8B optimal settings (non-thinking mode):
 * - 通用对话: temp=0.7, top_p=0.8, top_k=20
 * - 危机检测: temp=0.3 (由 SentimentService 传入)
 *
 * 注意：Qwen3.5 是思考模型，LlamaChatSession.systemPrompt 中的 /no_think
 * 不会被识别为 special token。需要在用户 prompt 末尾追加 /no_think。
 * @param {string} prompt - User message
 * @param {object} options - { temperature, maxTokens, topP, topK, systemPrompt }
 */
async function complete(prompt, options = {}) {
  console.log('[LocalModelService] Complete called');

  // Qwen3.5 thinking-mode 禁用：在 prompt 末尾追加 /no_think
  const safePrompt = (prompt || '').trimEnd() + '\n/no_think';
  const session = await createSession(options.systemPrompt);

  try {
    const response = await session.prompt(safePrompt, {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 512,
      topP: options.topP ?? 0.8,
      topK: options.topK ?? 20,
    });

    // 空响应检测：如果模型返回空字符串，抛出明确错误而非返回空
    if (!response || response.trim().length === 0) {
      console.warn('[LocalModelService] Complete produced empty response');
      throw new Error('模型返回空响应，可能需要重新初始化');
    }

    // 剥离 thinking 模式的  IMD...`... 区间
    const cleaned = stripThinking(response);
    if (cleaned.trim().length === 0) {
      console.warn('[LocalModelService] Complete response was pure thinking content');
      throw new Error('模型仅输出思考内容，请重新初始化');
    }

    console.log('[LocalModelService] Response length:', cleaned.length);
    return cleaned.trim();
  } catch (err) {
    console.error('[LocalModelService] Complete error:', err);
    // 友好化 "Eval has failed" / KV slot 错误
    const errMsg = (err && err.message) || '';
    if (errMsg.includes('Eval has failed') || errMsg.includes('KV slot') || errMsg.includes('could not find a KV slot')) {
      throw new Error('模型推理失败，正在重新初始化，请重试');
    }
    throw err;
  } finally {
    // disposeSequence=false：session 销毁但不销毁共享 sequence（由 ensureModel 统一管理）
    session.dispose({ disposeSequence: false });
  }
}

/**
 * Streaming chat completion
 *
 * 注意：Qwen3.5 思考模式禁用 —— prompt 末尾追加 /no_think，
 * 同时 systemPrompt 末尾也追加作为双保险。
 *
 * @param {string} prompt - User message (plain text, NOT ChatML-formatted)
 * @param {object} options - { temperature, maxTokens, systemPrompt }
 * @param {function} onChunk - Callback for each text chunk
 */
async function completeStream(prompt, options = {}, onChunk) {
  const { temperature = 0.7, systemPrompt, maxTokens = 2048, topP = 0.8, topK = 20 } = options;

  console.log('[LocalModelService] CompleteStream called');
  console.log('[LocalModelService] System prompt length:', systemPrompt?.length || 0);
  console.log('[LocalModelService] Prompt length:', prompt?.length || 0);

  // 双保险：systemPrompt 末尾 + user prompt 末尾都加 /no_think
  const safeSystemPrompt = systemPrompt
    ? (systemPrompt.endsWith('/no_think') ? systemPrompt : systemPrompt + ' /no_think')
    : systemPrompt;
  const safePrompt = (prompt || '').trimEnd() + '\n/no_think';

  const session = await createSession(safeSystemPrompt);

  try {
    let contentStarted = false;
    let pendingWhitespace = '';
    let totalContent = ''; // 追踪所有实际内容，用于空响应检测
    const thinkFilter = new ThinkFilter(); // think 标签状态机，跨 chunk 剥离思考内容

    await session.promptWithMeta(safePrompt, {
      temperature,
      maxTokens,
      topP,
      topK,
      onTextChunk: (text) => {
        // 先用 ThinkFilter 剥离  IMD...`... 区间
        const filtered = thinkFilter.feed(text);
        if (filtered.length === 0) return; // 全是 thinking 内容，丢弃

        if (!contentStarted) {
          const combined = pendingWhitespace + filtered;
          const trimmed = combined.replace(/^[\s]+/, '');
          if (trimmed.length > 0) {
            contentStarted = true;
            totalContent += trimmed;
            onChunk(trimmed);
          } else {
            pendingWhitespace = combined;
          }
        } else {
          totalContent += filtered;
          onChunk(filtered);
        }
      },
    });

    // flush ThinkFilter 缓冲中剩余的正文
    const remaining = thinkFilter.flush();
    if (remaining.length > 0) {
      if (!contentStarted) {
        const combined = pendingWhitespace + remaining;
        const trimmed = combined.replace(/^[\s]+/, '');
        if (trimmed.length > 0) {
          contentStarted = true;
          totalContent += trimmed;
          onChunk(trimmed);
        }
      } else {
        totalContent += remaining;
        onChunk(remaining);
      }
    }

    // 兜底1：如果流式输出结束但仍无内容，发出缓冲的空白（避免空响应误判）
    if (!contentStarted && pendingWhitespace.trim().length > 0) {
      onChunk(pendingWhitespace.trim());
    }

    console.log('[LocalModelService] Stream completed, contentStarted:', contentStarted, 'totalLength:', totalContent.length);

    // 兜底2：如果整个流式过程没有产生任何有效内容，用非流式 complete 重试一次
    if (totalContent.trim().length === 0) {
      console.warn('[LocalModelService] Stream produced empty response, retrying with complete()');
      // 注意：complete 会创建自己的 session，但 complete 的 finally 已正确 dispose
      // 此处先 dispose 当前 session（保留 sequence），再调用 complete
      session.dispose({ disposeSequence: false });
      const retryResponse = await complete(prompt, options);
      if (retryResponse && retryResponse.trim().length > 0) {
        onChunk(retryResponse);
        return;
      }
      // 重试也失败：抛出明确错误，让上层处理（前端会显示错误而非"未能生成回复"）
      throw new Error('模型未生成任何内容，请重新初始化模型');
    }
  } catch (err) {
    console.error('[LocalModelService] CompleteStream error:', err);
    // 友好化 "Eval has failed" / KV slot 错误（llama_decode 失败时的原生错误）
    const errMsg = (err && err.message) || '';
    if (errMsg.includes('Eval has failed') || errMsg.includes('KV slot') || errMsg.includes('could not find a KV slot')) {
      throw new Error('模型推理失败，正在重新初始化，请重试');
    }
    throw err;
  } finally {
    // disposeSequence=false：session 销毁但不销毁共享 sequence（由 ensureModel 统一管理）
    session.dispose({ disposeSequence: false });
  }
}

/**
 * Dispose model and free memory
 */
async function dispose() {
  sequence = null;
  if (context) {
    await context.dispose();
    context = null;
  }
  if (model) {
    await model.dispose();
    model = null;
  }
  currentModelId = null;
  console.log('[LocalModelService] Disposed');
}

module.exports = {
  complete,
  completeStream,
  dispose,
};
