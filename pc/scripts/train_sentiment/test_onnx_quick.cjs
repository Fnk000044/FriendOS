// 快速验证 ONNX 模型加载 + 推理（临时验证脚本，验证后可删）
const path = require('path');
const FS = require('fs');
const ort = require(path.join(process.cwd(), 'node_modules/onnxruntime-node'));

async function main() {
  const modelPath = path.join(process.cwd(), 'models/sentiment/sentiment.onnx');
  console.log('model exists:', FS.existsSync(modelPath));

  const session = await ort.InferenceSession.create(modelPath);
  console.log('session inputs:', session.inputNames);
  console.log('session outputs:', session.outputNames);

  const vocabPath = path.join(process.cwd(), 'models/sentiment/vocab.json');
  const vocab = JSON.parse(FS.readFileSync(vocabPath, 'utf8'));
  console.log('vocab size:', Object.keys(vocab).length);

  const texts = ['我真的撑不下去了，想死', '今天天气不错，心情很好', '最近压力有点大，有点焦虑', '笑死我了这个梗太好笑了'];

  for (const text of texts) {
    const chars = ['[CLS]', ...text.split(''), '[SEP]'];
    const inputIds = chars.map(c => vocab[c] ?? 100).slice(0, 128);
    const attentionMask = inputIds.map(() => 1);
    while (inputIds.length < 128) { inputIds.push(0); attentionMask.push(0); }

    const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, 128]);
    const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMask.map(BigInt)), [1, 128]);

    const results = await session.run({ input_ids: inputIdsTensor, attention_mask: attentionMaskTensor });
    const outKey = Object.keys(results)[0];
    const t = results[outKey];
    const data = Array.from(t.data);
    const max = Math.max(...data);
    const exps = data.map(x => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(x => (x / sum).toFixed(3));
    const labels = ['negative', 'neutral', 'positive', 'crisis'];
    const idx = data.indexOf(max);
    console.log(`[${text}] -> ${labels[idx]} (idx=${idx}) probs=${JSON.stringify(probs)}`);
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
