"""
合并全量数据：去重后保留全部样本（不做欠采样），按 90/10 分层抽样切分训练/验证。
输出：
  data/train_full.jsonl  （~105k 条）
  data/val_full.jsonl    （~12k 条）
  已有的 data/test_final.jsonl（6050 条）保持不变，作为最终测试集

新增功能：
  - Stratified split（确保 crisis 等少数类在验证集中比例一致）
  - BERT token 长度分布统计（验证 max_length=128 覆盖率）
"""

import json
from pathlib import Path
from collections import Counter

import numpy as np
from sklearn.model_selection import train_test_split
from transformers import BertTokenizer

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"

SOURCES = [
    DATA_DIR / "labeled_all.jsonl",
    DATA_DIR / "labeled_public.jsonl",
    DATA_DIR / "labeled_augmented.jsonl",
]

TRAIN_OUT = DATA_DIR / "train_full.jsonl"
VAL_OUT = DATA_DIR / "val_full.jsonl"
VAL_RATIO = 0.1


def read_jsonl(path):
    samples = []
    if not path.exists():
        print(f"  [跳过] {path.name} 不存在")
        return samples
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    samples.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    print(f"  读取 {path.name}: {len(samples)} 条")
    return samples


def main():
    print("=" * 60)
    print("全量数据合并（保留全部，不做欠采样）")
    print("=" * 60)

    all_samples = []
    for src in SOURCES:
        all_samples.extend(read_jsonl(src))

    print(f"\n合并总数: {len(all_samples)}")

    # 去重
    seen = set()
    unique = []
    for s in all_samples:
        key = s['text']
        if key not in seen:
            seen.add(key)
            unique.append(s)
    print(f"去重后: {len(unique)}")

    # 标签分布
    dist = {}
    for s in unique:
        dist[s['label']] = dist.get(s['label'], 0) + 1
    print("\n全量标签分布:")
    total = len(unique)
    for label in ['positive', 'neutral', 'negative', 'crisis']:
        count = dist.get(label, 0)
        print(f"  {label:10s}: {count:7d} ({count/total*100:5.1f}%)")

    # ── Token 长度分析（验证 max_length=128 的合理性） ──────────
    print("\nToken length analysis (BERT tokenizer):")
    tokenizer = BertTokenizer.from_pretrained("bert-base-chinese")
    all_texts = [s['text'] for s in unique]
    lengths = [len(tokenizer(t, truncation=False)['input_ids']) for t in all_texts]
    lengths_arr = np.array(lengths)
    pct_below_128 = (lengths_arr <= 128).mean() * 100
    print(f"  Mean:   {lengths_arr.mean():.1f}")
    print(f"  Median: {np.median(lengths_arr):.1f}")
    print(f"  P90:    {np.percentile(lengths_arr, 90):.0f}")
    print(f"  P95:    {np.percentile(lengths_arr, 95):.0f}")
    print(f"  P99:    {np.percentile(lengths_arr, 99):.0f}")
    print(f"  Max:    {lengths_arr.max():.0f}")
    print(f"  ≤128:   {pct_below_128:.1f}%")

    # ── 分层抽样 90/10 切分 ──────────────────────────────────────
    labels = [s['label'] for s in unique]
    train_set, val_set = train_test_split(
        unique,
        test_size=VAL_RATIO,
        random_state=42,
        stratify=labels,
    )
    print(f"\n训练集: {len(train_set)} | 验证集: {len(val_set)}")

    # 验证分层后的分布
    train_dist = Counter(s['label'] for s in train_set)
    val_dist = Counter(s['label'] for s in val_set)
    print("训练集分布:", dict(train_dist))
    print("验证集分布:", dict(val_dist))

    # 写入
    with open(TRAIN_OUT, 'w', encoding='utf-8') as f:
        for s in train_set:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')
    with open(VAL_OUT, 'w', encoding='utf-8') as f:
        for s in val_set:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')

    print(f"\n已写入:")
    print(f"  训练集: {TRAIN_OUT} ({TRAIN_OUT.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"  验证集: {VAL_OUT} ({VAL_OUT.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == '__main__':
    main()
