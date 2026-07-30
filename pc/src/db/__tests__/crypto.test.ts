import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptField,
  decryptField,
  setEncryptionKey,
  hasRealEncryptionKey,
  ENCRYPTION_PREFIX_STRING,
} from '../crypto';

describe('db/crypto (字段级 AES-GCM 加密)', () => {
  beforeEach(async () => {
    // 每个用例前重置为占位密钥，避免上一个用例的密码残留
    await setEncryptionKey(null);
  });

  describe('encryptField / decryptField 基础语义', () => {
    it('加密后字符串带 enc:: 前缀且与明文不同', async () => {
      const plain = 'hello world';
      const cipher = await encryptField(plain);
      expect(cipher).not.toBe(plain);
      expect(cipher?.startsWith(ENCRYPTION_PREFIX_STRING)).toBe(true);
    });

    it('加密 → 解密能还原原值（round-trip）', async () => {
      const plain = '一段中文 + emoji 😀 + symbols !@#$%';
      const cipher = await encryptField(plain);
      const decoded = await decryptField(cipher);
      expect(decoded).toBe(plain);
    });

    it('同一明文加密两次产生不同密文（IV 随机性）', async () => {
      const plain = 'same input';
      const c1 = await encryptField(plain);
      const c2 = await encryptField(plain);
      expect(c1).not.toBe(c2);
      // 但都能解密回原值
      expect(await decryptField(c1)).toBe(plain);
      expect(await decryptField(c2)).toBe(plain);
    });

    it('已加密的字符串再次调用 encryptField 不重复加密', async () => {
      const plain = 'idempotent test';
      const c1 = await encryptField(plain);
      const c2 = await encryptField(c1);
      expect(c2).toBe(c1);
    });
  });

  describe('空值与边界', () => {
    it('null / undefined 原样返回（不加密）；空串返回空串（不加密）', async () => {
      expect(await encryptField(null as string | null)).toBeUndefined();
      expect(await encryptField(undefined)).toBeUndefined();
      // encryptField(''): guard `plain == null || plain === ''` 命中，
      // 走 `plain ?? undefined` 分支，'' 非空(undefined)所以返回 '' 原值
      expect(await encryptField('')).toBe('');
    });

    it('decryptField(null / undefined) 原样返回；空串原样返回空串', async () => {
      expect(await decryptField(null as string | null)).toBeUndefined();
      expect(await decryptField(undefined)).toBeUndefined();
      expect(await decryptField('')).toBe('');
    });

    it('decryptField 对非 enc:: 前缀的旧明文数据原样返回（迁移兼容）', async () => {
      const legacy = 'legacy-plain-text';
      expect(await decryptField(legacy)).toBe(legacy);
    });

    it('超长文本（10000 字符）能完整往返', async () => {
      const long = 'x'.repeat(10000);
      const decoded = await decryptField(await encryptField(long));
      expect(decoded).toBe(long);
    });

    it('空字符串经 encryptField 返回空串（guard 命中），decryptField 链路不崩溃', async () => {
      const empty = '';
      const c = await encryptField(empty);
      // 实际语义：encryptField('') 命中 guard，走 `plain ?? undefined`，'' 非空 → 返回 ''
      expect(c).toBe('');
      // decryptField('') 同样命中 guard，返回 ''
      expect(await decryptField(c)).toBe('');
    });
  });

  describe('密钥切换与解密失败', () => {
    it('用户设密码后再切换回占位密钥，旧密文无法解密（返回空串）', async () => {
      // 用密码 A 加密
      await setEncryptionKey('password-A');
      const plain = 'secret under A';
      const cipher = await encryptField(plain);
      expect(await decryptField(cipher)).toBe(plain);

      // 切换到占位密钥（模拟用户清除 app lock）
      await setEncryptionKey(null);
      // 旧密文用新密钥解不开，decryptField 应回空串（不抛异常）
      const decoded = await decryptField(cipher);
      expect(decoded).toBe('');
    });

    it('密码 A 加密的密文，密码 B 解不开', async () => {
      await setEncryptionKey('pass-A');
      const plain = 'data under A';
      const cipher = await encryptField(plain);

      await setEncryptionKey('pass-B');
      expect(await decryptField(cipher)).toBe('');
    });

    it('同一密码两次 setEncryptionKey 派生的密钥等价（能互解）', async () => {
      await setEncryptionKey('same-password');
      const cipher = await encryptField('data');

      // 再次 set 同一密码（hash 重新计算但密钥语义一致）
      await setEncryptionKey('same-password');
      expect(await decryptField(cipher)).toBe('data');
    });

    it('损坏的密文（base64 被篡改）decryptField 返回空串不抛异常', async () => {
      const tampered = ENCRYPTION_PREFIX_STRING + '!!!not-valid-base64!!!';
      expect(await decryptField(tampered)).toBe('');
    });

    it('密文 IV 部分被截断后解密失败返回空串', async () => {
      await setEncryptionKey('pw');
      const cipher = await encryptField('content');
      // 砍掉末尾几个字符（破坏 ciphertext）
      const truncated = cipher!.slice(0, -4);
      expect(await decryptField(truncated)).toBe('');
    });
  });

  describe('hasRealEncryptionKey', () => {
    it('未设密码时返回 false', async () => {
      await setEncryptionKey(null);
      expect(hasRealEncryptionKey()).toBe(false);
    });

    it('设置密码后返回 true', async () => {
      await setEncryptionKey('any-password');
      expect(hasRealEncryptionKey()).toBe(true);
    });

    it('清除密码（setEncryptionKey(null)）后回到 false', async () => {
      await setEncryptionKey('any-password');
      expect(hasRealEncryptionKey()).toBe(true);
      await setEncryptionKey(null);
      expect(hasRealEncryptionKey()).toBe(false);
    });
  });
});
