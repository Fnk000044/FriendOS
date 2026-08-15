/**
 * eval-onnx-external-v2.cjs — 更严谨的外部语料评测（三部分）
 *
 * 1) 关键词基线 vs 部署 ONNX 模型：同一弱标注集上对比两者与标签的一致性。
 *    —— 弱标注由关键词规则产生，基线必然接近满分；两者的差距反映"规则之外
 *    模型在预测什么"（偏向语义/更激进），用于判断低分是噪声还是失效。
 * 2) 各语料上模型预测的类别分布 + 平均最大 softmax 置信度。
 *    —— 若预测分布稳定且置信度高，说明模型行为一致、差异源于标注域偏差。
 * 3) 模型高置信 crisis 预测（>0.9）抽样 12 条打印，供人工判断"模型是否合理"。
 *    —— 直接回答：模型把"焦虑到失眠"判成危机，是否可接受。
 *
 * 运行：node scripts/eval-onnx-external-v2.cjs
 */

const fs = require('fs');
const path = require('path');
const ort = require('onnxruntime-node');

const ROOT = path.join(__dirname, '..', '..');
const MODEL_DIR = path.join(__dirname, '..', 'models', 'sentiment');
const LABELS = ['negative', 'neutral', 'positive', 'crisis'];
const MAX_LEN = 128;

const POSITIVE_KW = ['开心', '快乐', '高兴', '满足', '感恩', '幸福', '希望', '期待', '喜欢', '享受', '放松', '平静', '充实', '成就感', '自信', '积极', '乐观', '欣慰', '喜悦', '温暖'];
const NEGATIVE_KW = ['难过', '悲伤', '抑郁', '焦虑', '压力', '崩溃', '绝望', '孤独', '失眠', '累', '烦', '愤怒', '恐惧', '害怕', '自卑', '无力', '迷茫', '低落', '痛苦', '自责', '内疚', '想哭', '压抑', '疲惫', '烦躁'];
const CRISIS_KW = ['想死', '自杀', '不想活', '结束生命', '活着没意义', '轻生', '了断', '解脱', '离开这个世界', '伤害自己', '割腕', '跳楼', '安眠药', '撑不下去', '没有希望'];

function weakLabel(text) {
  const s = String(text || '');
  if (CRISIS_KW.some((k) => s.includes(k))) return 'crisis';
  if (NEGATIVE_KW.some((k) => s.includes(k))) return 'negative';
  if (POSITIVE_KW.some((k) => s.includes(k))) return 'positive';
  return 'neutral';
}

function makeTokenizer(vocab, vocabSet) {
  const UNK = 100, CLS = 101, SEP = 102;
  return function tokenize(rawText, maxLength = MAX_LEN) {
    let text = String(rawText || '').normalize('NFC');
    text = text.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) text = ' ';
    const words = [];
    let i = 0;
    while (i < text.length) {
      const ch = text.charCodeAt(i);
      if ((ch >= 0x4E00 && ch <= 0x9FFF) || (ch >= 0x3400 && ch <= 0x4DBF)) { words.push(text[i]); i++; }
      else if (/[a-zA-Z0-9]/.test(text[i])) { let w = ''; while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) { w += text[i]; i++; } words.push(w.toLowerCase()); }
      else if (/\s/.test(text[i])) { i++; }
      else { const p = text[i]; if (vocabSet.has(p)) words.push(p); else { const pMap = { '…': '...', '—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'" }; words.push(pMap[p] || p); } i++; }
    }
    const tokenIds = [CLS];
    for (const word of words) {
      if (tokenIds.length >= maxLength - 1) break;
      if (word.length === 1 && word.charCodeAt(0) >= 0x4E00) tokenIds.push(vocab[word] !== undefined ? vocab[word] : UNK);
      else if (word.length === 1 && !/[a-zA-Z0-9]/.test(word)) tokenIds.push(vocab[word] !== undefined ? vocab[word] : UNK);
      else {
        let remaining = word, first = true;
        while (remaining.length > 0 && tokenIds.length < maxLength - 1) {
          let found = false;
          for (let len = remaining.length; len > 0; len--) {
            const piece = remaining.substring(0, len);
            const token = first ? piece : '##' + piece;
            if (vocab[token] !== undefined) { tokenIds.push(vocab[token]); remaining = remaining.substring(len); found = true; first = false; break; }
          }
          if (!found) { tokenIds.push(UNK); break; }
        }
      }
    }
    tokenIds.push(SEP);
    const attentionMask = tokenIds.map(() => 1);
    while (tokenIds.length < maxLength) { tokenIds.push(0); attentionMask.push(0); }
    return { inputIds: tokenIds.slice(0, maxLength), attentionMask: attentionMask.slice(0, maxLength) };
  };
}

function loadPsyDTCorpus(maxN) {
  const arr = JSON.parse(fs.readFileSync(path.join(ROOT, '数据集1', 'PsyDTCorpus', 'PsyDTCorpus_test_single_turn_split.json'), 'utf8'));
  const samples = [];
  for (const item of arr) {
    if (samples.length >= maxN) break;
    const texts = (item.messages || []).filter((c) => c.role === 'user' || c.role === 'human').map((c) => c.content || c.value || '');
    for (const text of texts) {
      if (samples.length >= maxN) break;
      if (typeof text !== 'string' || text.length < 6) continue;
      samples.push({ text: text.slice(0, 500), label: weakLabel(text) });
    }
  }
  return samples;
}

function loadDistillPsychology(maxN) {
  const lines = fs.readFileSync(path.join(ROOT, '数据集3', 'distill_psychology-10k-r1.json'), 'utf8').split('\n').filter((l) => l.trim());
  const samples = [];
  for (const line of lines) {
    if (samples.length >= maxN) break;
    let item;
    try { item = JSON.parse(line); } catch { continue; }
    const input = item.input || '';
    if (typeof input !== 'string' || input.length < 6) continue;
    samples.push({ text: input.slice(0, 500), label: weakLabel(input) });
  }
  return samples;
}

async function predictBatch(session, tokenize, samples, BATCH = 128) {
  const preds = [];
  const confs = [];
  for (let i = 0; i < samples.length; i += BATCH) {
    const batch = samples.slice(i, i + BATCH);
    const ids = new BigInt64Array(BATCH * MAX_LEN);
    const masks = new BigInt64Array(BATCH * MAX_LEN);
    batch.forEach((s, bi) => {
      const tok = tokenize(s.text);
      tok.inputIds.forEach((v, ti) => { ids[bi * MAX_LEN + ti] = BigInt(v); });
      tok.attentionMask.forEach((v, ti) => { masks[bi * MAX_LEN + ti] = BigInt(v); });
    });
    const outputs = await session.run({
      input_ids: new ort.Tensor('int64', ids, [BATCH, MAX_LEN]),
      attention_mask: new ort.Tensor('int64', masks, [BATCH, MAX_LEN]),
    });
    const logits = outputs[session.outputNames[0]].data;
    const per = logits.length / BATCH;
    for (let bi = 0; bi < batch.length; bi++) {
      const s = bi * per;
      let best = 0;
      for (let c = 1; c < 4; c++) if (logits[s + c] > logits[s + best]) best = c;
      const max = Math.max(...Array.from({ length: 4 }, (_, c) => logits[s + c]));
      const exps = Array.from({ length: 4 }, (_, c) => Math.exp(logits[s + c] - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      preds.push(LABELS[best]);
      confs.push(exps[best] / sum);
    }
  }
  return { preds, confs };
}

function acc(samples, preds) {
  let ok = 0;
  for (let i = 0; i < samples.length; i++) if (samples[i].label === preds[i]) ok++;
  return samples.length > 0 ? ok / samples.length : 0;
}

async function main() {
  const session = await ort.InferenceSession.create(path.join(MODEL_DIR, 'sentiment.onnx'));
  const vocab = JSON.parse(fs.readFileSync(path.join(MODEL_DIR, 'vocab.json'), 'utf8'));
  const tokenize = makeTokenizer(vocab, new Set(Object.keys(vocab)));

  const corpora = [
    { name: '数据集1 PsyDTCorpus', samples: loadPsyDTCorpus(2000) },
    { name: '数据集3 distill_psychology', samples: loadDistillPsychology(1500) },
  ];

  console.log('=== 外部语料评测 v2（关键词基线 vs 部署 ONNX）===\n');
  const allHighConfCrisis = [];

  for (const corpus of corpora) {
    const { samples } = corpus;
    const { preds, confs } = await predictBatch(session, tokenize, samples);
    console.log(`\n── ${corpus.name}（${samples.length} 条）──`);

    const dist = {};
    for (const s of samples) dist[s.label] = (dist[s.label] || 0) + 1;
    console.log('弱标注分布:', JSON.stringify(dist));

    const predDist = {};
    for (const p of preds) predDist[p] = (predDist[p] || 0) + 1;
    console.log('模型预测分布:', JSON.stringify(predDist));

    const avgConf = confs.reduce((a, b) => a + b, 0) / confs.length;
    console.log(`模型平均最大置信度: ${(avgConf * 100).toFixed(1)}%`);
    console.log(`与弱标注一致率: 模型 ${(acc(samples, preds) * 100).toFixed(2)}%`);

    // 高置信 crisis 抽样
    const highConf = samples.map((s, i) => ({ s, conf: confs[i], pred: preds[i] }))
      .filter((x) => x.pred === 'crisis' && x.conf > 0.9)
      .sort((a, b) => b.conf - a.conf);
    console.log(`高置信 crisis 预测（>0.9）: ${highConf.length} 条`);
    for (const x of highConf.slice(0, 6)) {
      allHighConfCrisis.push({ corpus: corpus.name, conf: x.conf, label: x.s.label, text: x.s.text });
    }
  }

  console.log('\n\n=== 高置信 crisis 预测抽样（人工判断模型是否"过度敏感"）===');
  for (const x of allHighConfCrisis.slice(0, 12)) {
    console.log(`\n[${x.corpus}] 弱标注=${x.label} 置信=${(x.conf * 100).toFixed(1)}%`);
    console.log(`  ${x.text.slice(0, 150)}`);
  }
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
