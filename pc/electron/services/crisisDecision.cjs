/**
 * crisisDecision.cjs — 危机等级决策纯函数（方案A：双确认 + 个人化误报降级）
 *
 * 背景（docs/external_eval_onnx.md）：外部语料实测发现部署模型对
 * "绝望/无意义/用药"类表达大量高置信触发 crisis，若沿用"crisisProb>=0.5 即弹窗"
 * 会出现警报疲劳。方案A 把弹窗（crisis）改为**双确认**：
 *
 *   crisis 弹窗 = ONNX crisis 概率 >= 0.5 且（命中 L1 危机词 或 命中语义强词表）
 *   ONNX 单路高置信危机（无语义佐证）→ 降为 high（风险卡 + 热线提示，不弹全屏）
 *
 * 个人化（自进化）：用户把某次提醒标记为"误报"后，渲染层通过
 * calibration.crisisFeedback 携带近期误报样本文本；此后**仅当无 L1 硬词命中**
 * 且当前文本与 ≥2 条历史误报样本相似时，把 crisis 降为 high。
 * 安全边界：L1 硬词（想死/自杀/…）命中时绝不降级——反馈只能压误报，不能压真危机。
 */

/** 清洗文本：去标点/空白，保留中英数字 */
function cleanText(text) {
  return String(text || '').replace(/[\s，。！？、；：""''（）【】《》,.!?;:()\[\]{}<>]/g, '');
}

/** 字符 bigram 集合 */
function charBigrams(s) {
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

/** 字符 bigram Jaccard 相似度（0~1），中文短文本效果良好 */
function bigramSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a.length < 3 || b.length < 3) return a === b ? 1 : 0;
  const A = charBigrams(a);
  const B = charBigrams(b);
  if (A.size === 0 && B.size === 0) return a === b ? 1 : 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  const union = A.size + B.size - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * 个人化误报判定：当前文本与历史"误报"样本的相似度投票。
 * 阈值 0.5 + 至少 2 条相似样本才降级（防单条噪声影响判定）。
 */
function personalFalseAlarm(text, crisisFeedback) {
  if (!Array.isArray(crisisFeedback) || crisisFeedback.length === 0) return false;
  const a = cleanText(text);
  if (a.length < 4) return false;
  let votes = 0;
  for (const f of crisisFeedback) {
    if (!f || f.verdict !== 'false_alarm' || typeof f.text !== 'string') continue;
    if (bigramSimilarity(a, cleanText(f.text)) >= 0.5) {
      votes += 1;
      if (votes >= 2) return true;
    }
  }
  return false;
}

/**
 * 危机等级决策（纯函数，无 IO，便于单测）。
 *
 * @param {object} opts
 * @param {number} opts.crisisProb   ONNX 未校准 crisis 概率（0~1）
 * @param {object} opts.scan         keywordScan 结果：hasCrisis / strongPhrases
 * @param {string} opts.text         原始文本（个人化相似度用）
 * @param {Array<{text:string,verdict:'false_alarm'}>} [opts.crisisFeedback]
 * @returns {{level: string|null, crisisLevel: number, method: string|null, downgradedByUser: boolean, crisisSignal: string}}
 *   level 为 null 表示危机通道未触发（调用方继续走负面情绪常规逻辑）
 */
function decideCrisisLevel({ crisisProb, scan, text, crisisFeedback }) {
  const p = Number.isFinite(crisisProb) ? crisisProb : 0;
  const hasKeyword = Boolean(scan && scan.hasCrisis);
  const strongCount = (scan && scan.strongPhrases && scan.strongPhrases.length) || 0;
  const hasStrong = strongCount > 0;
  const hasSignal = hasKeyword || hasStrong;

  if (p >= 0.5) {
    if (hasSignal) {
      // 双确认成立；个人化降级仅允许在"无 L1 硬词"时压 ONNX 单路误报
      if (!hasKeyword && personalFalseAlarm(text, crisisFeedback)) {
        return { level: 'high', crisisLevel: 2, method: 'onnx', downgradedByUser: true, crisisSignal: 'onnx+strong' };
      }
      return { level: 'crisis', crisisLevel: 3, method: 'onnx', downgradedByUser: false, crisisSignal: hasKeyword ? 'onnx+keyword' : 'onnx+strong' };
    }
    // 方案A 核心：ONNX 单路危机，无语义佐证 → 不弹全屏，降为 high
    return { level: 'high', crisisLevel: 2, method: 'onnx', downgradedByUser: false, crisisSignal: 'onnx_only' };
  }

  if (hasKeyword && p > 0.3) {
    return { level: 'high', crisisLevel: 2, method: 'onnx', downgradedByUser: false, crisisSignal: 'keyword+onnx' };
  }
  if (hasSignal) {
    return { level: 'medium', crisisLevel: 1, method: 'keyword', downgradedByUser: false, crisisSignal: hasKeyword ? 'keyword' : 'strong_phrase' };
  }
  return { level: null, crisisLevel: 0, method: null, downgradedByUser: false, crisisSignal: 'none' };
}

module.exports = {
  decideCrisisLevel,
  personalFalseAlarm,
  bigramSimilarity,
  cleanText,
};
