/**
 * External Validation Script — 外部人工验证抽样 + 一致率计算
 *
 * 目的：对 ONNX 情感模型做跨分布人工抽查（分层抽样 120 条）。
 * 数据源：数据集3（distill_psychology-10k-r1.json，R1 蒸馏心理对话），与训练集不同分布。
 *
 * 模式：
 *   默认（无参数）  ：分层抽样 120 条 → 产出
 *                     docs/external_validation/sample.csv（id,text,model_label）
 *                     docs/external_validation/label_sheet.csv（id,text,label,reviewer）
 *   --agreement     ：读回填后的 label_sheet.csv + sample.csv，
 *                     计算总体 + 各类别一致率，回写 docs/external_validation.md 占位表
 *   --sample N      ：指定抽样数量（默认 120）
 *   --help          ：帮助
 *
 * 运行：cd pc && node scripts/external_validation.cjs [--agreement] [--sample N]
 * 说明：model_label 用关键词层（L1）近似（与 eval-sentiment.cjs 一致），
 *       真实 ONNX 标签需在 Electron 主进程内跑（sentiment.eval.json 已有 97.57%）。
 */

const fs = require('fs');
const path = require('path');

// 与 eval-sentiment.cjs 一致的弱标注规则（避免两处漂移）
const POSITIVE_KW = ['开心', '快乐', '高兴', '满足', '感恩', '幸福', '希望', '期待', '喜欢', '享受', '放松', '平静', '充实', '成就感', '自信', '积极', '乐观', '欣慰', '喜悦', '温暖'];
const NEGATIVE_KW = ['难过', '悲伤', '抑郁', '焦虑', '压力', '崩溃', '绝望', '孤独', '失眠', '累', '烦', '愤怒', '恐惧', '害怕', '自卑', '无力', '迷茫', '低落', '痛苦', '自责', '内疚', '想哭', '崩溃', '压抑', '绝望', '想死', '自杀'];
const CRISIS_KW = ['想死', '自杀', '不想活', '结束生命', '活着没意义', '轻生', '了断'];

function weakLabel(text) {
  const lower = String(text || '');
  if (CRISIS_KW.some(k => lower.includes(k))) return 'crisis';
  if (NEGATIVE_KW.some(k => lower.includes(k))) return 'negative';
  if (POSITIVE_KW.some(k => lower.includes(k))) return 'positive';
  return 'neutral';
}

const OUT_DIR = path.join(__dirname, '..', '..', 'docs', 'external_validation');
const DATA_PATH = path.join(__dirname, '..', '..', '数据集3', 'distill_psychology-10k-r1.json');
const REPORT_PATH = path.join(__dirname, '..', '..', 'docs', 'external_validation.md');

// 分层配额（合计 120）
const QUOTAS = { negative: 36, neutral: 24, positive: 30, crisis: 30 };

/**
 * 从数据集3 读取样本（与 eval-sentiment.cjs 相同解析逻辑）
 * @returns {Array<{id:string, text:string, weak:string}>}
 */
function loadSamples() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`数据集3 不存在: ${DATA_PATH}`);
    console.error('请确认仓库根目录包含 数据集3/distill_psychology-10k-r1.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const samples = [];
  for (let i = 0; i < lines.length; i++) {
    let item;
    try {
      item = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    const input = item.input || item.conversation || '';
    if (typeof input !== 'string' || input.length < 10) continue;
    samples.push({ id: `ext_${String(samples.length + 1).padStart(4, '0')}`, text: input.slice(0, 500), weak: weakLabel(input) });
  }
  return samples;
}

/**
 * 分层抽样：按弱标签配额抽取
 */
function stratifiedSample(samples, quotas) {
  const buckets = { negative: [], neutral: [], positive: [], crisis: [] };
  for (const s of samples) {
    if (buckets[s.weak]) buckets[s.weak].push(s);
  }
  // 确定性抽样：固定种子洗牌（避免每次抽样结果漂移）
  const seededShuffle = (arr) => {
    const a = [...arr];
    let seed = 20260801;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const picked = [];
  for (const [cls, quota] of Object.entries(quotas)) {
    const pool = seededShuffle(buckets[cls] || []);
    const take = Math.min(quota, pool.length);
    picked.push(...pool.slice(0, take));
  }
  return picked;
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * 默认模式：生成 sample.csv + label_sheet.csv
 */
function generateSample(sampleN) {
  ensureOutDir();
  const samples = loadSamples();
  const quotas = { ...QUOTAS };
  const totalQuota = Object.values(quotas).reduce((a, b) => a + b, 0);
  if (sampleN !== totalQuota && sampleN > 0) {
    // 按比例缩放配额
    const scale = sampleN / totalQuota;
    for (const k of Object.keys(quotas)) {
      quotas[k] = Math.max(1, Math.round(quotas[k] * scale));
    }
    // 调整到恰好 sampleN
    let cur = Object.values(quotas).reduce((a, b) => a + b, 0);
    let delta = sampleN - cur;
    const keys = Object.keys(quotas);
    let idx = 0;
    while (delta !== 0 && idx < 1000) {
      quotas[keys[idx % keys.length]] += delta > 0 ? 1 : -1;
      if (quotas[keys[idx % keys.length]] < 1) quotas[keys[idx % keys.length]] = 1;
      cur = Object.values(quotas).reduce((a, b) => a + b, 0);
      delta = sampleN - cur;
      idx++;
    }
  }
  const picked = stratifiedSample(samples, quotas);

  // 配额不足提示（数据集3 crisis 样本极少，如实告知）
  const bucketCount = { negative: 0, neutral: 0, positive: 0, crisis: 0 };
  for (const s of samples) if (bucketCount[s.weak] !== undefined) bucketCount[s.weak]++;
  const shortfall = Object.keys(quotas).filter(k => bucketCount[k] < quotas[k]);
  if (shortfall.length > 0) {
    console.warn(`⚠️ 数据集中以下类别样本不足，按实际可抽数量抽样：${shortfall.join(', ')}`);
  }

  const sampleRows = ['id,text,model_label'];
  const labelRows = ['id,text,label,reviewer'];
  for (const s of picked) {
    sampleRows.push([s.id, csvEscape(s.text), s.weak].join(','));
    // label_sheet 不含模型标签，避免诱导评审
    labelRows.push([s.id, csvEscape(s.text), '', ''].join(','));
  }

  const samplePath = path.join(OUT_DIR, 'sample.csv');
  const labelPath = path.join(OUT_DIR, 'label_sheet.csv');
  fs.writeFileSync(samplePath, sampleRows.join('\n') + '\n', 'utf-8');
  fs.writeFileSync(labelPath, labelRows.join('\n') + '\n', 'utf-8');

  const dist = {};
  for (const s of picked) dist[s.weak] = (dist[s.weak] || 0) + 1;
  console.log('=== 外部验证抽样完成 ===');
  console.log(`样本总数: ${picked.length}`);
  console.log('类别分布:', JSON.stringify(dist));
  console.log(`\n输出:`);
  console.log(`  ${samplePath}`);
  console.log(`  ${labelPath}`);
  console.log('\n下一步：');
  console.log('  1. 评审人独立填写 label_sheet.csv 的 label / reviewer 列（不要参照 sample.csv）');
  console.log('  2. 运行 node scripts/external_validation.cjs --agreement 计算一致率');
}

function parseCsv(content) {
  const rows = [];
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return rows;
  const header = lines[0].split(',').map(h => h.trim());
  for (let i = 1; i < lines.length; i++) {
    // 简易 CSV 解析：处理带引号字段
    const line = lines[i];
    const fields = [];
    let cur = '';
    let inQuote = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (inQuote) {
        if (ch === '"') {
          if (line[j + 1] === '"') { cur += '"'; j++; }
          else inQuote = false;
        } else cur += ch;
      } else if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    const row = {};
    header.forEach((h, idx) => { row[h] = (fields[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

/**
 * --agreement 模式：计算一致率并回写 external_validation.md
 */
function computeAgreement() {
  const samplePath = path.join(OUT_DIR, 'sample.csv');
  const labelPath = path.join(OUT_DIR, 'label_sheet.csv');
  if (!fs.existsSync(samplePath) || !fs.existsSync(labelPath)) {
    console.error('缺少 sample.csv / label_sheet.csv，请先运行抽样模式');
    process.exit(1);
  }
  const sampleRows = parseCsv(fs.readFileSync(samplePath, 'utf-8'));
  const labelRows = parseCsv(fs.readFileSync(labelPath, 'utf-8'));

  const modelMap = {};
  for (const r of sampleRows) modelMap[r.id] = r.model_label;

  const byClass = { negative: { n: 0, agree: 0 }, neutral: { n: 0, agree: 0 }, positive: { n: 0, agree: 0 }, crisis: { n: 0, agree: 0 } };
  const disagreements = [];
  let reviewed = 0;
  let totalAgree = 0;

  for (const r of labelRows) {
    const modelLabel = modelMap[r.id];
    const humanLabel = r.label ? r.label.trim().toLowerCase() : '';
    if (!humanLabel) continue; // 未评审
    if (!modelLabel) continue;
    reviewed++;
    const cls = byClass[modelLabel] ? modelLabel : 'neutral';
    byClass[cls].n++;
    if (humanLabel === modelLabel) {
      byClass[cls].agree++;
      totalAgree++;
    } else {
      disagreements.push({ id: r.id, text: r.text.slice(0, 80), model: modelLabel, human: humanLabel });
    }
  }

  if (reviewed === 0) {
    console.error('label_sheet.csv 中没有已填写的 label，请先让评审人填写');
    process.exit(1);
  }

  const overall = (totalAgree / reviewed * 100).toFixed(1);
  console.log('=== 外部验证一致率 ===');
  console.log(`已评审: ${reviewed}/${sampleRows.length}`);
  console.log(`总体一致率: ${overall}%`);
  const lines = ['| 类别 | 样本数 | 评审一致数 | 一致率 |', '|---|---|---|---|'];
  for (const cls of ['negative', 'neutral', 'positive', 'crisis']) {
    const c = byClass[cls];
    const rate = c.n > 0 ? (c.agree / c.n * 100).toFixed(1) + '%' : '—';
    lines.push(`| ${cls} | ${c.n} | ${c.agree} | ${rate} |`);
  }
  lines.push(`| **总体** | **${reviewed}** | **${totalAgree}** | **${overall}%** |`);

  // 回写 external_validation.md
  if (fs.existsSync(REPORT_PATH)) {
    let md = fs.readFileSync(REPORT_PATH, 'utf-8');
    const tableStart = md.indexOf('| 类别 | 样本数 | 评审一致数 | 一致率 |');
    const tableEnd = md.indexOf('\n\n', tableStart);
    if (tableStart >= 0) {
      const newTable = lines.join('\n');
      md = md.slice(0, tableStart) + newTable + (tableEnd >= 0 ? md.slice(tableEnd) : '');
      // 追加不一致示例
      const disStart = md.indexOf('## 3. 不一致示例（占位）');
      if (disStart >= 0) {
        const disLines = ['## 3. 不一致示例', '', '| # | 文本（脱敏） | 模型标签 | 评审标签 | 说明 |', '|---|---|---|---|---|'];
        disagreements.slice(0, 10).forEach((d, i) => {
          disLines.push(`| ${i + 1} | ${d.text}… | ${d.model} | ${d.human} | — |`);
        });
        if (disagreements.length === 0) disLines.push('| — | 无不一致样本 | — | — | — |');
        const disEnd = md.indexOf('\n\n## 4.', disStart);
        md = md.slice(0, disStart) + disLines.join('\n') + (disEnd >= 0 ? md.slice(disEnd) : '');
      }
      fs.writeFileSync(REPORT_PATH, md, 'utf-8');
      console.log(`已回写报告: ${REPORT_PATH}`);
    } else {
      console.log('报告占位表未找到，跳过回写（人工粘贴以下结果）：');
      console.log(lines.join('\n'));
    }
  }

  if (disagreements.length > 0) {
    console.log(`\n不一致样本 ${disagreements.length} 条（前 5 条）：`);
    disagreements.slice(0, 5).forEach(d => {
      console.log(`  [${d.id}] model=${d.model} human=${d.human} :: ${d.text}`);
    });
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`用法:
  node scripts/external_validation.cjs                 # 分层抽样 120 条
  node scripts/external_validation.cjs --sample 60     # 抽样 60 条
  node scripts/external_validation.cjs --agreement     # 计算一致率并回写报告
  node scripts/external_validation.cjs --help`);
    return;
  }
  if (args.includes('--agreement')) {
    computeAgreement();
    return;
  }
  const sampleIdx = args.indexOf('--sample');
  const sampleN = sampleIdx >= 0 && args[sampleIdx + 1] ? parseInt(args[sampleIdx + 1], 10) : 120;
  generateSample(Number.isFinite(sampleN) && sampleN > 0 ? sampleN : 120);
}

main();
