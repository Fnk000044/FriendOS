/**
 * 危机通道冻结（最高安全优先级）独立验证
 *
 * 目标：即使 calibration.priors 极大偏向 positive/neutral，SentimentService 的
 * crisisProb 输出不变、crisis 判定（level==='crisis' / crisisLevel）不受影响。
 *
 * 实现约束：analyzeWithONNX 依赖 onnxruntime-node + 真实模型文件，测试环境无法加载。
 * 本测试通过在 createRequire 加载 SentimentService.cjs 之前，用 Module._load 注入
 * 假的 onnxruntime-node / electron / fs，使 tryLoadOnnxModel 加载一个返回固定 logits
 * 的假会话，从而直测 ONNX 校准路径。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── 在 require SentimentService 之前注入 mock ──────────────────
const Module = require('module') as typeof import('module');
const originalLoad = Module._load;

// 4 分类顺序：negative(0) / neutral(1) / positive(2) / crisis(3)
// 固定 logits 使 crisis 通道 softmax 概率 ≈ 0.81（>= 0.5 进入危机通道判定；
// 方案A 双确认下：无关键词佐证 → high，命中 L1 危机词 → crisis）
const FIXED_LOGITS = [0.0, 0.0, 0.0, 2.0];

const fakeOrt = {
  Tensor: class Tensor {
    type: unknown;
    data: unknown;
    dims: unknown;
    constructor(type: unknown, data: unknown, dims: unknown) {
      this.type = type;
      this.data = data;
      this.dims = dims;
    }
  },
  InferenceSession: {
    create: async () => ({
      run: async () => ({ logits: { data: FIXED_LOGITS.slice() } }),
    }),
  },
};

Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'onnxruntime-node') return fakeOrt;
  if (request === 'electron') {
    return { app: { isPackaged: false, getPath: () => '/tmp/friendos-crisis-freeze-test' } };
  }
  return originalLoad.apply(this, arguments as never);
} as typeof Module._load;

const fs = require('fs') as typeof import('fs');
const origExistsSync = fs.existsSync;
const origReadFileSync = fs.readFileSync;
const origAppendFileSync = fs.appendFileSync;
fs.existsSync = ((p: string) =>
  String(p).endsWith('sentiment.onnx') ? true : origExistsSync(p)) as typeof fs.existsSync;
fs.readFileSync = ((p: string, ...args: never[]) =>
  String(p).endsWith('vocab.json') ? '{}' : origReadFileSync(p, ...args)) as typeof fs.readFileSync;
fs.appendFileSync = (() => {}) as typeof fs.appendFileSync;

const { analyzeEnhanced, tryLoadOnnxModel, isOnnxLoaded } = require('../SentimentService.cjs') as {
  analyzeEnhanced: (text: string, calibration?: unknown) => Promise<Record<string, unknown>>;
  tryLoadOnnxModel: () => Promise<unknown>;
  isOnnxLoaded: () => boolean;
};

afterAll(() => {
  Module._load = originalLoad;
  fs.existsSync = origExistsSync;
  fs.readFileSync = origReadFileSync;
  fs.appendFileSync = origAppendFileSync;
});

describe('SentimentService 危机通道冻结（ONNX 校准路径）', () => {
  beforeAll(async () => {
    await tryLoadOnnxModel();
  });

  it('加载假 ONNX 会话成功（前置条件）', () => {
    expect(isOnnxLoaded()).toBe(true);
  });

  it('极端 positive/neutral 先验不改变 crisisProb（输出完全一致）', async () => {
    const extremePositive = {
      priors: { neg: -0.5, neu: -0.5, pos: 1.0 }, // Σβ=0，pos 拉到上界
      temperature: 1.0,
      sampleCount: 20,
    };

    const withCal = await analyzeEnhanced('今天天气很好', extremePositive);
    const withoutCal = await analyzeEnhanced('今天天气很好', undefined);

    // 危机概率冻结：两条路径输出完全一致
    expect(withCal.crisisProb).toBe(withoutCal.crisisProb);
    expect(withCal.crisisProb).toBeGreaterThanOrEqual(0.5);
  });

  it('极端 positive 先验下 crisis 判定不受影响（方案A：ONNX 单路无佐证 → high，两条路径一致）', async () => {
    const extremePositive = {
      priors: { neg: -0.5, neu: -0.5, pos: 1.0 },
      temperature: 1.0,
      sampleCount: 20,
    };

    const withCal = await analyzeEnhanced('今天天气很好', extremePositive);
    const withoutCal = await analyzeEnhanced('今天天气很好', undefined);

    // 危机判定用未校准概率；本句无危机词/强词 → 方案A 降为 high（不弹全屏）
    expect(withCal.level).toBe('high');
    expect(withoutCal.level).toBe('high');
    expect(withCal.crisisLevel).toBe(2);
    expect(withoutCal.crisisLevel).toBe(2);
  });

  it('命中 L1 危机词时仍升级 crisis（弹窗），且校准不能影响该判定', async () => {
    const extremePositive = {
      priors: { neg: -0.5, neu: -0.5, pos: 1.0 },
      temperature: 1.0,
      sampleCount: 20,
    };

    const withCal = await analyzeEnhanced('我真的想死', extremePositive);
    const withoutCal = await analyzeEnhanced('我真的想死', undefined);

    expect(withCal.level).toBe('crisis');
    expect(withoutCal.level).toBe('crisis');
    expect(withCal.crisisLevel).toBe(3);
    expect(withoutCal.crisisLevel).toBe(3);
  });

  it('校准确实生效（positive 先验抬高 positiveProb、压低 negativeProb），证明冻结非"未生效"', async () => {
    const extremePositive = {
      priors: { neg: -0.5, neu: -0.5, pos: 1.0 },
      temperature: 1.0,
      sampleCount: 20,
    };

    const withCal = await analyzeEnhanced('今天天气很好', extremePositive);
    const withoutCal = await analyzeEnhanced('今天天气很好', undefined);

    expect(withCal.positiveProb).toBeGreaterThan(withoutCal.positiveProb as number);
    expect(withCal.negativeProb).toBeLessThan(withoutCal.negativeProb as number);

    expect(withCal.calibrated).toBe(true);
    expect(withoutCal.calibrated).toBe(false);
  });

  it('极端 negative 先验（用户总是报负向）同样不能抬高危机灵敏度', async () => {
    // 用户连续纠正为 negative → neg 先验拉高；crisis 仍必须冻结
    const extremeNegative = {
      priors: { neg: 1.0, neu: -0.5, pos: -0.5 },
      temperature: 1.0,
      sampleCount: 20,
    };

    const withCal = await analyzeEnhanced('今天天气很好', extremeNegative);
    const withoutCal = await analyzeEnhanced('今天天气很好', undefined);

    expect(withCal.crisisProb).toBe(withoutCal.crisisProb);
    // 方案A：无佐证的 ONNX 单路危机 → high（两条路径一致）
    expect(withCal.level).toBe('high');
    expect(withoutCal.level).toBe('high');
  });
});
