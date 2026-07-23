"""
FriendOS 训练数据构建脚本
统一解析项目内三个心理学数据集，提取 {text, label} 标注样本。

标签体系（4分类）：
  positive  - 积极/正向情绪
  neutral   - 中性/无明显情绪
  negative  - 负面情绪（焦虑/抑郁/压力等，但无自杀意念）
  crisis    - 危机（自杀意念/自伤/绝望等）

数据源：
  数据集1 PsyDTCorpus (SoulChat2.0) - 心理咨询对话
  数据集2 catch_mdpcot (SoulChat-R1) - 咨询CoT
  数据集3 distill_psychology-10k-r1 - R1蒸馏单轮陈述

输出：pc/scripts/train_sentiment/data/labeled_all.jsonl
"""

import json
import os
import re
from pathlib import Path

# ── 路径配置 ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent  # E:\FriendOS
DS1_DIR = PROJECT_ROOT / "数据集1" / "PsyDTCorpus"
DS2_PATH = PROJECT_ROOT / "数据集2" / "catch_mdpcot.json"
DS3_PATH = PROJECT_ROOT / "数据集3" / "distill_psychology-10k-r1.json"

OUTPUT_PATH = DATA_DIR / "labeled_all.jsonl"

# ── 关键词词表（用于弱标注，R1 reasoning 解析为主）──────────────

POSITIVE_KW = [
    '开心', '快乐', '高兴', '满足', '感恩', '幸福', '希望', '期待', '喜欢', '享受',
    '放松', '平静', '充实', '成就感', '自信', '积极', '乐观', '欣慰', '喜悦', '温暖',
    '踏实', '安心', '愉快', '舒心', '开怀', '兴奋', '骄傲', '被理解', '被支持', '进步',
    '好转', '改善', '力量', '勇气', '成长', '收获', '顺利', '圆满', '美好', '阳光',
]

NEGATIVE_KW = [
    '难过', '悲伤', '抑郁', '焦虑', '压力', '崩溃', '孤独', '失眠', '累', '烦',
    '愤怒', '恐惧', '害怕', '自卑', '无力', '迷茫', '低落', '痛苦', '自责', '内疚',
    '想哭', '压抑', '绝望', '烦躁', '紧张', '担心', '不安', '失落', '挫败', '委屈',
    '尴尬', '羞耻', '后悔', '遗憾', '厌倦', '疲惫', '消沉', '沮丧', '忧愁', '惆怅',
    '空虚', '无助', '被忽视', '被孤立', '被欺负', '压力大', '喘不过气', '撑不住',
]

CRISIS_KW = [
    '想死', '自杀', '不想活', '结束生命', '活着没意义', '轻生', '了断', '解脱',
    '消失', '离开这个世界', '伤害自己', '割腕', '跳楼', '吃药死', '安眠药',
    '没有希望', '撑不下去', '活不下去', '不如死', '想消失', '了结', '自残',
    '不想存在', '世界没有我会更好', '走了就解脱了',
]

# 否定/排除（误报过滤）
EXCLUSIONS = [
    '九死一生', '累死了', '想死的心都有', '想死我了', '死定了', '吓死', '笑死',
    '开心死', '高兴死', '累死我了', '困死', '饿死', '忙死', '气死', '烦死',
]

# 程度副词（用于 R1 reasoning 强度判断）
INTENSITY_HIGH = ['极度', '非常严重', '完全', '彻底', '强烈', '严重', '崩溃', '绝望']
INTENSITY_MID = ['比较', '有些', '有点', '稍微', '略微', '相当']


def is_excluded(text):
    """检查是否命中误报排除词"""
    return any(ex in text for ex in EXCLUSIONS)


def label_by_keywords(text):
    """基于关键词的弱标注（兜底）"""
    if not text or len(text) < 4:
        return None
    if is_excluded(text):
        return None
    if any(k in text for k in CRISIS_KW):
        return 'crisis'
    neg_count = sum(1 for k in NEGATIVE_KW if k in text)
    pos_count = sum(1 for k in POSITIVE_KW if k in text)
    if neg_count > pos_count and neg_count >= 1:
        return 'negative'
    if pos_count > neg_count and pos_count >= 1:
        return 'positive'
    if neg_count == 0 and pos_count == 0:
        return 'neutral'
    return None


def label_from_r1_reasoning(input_text, reasoning_text):
    """
    从 R1 reasoning_content 解析标签。
    R1 推理文本常含"用户提到焦虑""工作压力导致失眠"等显式情绪归因，
    比纯关键词弱标注更可靠（相当于蒸馏标注）。
    """
    combined = (input_text or '') + ' ' + (reasoning_text or '')
    if not combined.strip():
        return None
    if is_excluded(combined):
        return None

    # 危机优先判定
    if any(k in combined for k in CRISIS_KW):
        return 'crisis'

    # R1 reasoning 中情绪归因句式匹配
    neg_hits = sum(1 for k in NEGATIVE_KW if k in combined)
    pos_hits = sum(1 for k in POSITIVE_KW if k in combined)

    if neg_hits > pos_hits and neg_hits >= 1:
        return 'negative'
    if pos_hits > neg_hits and pos_hits >= 1:
        return 'positive'
    # R1 reasoning 提到情绪但无明显极性 → neutral
    if neg_hits == 0 and pos_hits == 0:
        return 'neutral'
    return None


def extract_user_messages_ds1(filepath):
    """数据集1 PsyDTCorpus：从 messages 提取 user 消息"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    texts = []
    for item in data:
        messages = item.get('messages', [])
        for msg in messages:
            if msg.get('role') in ('user', 'human'):
                content = msg.get('content', '').strip()
                if len(content) >= 8:
                    texts.append(content)
    return texts


def extract_instructions_ds2(filepath):
    """数据集2 catch_mdpcot：取 instruction（来访者发言）"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    texts = []
    for item in data:
        # instruction 是当前轮来访者发言
        inst = item.get('instruction', '').strip()
        if len(inst) >= 8:
            texts.append(inst)
        # history 中的来访者发言
        history = item.get('history', [])
        if isinstance(history, list):
            for pair in history:
                if isinstance(pair, list) and len(pair) >= 1:
                    user_msg = pair[0]
                    if isinstance(user_msg, str) and len(user_msg) >= 8:
                        texts.append(user_msg)
    return texts


def extract_ds3(filepath):
    """数据集3 R1蒸馏：提取 input + reasoning_content"""
    samples = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            input_text = item.get('input', '').strip()
            reasoning = item.get('reasoning_content', '').strip()
            if len(input_text) >= 8:
                samples.append({'text': input_text, 'reasoning': reasoning})
    return samples


def process_dataset1():
    """处理数据集1"""
    results = []
    # 优先用 test 单轮分割（更干净）
    test_path = DS1_DIR / "PsyDTCorpus_test_single_turn_split.json"
    train_path = DS1_DIR / "PsyDTCorpus_train_mulit_turn_packing.json"

    for fp in [test_path, train_path]:
        if not fp.exists():
            continue
        texts = extract_user_messages_ds1(fp)
        for text in texts:
            text = text[:500]  # 截断长文本
            label = label_by_keywords(text)
            if label:
                results.append({'text': text, 'label': label, 'source': 'ds1_soulchat'})
    return results


def process_dataset2():
    """处理数据集2"""
    results = []
    if not DS2_PATH.exists():
        return results
    texts = extract_instructions_ds2(DS2_PATH)
    for text in texts:
        text = text[:500]
        label = label_by_keywords(text)
        if label:
            results.append({'text': text, 'label': label, 'source': 'ds2_catch'})
    return results


def process_dataset3():
    """处理数据集3（主力，用 R1 reasoning 标注）"""
    results = []
    if not DS3_PATH.exists():
        return results
    samples = extract_ds3(DS3_PATH)
    for s in samples:
        text = s['text'][:500]
        # 优先用 R1 reasoning 标注
        label = label_from_r1_reasoning(text, s['reasoning'])
        if not label:
            # 兜底用关键词
            label = label_by_keywords(text)
        if label:
            results.append({'text': text, 'label': label, 'source': 'ds3_r1'})
    return results


def main():
    print("=" * 60)
    print("FriendOS 训练数据构建（三数据集合并解析）")
    print("=" * 60)

    all_samples = []

    print("\n[1/3] 解析数据集1 (SoulChat2.0)...")
    ds1 = process_dataset1()
    print(f"  提取样本: {len(ds1)}")
    all_samples.extend(ds1)

    print("\n[2/3] 解析数据集2 (catch_mdpcot)...")
    ds2 = process_dataset2()
    print(f"  提取样本: {len(ds2)}")
    all_samples.extend(ds2)

    print("\n[3/3] 解析数据集3 (R1蒸馏，主力)...")
    ds3 = process_dataset3()
    print(f"  提取样本: {len(ds3)}")
    all_samples.extend(ds3)

    # 标签分布统计
    dist = {}
    for s in all_samples:
        dist[s['label']] = dist.get(s['label'], 0) + 1

    print(f"\n总样本数: {len(all_samples)}")
    print("标签分布:")
    for label in ['positive', 'neutral', 'negative', 'crisis']:
        count = dist.get(label, 0)
        pct = count / len(all_samples) * 100 if all_samples else 0
        print(f"  {label:10s}: {count:6d} ({pct:5.1f}%)")

    # 写入 JSONL
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        for s in all_samples:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')

    print(f"\n已写入: {OUTPUT_PATH}")
    print(f"文件大小: {OUTPUT_PATH.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == '__main__':
    main()
