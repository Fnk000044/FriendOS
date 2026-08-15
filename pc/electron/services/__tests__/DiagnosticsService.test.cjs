/**
 * DiagnosticsService 测试（node 环境，createRequire 加载）
 *
 * 说明：DiagnosticsService.cjs 顶层 require('electron')。在 vitest node 环境下，
 * require('electron') 返回的是 electron 可执行文件路径字符串（非 API），
 * 因此 app/net 为 undefined，check() 内部 try/catch 会优雅降级——
 * 这恰好等价于「主进程能力不可用」的降级路径，可验证返回结构完整且无抛错。
 *
 * 覆盖：
 * 1. check() 返回四态字段完整（network/model/apiKey/degradationPath/demoMode/timestamp）
 * 2. demoMode 透传
 * 3. 无 Key/离线降级路径 = template（离线模板对话）
 * 4. 不泄露 API Key 本体（无 key 字段值）
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { check } = require('../DiagnosticsService.cjs');

describe('DiagnosticsService', () => {
  it('check() 返回四态字段完整且为合法类型', async () => {
    const res = await check({ demoMode: false });

    expect(res).toBeTruthy();
    expect(typeof res.appVersion).toBe('string');
    expect(typeof res.network.online).toBe('boolean');
    expect(typeof res.model.onnxLoaded).toBe('boolean');
    expect(typeof res.model.onnxAvailable).toBe('boolean');
    expect(typeof res.model.method).toBe('string');
    expect(typeof res.apiKey.hasKey).toBe('boolean');
    expect(['cloud', 'template']).toContain(res.degradationPath);
    expect(typeof res.demoMode).toBe('boolean');
    expect(typeof res.timestamp).toBe('number');
  });

  it('demoMode 参数透传到结果', async () => {
    const res = await check({ demoMode: true });
    expect(res.demoMode).toBe(true);

    const res2 = await check({ demoMode: false });
    expect(res2.demoMode).toBe(false);

    // 缺省视为 false
    const res3 = await check();
    expect(res3.demoMode).toBe(false);
  });

  it('无 Key / 离线时降级路径为 template（离线模板对话）', async () => {
    const res = await check({ demoMode: false });
    // node 环境下 electron.net 不可用 → online=false；ChatLLMService 若无 key → hasKey=false
    if (!res.apiKey.hasKey) {
      expect(res.degradationPath).toBe('template');
    } else {
      // 若本机恰好有 key（CI 注入），则降级路径取决于 online
      expect(['cloud', 'template']).toContain(res.degradationPath);
    }
  });

  it('不泄露 API Key 本体', async () => {
    const res = await check({ demoMode: false });
    const json = JSON.stringify(res);
    // 返回值中不应出现 key 内容；provider 只允许枚举值（qwen 等已知 provider 名）
    expect(res.apiKey).not.toHaveProperty('value');
    expect(res.apiKey).not.toHaveProperty('key');
    if (res.apiKey.provider !== undefined) {
      expect(typeof res.apiKey.provider).toBe('string');
    }
    // 兜底断言：序列化结果不包含常见 secret 形似值
    expect(json).not.toMatch(/sk-[A-Za-z0-9]{8,}/);
  });
});
