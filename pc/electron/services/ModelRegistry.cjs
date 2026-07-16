/**
 * Model Registry - Local GGUF model management
 * Registers bundled models and resolves their paths for dev/packaged modes
 *
 * Paths:
 * - Dev: looks in pc/models/ first (for models bundled with source),
 *   then FriendOS/models/ (for large GGUF files kept outside the electron project)
 * - Packaged: extraResources copies ../models → resources/models/
 *   asarUnpack copies pc/models/** → resources/app.asar.unpacked/models/
 */

const PATH = require('path');
const FS = require('fs');
const { app } = require('electron');

// Model registry - maps model IDs to their file paths relative to models dir
const MODEL_REGISTRY = {
  'qwen3.5:0.8b': {
    name: 'Qwen3.5 0.8B',
    file: 'Qwen3.5-0.8B-IQ4_NL.gguf',
    description: '通义千问3.5 0.8B - 中文对话模型',
    size: '507 MB',
    quantization: 'IQ4_NL',
  },
};

/**
 * Get the absolute path to a model file
 * Tries multiple locations in priority order
 */
function getModelPath(modelId) {
  const entry = MODEL_REGISTRY[modelId];
  if (!entry) return null;

  let candidateDirs = [];

  if (app.isPackaged) {
    // extraResources copies ../models → resources/models/
    candidateDirs.push(PATH.join(process.resourcesPath, 'models'));
    // asarUnpack copies pc/models/** → resources/app.asar.unpacked/models/
    candidateDirs.push(PATH.join(process.resourcesPath, 'app.asar.unpacked', 'models'));
  } else {
    // Dev: pc/models/ (bundled with source, e.g. sentiment.onnx sister)
    candidateDirs.push(PATH.join(__dirname, '..', '..', 'models'));
    // Dev: FriendOS/models/ (large GGUF files kept outside electron project)
    // __dirname = pc/electron/services → ../../ = pc/electron → ../../.. = pc → ../../../.. = FriendOS
    candidateDirs.push(PATH.join(__dirname, '..', '..', '..', '..', 'models'));
  }

  for (const dir of candidateDirs) {
    const candidate = PATH.join(dir, entry.file);
    if (FS.existsSync(candidate)) {
      return candidate;
    }
  }

  console.warn(`[ModelRegistry] Model file not found in: ${candidateDirs.map(d => PATH.join(d, entry.file)).join(', ')}`);
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
