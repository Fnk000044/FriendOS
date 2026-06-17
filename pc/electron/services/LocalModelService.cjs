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

  const modelPath = getModelPath('qwen3:0.6b');
  if (!modelPath) {
    throw new Error('No bundled model found. Please ensure the model file exists.');
  }

  // 如果有旧模型，先释放
  if (model) await dispose();

  console.log('[LocalModelService] Loading model from:', modelPath);

  const { getLlama } = await getLlamaModule();
  const llama = await getLlama();

  model = await llama.loadModel({ modelPath });
  context = await model.createContext({ contextSize: 4096 });
  currentModelId = 'qwen3:0.6b';

  console.log('[LocalModelService] Model loaded successfully');
}

/**
 * 创建一个新的 chat session
 * 每次调用都新建，避免不同调用方的对话历史互相污染
 * @param {string} [systemPrompt] - System prompt，由 LlamaChatSession 自动包装为 ChatML
 */
async function createSession(systemPrompt) {
  await ensureModel();

  const { LlamaChatSession } = await getLlamaModule();

  const sessionOpts = {
    contextSequence: context.getSequence(),
    contextShift: { size: 200, strategy: 'eraseBeginning' },
  };
  if (systemPrompt) {
    sessionOpts.systemPrompt = systemPrompt;
  }

  return new LlamaChatSession(sessionOpts);
}

/**
 * Non-streaming chat completion
 * @param {string} prompt - User message (plain text, NOT ChatML-formatted)
 * @param {object} options - { temperature, maxTokens, systemPrompt }
 */
async function complete(prompt, options = {}) {
  console.log('[LocalModelService] Complete called');

  const session = await createSession(options.systemPrompt);

  try {
    const response = await session.prompt(prompt);
    return response.trim();
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
  const { temperature = 0.7, systemPrompt, maxTokens = 512 } = options;

  console.log('[LocalModelService] CompleteStream called');

  const session = await createSession(systemPrompt);

  try {
    let contentStarted = false;
    let pendingWhitespace = '';
    await session.promptWithMeta(prompt, {
      temperature,
      maxTokens,
      onTextChunk: (text) => {
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
  } finally {
    session.dispose();
  }
}

/**
 * Dispose model and free memory
 */
async function dispose() {
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
