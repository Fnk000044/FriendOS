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
  context = await model.createContext({ contextSize: 4096 });
  sequence = context.getSequence();
  currentModelId = 'qwen3.5:0.8b';

  console.log('[LocalModelService] Model loaded successfully');
}

/**
 * 创建一个新的 chat session
 * 复用同一个 sequence，通过 contextShift 管理上下文窗口
 */
async function createSession(systemPrompt) {
  await ensureModel();

  const { LlamaChatSession } = await getLlamaModule();

  const sessionOpts = {
    contextSequence: sequence,
    contextShift: { size: 512, strategy: 'eraseBeginning' },
  };
  if (systemPrompt) {
    sessionOpts.systemPrompt = systemPrompt;
  }

  return new LlamaChatSession(sessionOpts);
}

/**
 * Non-streaming chat completion
 * Qwen3.5-0.8B optimal settings (non-thinking mode):
 * - 通用对话: temp=0.7, top_p=0.8, top_k=20
 * - 危机检测: temp=0.3 (由 SentimentService 传入)
 * @param {string} prompt - User message
 * @param {object} options - { temperature, maxTokens, topP, topK, systemPrompt }
 */
async function complete(prompt, options = {}) {
  console.log('[LocalModelService] Complete called');

  const session = await createSession(options.systemPrompt);

  try {
    const response = await session.prompt(prompt, {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 512,
      topP: options.topP ?? 0.8,
      topK: options.topK ?? 20,
    });
    console.log('[LocalModelService] Response length:', response.length);
    return response.trim();
  } catch (err) {
    console.error('[LocalModelService] Complete error:', err);
    throw err;
  } finally {
    session.dispose();
  }
}

/**
 * Streaming chat completion
 * @param {string} prompt - User message (plain text, NOT ChatML-formatted)
 * @param {object} options - { temperature, maxTokens, systemPrompt }
 * @param {function} onChunk - Callback for each text chunk
 */
async function completeStream(prompt, options = {}, onChunk) {
  const { temperature = 0.7, systemPrompt, maxTokens = 2048, topP = 0.8, topK = 20 } = options;

  console.log('[LocalModelService] CompleteStream called');
  console.log('[LocalModelService] System prompt length:', systemPrompt?.length || 0);
  console.log('[LocalModelService] Prompt length:', prompt?.length || 0);

  const session = await createSession(systemPrompt);

  try {
    let contentStarted = false;
    let pendingWhitespace = '';
    await session.promptWithMeta(prompt, {
      temperature,
      maxTokens,
      topP,
      topK,
      onTextChunk: (text) => {
        console.log('[LocalModelService] onTextChunk:', JSON.stringify(text));
        if (!contentStarted) {
          const combined = pendingWhitespace + text;
          const trimmed = combined.replace(/^[\s]+/, '');
          if (trimmed.length > 0) {
            contentStarted = true;
            onChunk(trimmed);
          } else {
            pendingWhitespace = combined;
          }
        } else {
          onChunk(text);
        }
      },
    });
    // 如果流式输出结束但仍无内容，发出缓冲的空白（避免空响应误判）
    if (!contentStarted && pendingWhitespace.trim().length > 0) {
      onChunk(pendingWhitespace.trim());
    }
    console.log('[LocalModelService] Stream completed, contentStarted:', contentStarted);
  } catch (err) {
    console.error('[LocalModelService] CompleteStream error:', err);
    throw err;
  } finally {
    session.dispose();
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
