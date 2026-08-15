"""
下载公开中文情感/心理健康语料，补充训练数据。

数据源（均可商用，MIT/Apache/CC-BY）：
  1. ChnSentiCorp - 餐厅/书评情感语料（正负面均衡，HuggingFace）
  2. NLPCC 情感语料 - 中文情感分类
  3. SMP2020 情感分析数据集

输出：pc/scripts/train_sentiment/data/labeled_public.jsonl

注意：如网络不通或数据源失效，脚本会跳过并报告，不阻断流程。
"""

import json
import os
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
OUTPUT_PATH = DATA_DIR / "labeled_public.jsonl"

# 公开数据源（GitHub raw / HuggingFace raw，均可商用）
PUBLIC_SOURCES = [
    {
        'name': 'ChnSentiCorp-hotel',
        'url': 'https://raw.githubusercontent.com/SophonPlus/ChineseNlpCorpus/master/datasets/ChnSentiCorp_htl_all/ChnSentiCorp_htl_all.csv',
        'format': 'csv',
        'label_map': {'1': 'positive', '0': 'negative'},
    },
    {
        'name': 'online_shopping',
        'url': 'https://raw.githubusercontent.com/SophonPlus/ChineseNlpCorpus/master/datasets/online_shopping_10_cats/online_shopping_10_cats.csv',
        'format': 'csv',
        'label_map': {'1': 'positive', '0': 'negative'},
    },
]


def download(url, timeout=30):
    """下载内容，失败返回 None"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"  下载失败: {e}")
        return None


def parse_csv_simple(csv_text, label_map):
    """简易 CSV 解析（处理中文逗号转义）"""
    import csv
    import io
    samples = []
    reader = csv.reader(io.StringIO(csv_text))
    header = next(reader, None)
    if not header:
        return samples
    # 找 label 和 text 列
    label_col = None
    text_col = None
    for i, h in enumerate(header):
        h_lower = h.strip().lower()
        if h_lower in ('label', 'sentiment', 'cat'):
            label_col = i
        if h_lower in ('review', 'text', 'content'):
            text_col = i
    if label_col is None or text_col is None:
        # 默认最后一列是 label，第一列是 text
        text_col = 0
        label_col = len(header) - 1

    for row in reader:
        if len(row) <= max(label_col, text_col):
            continue
        label_raw = row[label_col].strip()
        text = row[text_col].strip()
        label = label_map.get(label_raw)
        if label and len(text) >= 10:
            samples.append({'text': text[:500], 'label': label, 'source': 'public'})
    return samples


def main():
    print("=" * 60)
    print("下载公开中文情感语料")
    print("=" * 60)

    all_samples = []

    for src in PUBLIC_SOURCES:
        print(f"\n[{src['name']}] 下载中...")
        content = download(src['url'])
        if not content:
            continue
        print(f"  下载 {len(content)} 字节，解析中...")
        if src['format'] == 'csv':
            samples = parse_csv_simple(content, src['label_map'])
        else:
            samples = []
        print(f"  解析样本: {len(samples)}")
        # 限制每个源最多 5000 条，避免单一源主导
        all_samples.extend(samples[:5000])

    # 标签分布
    dist = {}
    for s in all_samples:
        dist[s['label']] = dist.get(s['label'], 0) + 1

    print(f"\n总样本数: {len(all_samples)}")
    print("标签分布:")
    for label in ['positive', 'neutral', 'negative', 'crisis']:
        count = dist.get(label, 0)
        print(f"  {label:10s}: {count:6d}")

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        for s in all_samples:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')

    print(f"\n已写入: {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
