/**
 * API Key Configuration Store
 * Stores API keys encrypted using Electron's safeStorage
 *
 * 参考：Electron safeStorage API
 * safeStorage使用操作系统的密钥链（macOS Keychain、Windows DPAPI、Linux libsecret）
 * 加密存储敏感数据
 */

const FS = require('fs');
const PATH = require('path');
const { app, safeStorage } = require('electron');

const CONFIG_DIR = PATH.join(app.getPath('userData'), 'config');
const API_KEYS_FILE = PATH.join(CONFIG_DIR, 'api_keys.enc');
const API_KEYS_FILE_PLAIN = PATH.join(CONFIG_DIR, 'api_keys.json'); // 旧格式

function ensureConfigDir() {
  if (!FS.existsSync(CONFIG_DIR)) {
    FS.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * 读取加密的API密钥
 * 如果存在旧格式文件，自动迁移
 */
function readApiKeys() {
  try {
    // 尝试读取加密文件
    if (FS.existsSync(API_KEYS_FILE)) {
      const encrypted = FS.readFileSync(API_KEYS_FILE);
      if (safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(encrypted);
        return JSON.parse(decrypted);
      }
      // 如果加密不可用，尝试作为明文读取（向后兼容）
      return JSON.parse(encrypted.toString('utf-8'));
    }

    // 迁移旧格式
    if (FS.existsSync(API_KEYS_FILE_PLAIN)) {
      console.log('[ApiKeyStore] Migrating plaintext API keys to encrypted storage');
      const content = FS.readFileSync(API_KEYS_FILE_PLAIN, 'utf-8');
      const keys = JSON.parse(content);

      // 保存为加密格式
      writeApiKeys(keys);

      // 删除旧文件
      try {
        FS.unlinkSync(API_KEYS_FILE_PLAIN);
        console.log('[ApiKeyStore] Removed old plaintext file');
      } catch (e) {
        // 忽略删除错误
      }

      return keys;
    }
  } catch (err) {
    console.error('[ApiKeyStore] Read error:', err);
  }
  return {};
}

/**
 * 写入加密的API密钥
 */
function writeApiKeys(keys) {
  try {
    ensureConfigDir();

    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(JSON.stringify(keys));
      FS.writeFileSync(API_KEYS_FILE, encrypted);
    } else {
      // 如果加密不可用，回退到明文存储
      console.warn('[ApiKeyStore] Encryption not available, falling back to plaintext');
      FS.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[ApiKeyStore] Write error:', err);
  }
}

function getApiKey(name) {
  const keys = readApiKeys();
  return keys[name] || '';
}

function setApiKey(name, value) {
  const keys = readApiKeys();
  keys[name] = value;
  writeApiKeys(keys);
}

/**
 * 检查加密是否可用
 */
function isEncryptionAvailable() {
  return safeStorage.isEncryptionAvailable();
}

module.exports = {
  getApiKey,
  setApiKey,
  isEncryptionAvailable,
};