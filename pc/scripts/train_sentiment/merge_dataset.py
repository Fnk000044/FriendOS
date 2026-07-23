"""
合并 D1(labeled_all) + D2(labeled_public) + D3(labeled_augmented)，
对多数类欠采样、少数类保留全部，使4类相对均衡，最终输出 3万+条训练集。

输出：
  pc/scripts/train_sentiment/data/train_final.jsonl  （训练集 80%）
  pc/scripts/train_sentiment/data/test_final.jsonl   （测试集 20%）
"""

import json
import random
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"

SOURCES = [
    DATA_DIR / "labeled_all.jsonl",
    DATA_DIR / "labeled_public.jsonl",
    DATA_DIR / "labeled_augmented.jsonl",
]

TRAIN_PATH = DATA_DIR / "train_final.jsonl"
TEST_PATH = DATA_DIR / "test_final.jsonl"

# 各类目标样本数（多数类欠采样到此数量）
TARGET_PER_CLASS = {
    'positive': 8000,
    'neutral': 8000,
    'negative': 8000,
    'crisis': 8000,
}

TEST_RATIO = 0.2
random.seed(42)


def read_jsonl(path):
    samples = []
    if not path.exists():
        return samples
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    samples.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return samples


def main():
    print("=" * 60)
    print("数据合并与均衡")
    print("=" * 60)

    # 读取所有来源
    all_samples = []
    for src in SOURCES:
        samples = read_jsonl(src)
        print(f"读取 {src.name}: {len(samples)}")
        all_samples.extend(samples)

    print(f"合并总数: {len(all_samples)}")

    # 去重（按 text）
    seen = set()
    unique = []
    for s in all_samples:
        key = s['text']
        if key not in seen:
            seen.add(key)
            unique.append(s)
    print(f"去重后: {len(unique)}")

    # 按标签分组
    by_label = {'positive': [], 'neutral': [], 'negative': [], 'crisis': []}
    for s in unique:
        if s['label'] in by_label:
            by_label[s['label']].append(s)

    print("\n各类原始数量:")
    for label in ['positive', 'neutral', 'negative', 'crisis']:
        print(f"  {label:10s}: {len(by_label[label])}")

    # 均衡：多数类欠采样，少数类全保留
    balanced = []
    for label, samples in by_label.items():
        target = TARGET_PER_CLASS[label]
        if len(samples) > target:
            # 欠采样：随机选 target 条
            sampled = random.sample(samples, target)
        else:
            sampled = samples
        balanced.extend(sampled)
        print(f"  {label:10s}: 采样后 {len(sampled)}")

    # 打乱
    random.shuffle(balanced)

    # 划分训练/测试
    n_test = int(len(balanced) * TEST_RATIO)
    test_set = balanced[:n_test]
    train_set = balanced[n_test:]

    # 统计
    print(f"\n训练集: {len(train_set)}")
    train_dist = {}
    for s in train_set:
        train_dist[s['label']] = train_dist.get(s['label'], 0) + 1
    for label in ['positive', 'neutral', 'negative', 'crisis']:
        print(f"  {label:10s}: {train_dist.get(label, 0)}")

    print(f"\n测试集: {len(test_set)}")
    test_dist = {}
    for s in test_set:
        test_dist[s['label']] = test_dist.get(s['label'], 0) + 1
    for label in ['positive', 'neutral', 'negative', 'crisis']:
        print(f"  {label:10s}: {test_dist.get(label, 0)}")

    # 写入
    with open(TRAIN_PATH, 'w', encoding='utf-8') as f:
        for s in train_set:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')

    with open(TEST_PATH, 'w', encoding='utf-8') as f:
        for s in test_set:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')

    print(f"\n已写入:")
    print(f"  训练集: {TRAIN_PATH} ({TRAIN_PATH.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"  测试集: {TEST_PATH} ({TEST_PATH.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == '__main__':
    main()
