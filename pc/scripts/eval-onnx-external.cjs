/**
 * eval-onnx-external.cjs — 部署版 ONNX 情感模型的外部语料实测
 *
 * 与 eval_report.md 的区别：那份是同分布测试集（test_final.jsonl，训练切分），
 * 本脚本用**训练时未见过**的外部语料实测部署模型（pc/models/sentiment/sentiment.onnx）
 * 的泛化准确率：
 *   - 数据集1 PsyDTCorpus_test_single_turn_split.json（SoulChat2.0 心理咨询语料）
 *   - 数据集3 distill_psychology-10k-r1.json（R1 蒸馏心理学对话）
 *
 * 标签：与 eval-sentiment.cjs / eval-risk.cjs 相同的关键词弱标注规则
 * （crisis/negative/positive/neutral），噪声约 ±10-15%——数字应解读为
 * "模型与规则标签在外部语料上的一致性"，而非金标准准确率。
 *
 * 分词器：从 SentimentService.cjs tokenizeForBERT 逐行移植（预处理一致）。
 * 运行：node scripts/eval-onnx-external.cjs
 */

const fs = require('fs');
const path = require('path');
const ort = require('onnxruntime-node');

const ROOT = path.join(__dirname, '..', '..');
const MODEL_DIR = path.join(__dirname, '..', 'models', 'sentiment');
const LABELS = ['negative', 'neutral', 'positive', 'crisis'];
const MAX_LEN = 128;

// ── 弱标注规则（与既有评估脚本一致）────────────────────────────
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

// ── 分词器（与 SentimentService.cjs tokenizeForBERT 一致）────────
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
      if ((ch >= 0x4E00 && ch <= 0x9FFF) || (ch >= 0x3400 && ch <= 0x4DBF)) {
        words.push(text[i]); i++;
      } else if (/[a-zA-Z0-9]/.test(text[i])) {
        let w = ''; while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) { w += text[i]; i++; }
        words.push(w.toLowerCase());
      } else if (/\s/.test(text[i])) {
        i++;
      } else {
        const p = text[i];
        if (vocabSet.has(p)) words.push(p);
        else {
          const pMap = { '…': '...', '—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'" };
          words.push(pMap[p] || p);
        }
        i++;
      }
    }

    const tokenIds = [CLS];
    for (const word of words) {
      if (tokenIds.length >= maxLength - 1) break;
      if (word.length === 1 && word.charCodeAt(0) >= 0x4E00) {
        tokenIds.push(vocab[word] !== undefined ? vocab[word] : UNK);
      } else if (word.length === 1 && !/[a-zA-Z0-9]/.test(word)) {
        tokenIds.push(vocab[word] !== undefined ? vocab[word] : UNK);
      } else {
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

// ── 样本加载 ────────────────────────────────────────────────────
function loadPsyDTCorpus(maxN) {
  const file = path.join(ROOT, '数据集1', 'PsyDTCorpus', 'PsyDTCorpus_test_single_turn_split.json');
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const samples = [];
  for (const item of arr) {
    if (samples.length >= maxN) break;
    const texts = [];
    if (item.messages && Array.isArray(item.messages)) {
      texts.push(...item.messages.filter((c) => c.role === 'user' || c.role === 'human').map((c) => c.content || c.value || ''));
    } else if (item.input) {
      texts.push(item.input);
    }
    for (const text of texts) {
      if (samples.length >= maxN) break;
      if (typeof text !== 'string' || text.length < 6) continue;
      samples.push({ text: text.slice(0, 500), label: weakLabel(text) });
    }
  }
  return samples;
}

function loadDistillPsychology(maxN) {
  const file = path.join(ROOT, '数据集3', 'distill_psychology-10k-r1.json');
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim());
  const samples = [];
  for (const line of lines) {
    if (samples.length >= maxN) break;
    let item;
    try { item = JSON.parse(line); } catch { continue; }
    const input = item.input || item.conversation || '';
    if (typeof input !== 'string' || input.length < 6) continue;
    samples.push({ text: input.slice(0, 500), label: weakLabel(input) });
  }
  return samples;
}

// ── 指标计算 ────────────────────────────────────────────────────
function computeMetrics(rows) {
  const confusion = {};
  for (const t of LABELS) { confusion[t] = {}; for (const p of LABELS) confusion[t][p] = 0; }
  for (const row of rows) confusion[row.true][row.pred] += 1;

  const metrics = {};
  for (const c of LABELS) {
    const tp = confusion[c][c];
    const fp = LABELS.reduce((s, o) => s + (o !== c ? confusion[o][c] : 0), 0);
    const fn = LABELS.reduce((s, o) => s + (o !== c ? confusion[c][o] : 0), 0);
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    metrics[c] = { precision, recall, f1, support: LABELS.reduce((s, o) => s + confusion[c][o], 0) };
  }
  const total = rows.length;
  const correct = rows.filter((r) => r.true === r.pred).length;
  const macroF1 = LABELS.reduce((s, c) => s + metrics[c].f1, 0) / LABELS.length;
  const crisisRecall = metrics.crisis.recall;
  return { accuracy: total > 0 ? correct / total : 0, macroF1, crisisRecall, metrics, confusion, total };
}

function fmt(v) { return (v * 100).toFixed(2) + '%'; }

// ── 主流程 ──────────────────────────────────────────────────────
async function main() {
  console.log('=== FriendOS 部署版 ONNX 模型 · 外部语料实测 ===\n');

  const modelPath = path.join(MODEL_DIR, 'sentiment.onnx');
  const vocabPath = path.join(MODEL_DIR, 'vocab.json');
  if (!fs.existsSync(modelPath)) { console.error('模型不存在:', modelPath); process.exit(1); }

  console.log('加载模型 + 词表…');
  const session = await ort.InferenceSession.create(modelPath);
  const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
  const vocabSet = new Set(Object.keys(vocab));
  const tokenize = makeTokenizer(vocab, vocabSet);
  console.log('模型输入:', session.inputNames, '| 词表大小:', Object.keys(vocab).length, '\n');

  const corpora = [
    { name: '数据集1 PsyDTCorpus（心理咨询）', load: () => loadPsyDTCorpus(2000) },
    { name: '数据集3 distill_psychology（心理学对话）', load: () => loadDistillPsychology(1500) },
  ];

  const perCorpus = [];
  const allRows = [];

  for (const corpus of corpora) {
    const samples = corpus.load();
    console.log(`\n── ${corpus.name}：${samples.length} 条 ──`);
    const dist = {};
    for (const s of samples) dist[s.label] = (dist[s.label] || 0) + 1;
    console.log('弱标注分布:', JSON.stringify(dist));

    const rows = [];
    const BATCH = 128;
    for (let i = 0; i < samples.length; i += BATCH) {
      const batch = samples.slice(i, i + BATCH);
      const ids = [];
      const masks = [];
      for (const s of batch) {
        const tok = tokenize(s.text);
        ids.push(tok.inputIds);
        masks.push(tok.attentionMask);
      }
      const inputIds = new BigInt64Array(BATCH * MAX_LEN);
      const attentionMask = new BigInt64Array(BATCH * MAX_LEN);
      ids.forEach((arr, bi) => arr.forEach((v, ti) => { inputIds[bi * MAX_LEN + ti] = BigInt(v); }));
      masks.forEach((arr, bi) => arr.forEach((v, ti) => { attentionMask[bi * MAX_LEN + ti] = BigInt(v); }));

      const outputs = await session.run({
        input_ids: new ort.Tensor('int64', inputIds, [BATCH, MAX_LEN]),
        attention_mask: new ort.Tensor('int64', attentionMask, [BATCH, MAX_LEN]),
      });
      const logits = outputs[session.outputNames[0]].data;
      const perSample = logits.length / BATCH;
      for (let bi = 0; bi < batch.length; bi++) {
        const start = bi * perSample;
        let best = 0;
        for (let c = 1; c < LABELS.length; c++) {
          if (logits[start + c] > logits[start + best]) best = c;
        }
        rows.push({ true: batch[bi].label, pred: LABELS[best] });
      }
    }

    const m = computeMetrics(rows);
    perCorpus.push({ name: corpus.name, ...m });
    allRows.push(...rows);
    console.log(`准确率: ${fmt(m.accuracy)} | Macro F1: ${fmt(m.macroF1)} | crisis 召回: ${fmt(m.crisisRecall)}`);
  }

  const overall = computeMetrics(allRows);
  console.log('\n\n════════ 汇总（外部语料合计） ════════');
  console.log(`样本数: ${overall.total}`);
  console.log(`Accuracy: ${fmt(overall.accuracy)}`);
  console.log(`Macro F1: ${fmt(overall.macroF1)}`);
  console.log(`crisis Recall: ${fmt(overall.crisisRecall)}（漏报 ${fmt(1 - overall.crisisRecall)}）`);
  console.log('\n各类别 P/R/F1:');
  for (const c of LABELS) {
    const m = overall.metrics[c];
    console.log(`  ${c.padEnd(10)} P=${fmt(m.precision)}  R=${fmt(m.recall)}  F1=${fmt(m.f1)}  (${m.support})`);
  }
  console.log('\n混淆矩阵（行=真实, 列=预测）:');
  console.log('            ' + LABELS.map((l) => l.padStart(10)).join(''));
  for (const t of LABELS) {
    console.log(t.padStart(12) + LABELS.map((p) => String(overall.confusion[t][p]).padStart(10)).join(''));
  }

  // 落盘
  const outDir = path.join(__dirname, '..', 'models', 'eval');
  fs.mkdirSync(outDir, { recursive: true });
  const out = {
    generatedAt: new Date().toISOString(),
    model: modelPath,
    note: '外部语料 + 关键词弱标注（噪声约 ±10-15%），解读为"模型与规则标签在分布外语料上的一致性"',
    overall: { ...overall, metrics: undefined, confusion: undefined, metricsDetail: overall.metrics, confusionMatrix: overall.confusion },
    perCorpus: perCorpus.map((c) => ({ name: c.name, accuracy: c.accuracy, macroF1: c.macroF1, crisisRecall: c.crisisRecall, total: c.total })),
  };
  const outPath = path.join(outDir, 'onnx-external-eval.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`\n结果已保存: ${outPath}`);
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
