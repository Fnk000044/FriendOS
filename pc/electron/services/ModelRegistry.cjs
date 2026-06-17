/**
 * Model Registry - Local GGUF model management
 * Registers bundled models and resolves their paths for dev/packaged modes
 */

const PATH = require('path');
const FS = require('fs');
const { app } = require('electron');

// Model registry - maps model IDs to their file paths relative to models dir
const MODEL_REGISTRY = {
  'qwen3:0.6b': {
    name: 'Qwen3 0.6B',
    file: 'Qwen3-0.6B-Q4_K_M.gguf',
    description: '通义千问3 0.6B - 轻量级中文对话模型',
    size: '379 MB',
    quantization: 'Q4_K_M',
  },
};

/**
 * Get the absolute path to a model file
 * Handles both dev mode (relative to project root) and packaged mode (asar.unpacked)
 */
function getModelPath(modelId) {
  const entry = MODEL_REGISTRY[modelId];
  if (!entry) return null;

  // In packaged mode, models are in app.asar.unpacked/models/
  // In dev mode, models are in the project root's models/ directory
  const modelsDir = app.isPackaged
    ? PATH.join(app.getAppPath(), '..', 'app.asar.unpacked', 'models')
    : PATH.join(__dirname, '..', '..', '..', 'models');

  const modelPath = PATH.join(modelsDir, entry.file);

  if (FS.existsSync(modelPath)) {
    return modelPath;
  }

  console.warn(`[ModelRegistry] Model file not found: ${modelPath}`);
  return null;
}

/**
 * List all registered models with their availability status
 */
function listAvailableModels() {
  return Object.entries(MODEL_REGISTRY).map(([id, info]) => ({
    id,
    ...info,
    available: getModelPath(id) !== null,
  }));
}

module.exports = {
  MODEL_REGISTRY,
  getModelPath,
  listAvailableModels,
};
