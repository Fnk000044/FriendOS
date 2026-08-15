/**
 * IndexedDB 字段级 AES-GCM 加密层
 *
 * 设计：
 * - 主密钥由 app lock 密码 + 固定 salt 通过 PBKDF2 派生（256-bit）
 * - 未设密码时使用固定占位密钥（防止随意读取，不防定向攻击）
 * - 密文以 `enc::` 前缀 + base64(iv + ciphertext) 形式存储
 * - 读取时检测前缀：有则解密，无则按明文返回（兼容迁移期旧数据，写回时自动加密）
 *
 * 安全说明：
 * - 此层保护"静态数据"，防止 IndexedDB 文件被直接拷贝后离线阅读
 * - 密钥保存在内存中，应用运行期间可用；退出后密钥不持久化
 * - 真正的强保护需要操作系统级磁盘加密配合
 */

const ENCRYPTION_PREFIX = 'enc::';
const KEY_DERIVATION_SALT = 'friendos-db-field-key-v1';
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

let cachedKey: CryptoKey | null = null;
let cachedPasswordHash: string | null = null;

/**
 * 从密码派生 AES-GCM 密钥
 */
async function deriveKeyFromPassword(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(KEY_DERIVATION_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 占位密钥（用户未设 app lock 密码时使用）
 * 使用固定字符串派生，避免无密码时数据完全明文
 */
async function getPlaceholderKey(): Promise<CryptoKey> {
  return deriveKeyFromPassword('friendos-default-no-password-set');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 设置加密密钥（在 app lock 解锁后调用）
 * @param password 用户密码（明文，仅在内存中短暂存在）
 */
export async function setEncryptionKey(password: string | null): Promise<void> {
  if (!password) {
    cachedKey = await getPlaceholderKey();
    cachedPasswordHash = null;
    return;
  }
  cachedKey = await deriveKeyFromPassword(password);
  // 记录密码 hash 仅用于检测密钥是否变化，不存储密码本身
  const encoder = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  cachedPasswordHash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 获取当前密钥（懒加载占位密钥）
 */
async function getKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = await getPlaceholderKey();
  }
  return cachedKey;
}

/**
 * 加密单个字符串字段
 * @returns 形如 `enc::<base64>` 的密文，或输入原值（如已是密文/空值）
 */
export async function encryptField(plain: string | undefined | null): Promise<string | undefined | null> {
  if (plain == null || plain === '') return plain ?? undefined;
  if (typeof plain !== 'string') return plain;
  if (plain.startsWith(ENCRYPTION_PREFIX)) return plain; // 已加密，不重复处理

  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plain)
    );
    // 拼接 iv + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return ENCRYPTION_PREFIX + bufferToBase64(combined.buffer);
  } catch (err) {
    console.error('[crypto] encryptField failed, returning plain:', err);
    return plain;
  }
}

/**
 * 解密单个字符串字段
 * @returns 明文；若不是密文格式则原样返回（兼容旧明文数据）
 */
export async function decryptField(cipher: string | undefined | null): Promise<string | undefined | null> {
  if (cipher == null || cipher === '') return cipher ?? undefined;
  if (typeof cipher !== 'string') return cipher;
  if (!cipher.startsWith(ENCRYPTION_PREFIX)) return cipher; // 旧明文数据，原样返回

  try {
    const key = await getKey();
    const b64 = cipher.slice(ENCRYPTION_PREFIX.length);
    const combined = new Uint8Array(base64ToBuffer(b64));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    const decoder = new TextDecoder();
    return decoder.decode(plainBuffer);
  } catch (err) {
    // 解密失败（密钥不匹配或数据损坏）：返回空串避免崩溃，调用方应处理
    console.error('[crypto] decryptField failed:', err);
    return '';
  }
}

/**
 * 是否已启用真实密钥（用户设了密码）
 */
export function hasRealEncryptionKey(): boolean {
  return cachedPasswordHash !== null;
}

export const ENCRYPTION_PREFIX_STRING = ENCRYPTION_PREFIX;
