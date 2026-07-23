"""
ONNX 模型测试集评估。

用法：
  python eval_onnx.py --model output/ensemble.quant.onnx
  python eval_onnx.py --model output/run1/best/model.onnx
"""

import argparse
import json
import numpy as np
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix
from transformers import BertTokenizer
import onnxruntime as ort

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
DEFAULT_TEST_PATH = DATA_DIR / "test_final.jsonl"
# 优先用本地 checkpoint 的 tokenizer（与训练一致，避免网络下载）
DEFAULT_TOKENIZER = SCRIPT_DIR / "output" / "remote_results" / "checkpoints" / "run1"
LABEL2ID = {'negative': 0, 'neutral': 1, 'positive': 2, 'crisis': 3}
ID2LABEL = {0: 'negative', 1: 'neutral', 2: 'positive', 3: 'crisis'}


def read_jsonl(path):
    samples = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))
    return samples


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=str, required=True, help='ONNX 模型路径')
    parser.add_argument('--test', type=str, default=str(DEFAULT_TEST_PATH), help='测试集 JSONL 路径')
    parser.add_argument('--tokenizer', type=str, default=str(DEFAULT_TOKENIZER),
                        help='tokenizer 路径（默认本地 checkpoint）')
    parser.add_argument('--max-length', type=int, default=128)
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        print(f"Model not found: {model_path}")
        return

    test_path = Path(args.test)
    if not test_path.exists():
        print(f"Test set not found: {test_path}")
        return

    print(f"Model: {model_path}")
    print(f"Test:  {test_path}")

    # Load ONNX
    session = ort.InferenceSession(str(model_path))
    input_names = [inp.name for inp in session.get_inputs()]
    output_names = [out.name for out in session.get_outputs()]
    print(f"Inputs: {input_names}, Outputs: {output_names}")

    # Load tokenizer
    tokenizer_path = Path(args.tokenizer)
    if tokenizer_path.exists():
        tokenizer = BertTokenizer.from_pretrained(str(tokenizer_path))
    else:
        # 回退到 bert-base-chinese（可能触发网络下载）
        print(f"[WARN] tokenizer path not found: {tokenizer_path}, "
              f"falling back to bert-base-chinese")
        tokenizer = BertTokenizer.from_pretrained("bert-base-chinese")

    # Load test data
    samples = read_jsonl(test_path)
    texts, labels = [], []
    for s in samples:
        l = s.get('label', 'neutral')
        if l not in LABEL2ID:
            continue
        t = s.get('text', '').strip()
        if len(t) < 4:
            continue
        texts.append(t[:512])
        labels.append(LABEL2ID[l])

    print(f"Test samples: {len(texts)}")

    # ── Run batch inference ─────────────────────────────────────
    all_preds = []
    batch_size = 256
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        encoding = tokenizer(
            batch_texts,
            max_length=args.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="np",
        )
        outputs = session.run(
            output_names,
            {
                "input_ids": encoding["input_ids"].astype(np.int64),
                "attention_mask": encoding["attention_mask"].astype(np.int64),
            },
        )
        logits = outputs[0]
        preds = np.argmax(logits, axis=1)
        all_preds.extend(preds.tolist())
        if (i // batch_size) % 5 == 0:
            print(f"  [{i}/{len(texts)}] ...")

    # Metrics
    target_names = [ID2LABEL[i] for i in range(4)]
    print("\nClassification Report:")
    print(classification_report(labels, all_preds, target_names=target_names, zero_division=0))

    cm = confusion_matrix(labels, all_preds)
    print("\nConfusion Matrix:")
    header = "".join(f"{n:>12}" for n in target_names)
    print(f"{'':>12}{header}")
    for i, row in enumerate(cm):
        print(f"{target_names[i]:>12}" + "".join(f"{v:>12}" for v in row))

    crisis_idx = LABEL2ID['crisis']
    crisis_total = sum(1 for l in labels if l == crisis_idx)
    crisis_correct = sum(1 for l, p in zip(labels, all_preds) if l == crisis_idx and p == crisis_idx)
    crisis_recall = crisis_correct / crisis_total if crisis_total > 0 else 0
    print(f"\nCrisis Recall: {crisis_recall*100:.1f}% ({crisis_correct}/{crisis_total})")
    print(f"Miss Rate: {(1-crisis_recall)*100:.1f}%")

    # Save report
    report = classification_report(labels, all_preds, target_names=target_names, zero_division=0, output_dict=True)
    result_path = model_path.with_suffix('.eval.json')
    with open(result_path, 'w') as f:
        json.dump({
            'model': str(model_path),
            'test_set': str(test_path),
            'samples': len(texts),
            'accuracy': report['accuracy'],
            'crisis_recall': crisis_recall,
            'report': report,
        }, f, indent=2, ensure_ascii=False)
    print(f"\nResults saved to: {result_path}")


if __name__ == '__main__':
    main()
