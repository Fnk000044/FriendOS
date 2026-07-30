import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createRequire } from 'module';

/**
 * main.cjs 高风险 IPC handler 输入边界测试
 *
 * 通过向 CJS require 缓存注入 electron stub 后加载 main.cjs，
 * 用假 ipcMain 捕获全部 handler，再直接调用验证输入边界：
 * - open-external：协议黑名单 / URL 解码绕过 / UNC / 长度 / 扩展名 / 路径穿越
 * - sentiment-analyze：非字符串与超长文本拒绝（不触发 ONNX 加载）
 * - backup-export：非字符串与超大备份拒绝（不弹出系统对话框）
 * - risk:calculate / risk:getTrend：畸形入参降级为安全兜底结构
 *
 * 约束：app.whenReady 返回永不 resolve 的 Promise，避免 createWindow /
 * CSP 注册等窗口路径在测试环境执行。
 */

const nodeRequire = createRequire(import.meta.url);

// 捕获 main.cjs（含其加载的服务模块）注册的所有 IPC handler
const handlers = new Map<string, (...args: unknown[]) => unknown>();
const invoke = (channel: string, ...args: unknown[]) => {
  const fn = handlers.get(channel);
  if (!fn) throw new Error(`handler not registered: ${channel}`);
  // 第一个参数是 IpcMainInvokeEvent，handler 均不使用其内容
  return fn({} as unknown, ...args);
};

const openExternalSpy = vi.fn(async () => undefined);
const openPathSpy = vi.fn(async () => '');
const showSaveDialogSpy = vi.fn(async () => ({ canceled: true, filePath: '' }));

beforeAll(() => {
  const electronStub = {
    app: {
      isPackaged: false,
      whenReady: () => new Promise(() => { /* never resolves: 跳过窗口创建 */ }),
      on: () => undefined,
      getPath: () => process.cwd(),
      getAppPath: () => process.cwd(),
      setAppUserModelId: () => undefined,
      quit: () => undefined,
      relaunch: () => undefined,
      exit: () => undefined,
    },
    BrowserWindow: class {},
    ipcMain: {
      handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
        handlers.set(channel, fn);
      },
    },
    shell: { openExternal: openExternalSpy, openPath: openPathSpy },
    session: {
      defaultSession: {
        webRequest: { onHeadersReceived: () => undefined },
        setPermissionRequestHandler: () => undefined,
        clearCache: async () => undefined,
        clearCodeCache: async () => undefined,
      },
    },
    dialog: { showSaveDialog: showSaveDialogSpy, showOpenDialog: vi.fn() },
    Notification: class {
      static isSupported() { return false; }
      show() { /* noop */ }
    },
    nativeImage: { createFromPath: () => ({ isEmpty: () => true }) },
    safeStorage: { isEncryptionAvailable: () => false },
  };

  // 注入 stub 到 require 缓存：main.cjs 与服务模块的 require('electron') 都会命中
  const electronPath = nodeRequire.resolve('electron');
  const ModuleCtor = nodeRequire('module') as unknown as new (id: string) => {
    exports: unknown; loaded: boolean;
  };
  const fakeModule = new ModuleCtor(electronPath);
  fakeModule.exports = electronStub;
  fakeModule.loaded = true;
  nodeRequire.cache[electronPath] = fakeModule as unknown as NodeJS.Module;

  nodeRequire('../main.cjs');
});

describe('main.cjs IPC handlers', () => {
  it('注册了全部高风险通道', () => {
    for (const channel of ['open-external', 'sentiment-analyze', 'backup-export', 'risk:calculate', 'risk:getTrend']) {
      expect(handlers.has(channel), channel).toBe(true);
    }
  });

  describe('open-external 输入边界', () => {
    it('拒绝空值与非字符串', async () => {
      expect(await invoke('open-external', null)).toEqual({ success: false, error: '无效路径' });
      expect(await invoke('open-external', 123)).toEqual({ success: false, error: '无效路径' });
      expect(await invoke('open-external', '')).toEqual({ success: false, error: '无效路径' });
    });

    it('拒绝超长路径（>1024）', async () => {
      const r = await invoke('open-external', 'a'.repeat(1025)) as { success: boolean };
      expect(r.success).toBe(false);
    });

    it('拒绝危险协议，包括 URL 编码绕过', async () => {
      const direct = await invoke('open-external', 'javascript:alert(1)') as { success: boolean; error: string };
      expect(direct.success).toBe(false);
      expect(direct.error).toBe('不允许的协议类型');
      // URL 编码后的 javascript: 也必须被解码校验拦截
      const encoded = await invoke('open-external', 'javascript%3Aalert(1)') as { success: boolean };
      expect(encoded.success).toBe(false);
    });

    it('拒绝 UNC 路径', async () => {
      const r = await invoke('open-external', '\\\\evil-server\\share\\a.txt') as { success: boolean; error: string };
      expect(r.success).toBe(false);
      expect(r.error).toBe('不允许访问 UNC 路径');
    });

    it('拒绝不安全扩展名', async () => {
      const r = await invoke('open-external', 'C:\\temp\\evil.exe') as { success: boolean; error: string };
      expect(r.success).toBe(false);
      expect(r.error).toBe('不支持的文件类型');
    });

    it('拒绝无法归一化的路径穿越', async () => {
      const r = await invoke('open-external', '..\\..\\secret.txt') as { success: boolean; error: string };
      expect(r.success).toBe(false);
      expect(r.error).toBe('路径包含非法字符');
    });

    it('放行 https 链接并走 shell.openExternal', async () => {
      openExternalSpy.mockClear();
      const r = await invoke('open-external', 'https://example.com/help') as { success: boolean };
      expect(r.success).toBe(true);
      expect(openExternalSpy).toHaveBeenCalledWith('https://example.com/help');
    });
  });

  describe('sentiment-analyze 输入边界', () => {
    it('拒绝非字符串输入且不抛出', async () => {
      const r = await invoke('sentiment-analyze', null) as { error?: string; method: string; level: string };
      expect(r.error).toBe('文本过长或格式无效');
      expect(r.method).toBe('keyword');
      expect(r.level).toBe('low');
    });

    it('拒绝超长文本（>10000）', async () => {
      const r = await invoke('sentiment-analyze', 'a'.repeat(10001)) as { error?: string };
      expect(r.error).toBe('文本过长或格式无效');
    });
  });

  describe('backup-export 输入边界', () => {
    it('拒绝非字符串且不弹出保存对话框', async () => {
      showSaveDialogSpy.mockClear();
      const r = await invoke('backup-export', { not: 'a string' }) as { success: boolean; error: string };
      expect(r.success).toBe(false);
      expect(r.error).toBe('备份数据过大或格式无效');
      expect(showSaveDialogSpy).not.toHaveBeenCalled();
    });

    it('拒绝超过 10MB 的备份数据', async () => {
      showSaveDialogSpy.mockClear();
      const r = await invoke('backup-export', 'a'.repeat(10 * 1024 * 1024 + 1)) as { success: boolean };
      expect(r.success).toBe(false);
      expect(showSaveDialogSpy).not.toHaveBeenCalled();
    });
  });

  describe('risk:calculate / risk:getTrend 畸形入参降级', () => {
    it('undefined 入参返回安全兜底结构而非抛出', async () => {
      const r = await invoke('risk:calculate', undefined) as {
        totalScore: number; riskLevel: string; factors: unknown[]; error?: string;
      };
      expect(r.totalScore).toBe(0);
      expect(r.riskLevel).toBe('low');
      expect(Array.isArray(r.factors)).toBe(true);
      expect(r.error).toBeDefined();
    });

    it('空对象入参返回完整的计算结果契约', async () => {
      const r = await invoke('risk:calculate', {}) as {
        totalScore: number; riskLevel: string; breakdown: object; factors: unknown[]; summary: string;
      };
      expect(typeof r.totalScore).toBe('number');
      expect(typeof r.riskLevel).toBe('string');
      expect(r.breakdown).toBeDefined();
      expect(Array.isArray(r.factors)).toBe(true);
    });

    it('risk:getTrend 空入参返回稳定趋势', async () => {
      const r = await invoke('risk:getTrend', null) as { trend: string; change: number; data: unknown[] };
      expect(r.trend).toBe('stable');
      expect(r.change).toBe(0);
      expect(r.data).toEqual([]);
    });

    it('risk:getTrend 非数组入参降级为兜底结构', async () => {
      const r = await invoke('risk:getTrend', 'not-an-array' as unknown) as { trend: string; error?: string };
      expect(r.trend).toBe('stable');
      expect(r.error).toBeDefined();
    });
  });
});
