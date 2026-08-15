"""
合成扩充训练样本，重点扩充 crisis（危机）类（原数据中仅 1% 稀疏）。

扩充策略：
  1. 人称变换（我→他/她/朋友）
  2. 程度修饰词增减（焦虑→有点焦虑/非常焦虑/极度焦虑）
  3. 场景替换（工作压力→考试压力/人际压力/经济压力）
  4. 句式变换（陈述→反问/感叹）
  5. 粤语转换（好难过→好唔开心/好辛苦）——同时补充湾区数据

目标：crisis 类扩充到 3000+，其余类按需补充，使4类相对均衡。
"""

import json
import random
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
INPUT_PATH = DATA_DIR / "labeled_all.jsonl"
OUTPUT_PATH = DATA_DIR / "labeled_augmented.jsonl"

random.seed(42)

# ── 扩充模板 ──────────────────────────────────────────────────

# 人称变换映射
PERSON_MAP = {
    '我': ['我', '他', '她', '我朋友', '我同学', '我室友', '我孩子', '我学生'],
}

# 程度修饰词
INTENSITY_PREFIX = {
    'negative': ['最近', '一直', '总是', '经常', '总是感觉', '最近老是', '不知道为什么'],
    'crisis': ['真的', '已经', '彻底', '完全', '真的已经', '实在'],
}

# 场景替换（丰富上下文）
SCENE_PREFIX = [
    '因为考试,', '最近工作,', '和室友吵架后,', '分手之后,',
    '考研压力下,', '毕业季,', '失眠好几天了,', '一个人在外地,',
    '家里出事后,', '被孤立之后,', '成绩出来后,', '面试失败后,',
]

# 句式变换后缀
SUFFIXES = ['', '...怎么办', '，好累', '，撑不住了', '，不知道怎么办',
            '，谁能帮帮我', '，真的好难', '，我快崩溃了']

# 粤语转换（湾区本地化）
CANTONESE_MAP = {
    '难过': ['难过', '唔开心', '好辛苦', '好辛苦啊'],
    '焦虑': ['焦虑', '好焦虑', '心噗噗跳'],
    '累': ['累', '好攰', '攰到死'],
    '烦': ['烦', '好烦', '烦死'],
    '压力大': ['压力大', '压力好大', '顶唔顺'],
    '崩溃': ['崩溃', '撑唔住', '顶唔顺'],
    '想死': ['想死', '想消失', '唔想活'],
    '孤独': ['孤独', '好孤单', '得我一个人'],
    '害怕': ['害怕', '好惊', '惊到死'],
    '绝望': ['绝望', '无希望', '完全无希望'],
}

# crisis 类模板（直接生成危机表达，弥补稀疏）
CRISIS_TEMPLATES = [
    '我真的想结束这一切，活着太痛苦了',
    '最近一直在想，如果我消失了会不会更好',
    '活着没有意义，每天都是煎熬',
    '我已经准备好离开了，这个世界不需要我',
    '想死的心越来越强，撑不下去了',
    '有时候站在窗边想跳下去，但又害怕',
    '安眠药吃了一片又一片，想就这么睡过去',
    '割腕的冲动越来越强，控制不住自己',
    '真的不想活了，所有的希望都破灭了',
    '了断的念头挥之不去，每天都在挣扎',
    '我觉得世界没有我会更好',
    '已经写好遗书了，准备走了',
    '活着比死还难受，不如解脱',
    '好想消失，不想让任何人找到我',
    '每次照镜子都想伤害自己',
    '我配不上活着，对不起所有人',
    '实在撑不住了，想用某种方式结束痛苦',
    '死可能是我唯一的出路了',
    '每天都在想怎么离开这个世界',
    '真的累了，不想再撑了，想结束一切',
]

# negative 类模板
NEGATIVE_TEMPLATES = [
    '最近压力好大，喘不过气来',
    '感觉自己什么都做不好，很自卑',
    '连续失眠一周了，白天没精神',
    '和父母吵架了，心里很难受',
    '考试考砸了，觉得自己很失败',
    '朋友圈越来越小，感到很孤独',
    '工作做不完，焦虑到睡不着',
    '被同学孤立了，每天都很压抑',
    '失恋了，心里空落落的',
    '看不到未来，很迷茫',
]


def read_jsonl(path):
    samples = []
    if not path.exists():
        return samples
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))
    return samples


def cantonese_transform(text):
    """粤语转换：替换关键词为粤语表达"""
    variants = [text]
    for kw, cantonese_variants in CANTONESE_MAP.items():
        if kw in text:
            for cv in cantonese_variants[1:]:  # 跳过原词
                variants.append(text.replace(kw, cv))
    return variants


def person_transform(text):
    """人称变换"""
    variants = []
    for src, targets in PERSON_MAP.items():
        if src in text:
            for tgt in targets[1:]:  # 跳过原词
                variants.append(text.replace(src, tgt, 1))
    return variants


def intensity_transform(text, label):
    """程度修饰词增减"""
    variants = []
    prefixes = INTENSITY_PREFIX.get(label, [])
    for prefix in prefixes:
        variants.append(f'{prefix}{text}')
    return variants


def scene_transform(text):
    """场景前缀变换"""
    variants = []
    for scene in SCENE_PREFIX[:4]:  # 限制数量
        variants.append(f'{scene}{text}')
    return variants


def suffix_transform(text):
    """句式后缀变换"""
    variants = []
    for suffix in SUFFIXES[:4]:
        if suffix:
            variants.append(f'{text}{suffix}')
    return variants


def augment_sample(sample, max_variants=3):
    """对单个样本生成扩充变体"""
    text = sample['text']
    label = sample['label']
    variants = set()

    # 粤语转换（最重要，湾区本地化）
    for v in cantonese_transform(text):
        if v != text:
            variants.add(v)

    # 程度修饰
    for v in intensity_transform(text, label):
        variants.add(v)

    # 场景前缀
    for v in scene_transform(text):
        variants.add(v)

    # 随机采样
    result = []
    for v in random.sample(list(variants), min(max_variants, len(variants))):
        result.append({'text': v[:500], 'label': label, 'source': 'augmented'})
    return result


def generate_crisis_templates(n=3000):
    """直接生成 crisis 模板样本（弥补原数据稀疏）"""
    samples = []
    templates = CRISIS_TEMPLATES * (n // len(CRISIS_TEMPLATES) + 1)
    random.shuffle(templates)
    for i, t in enumerate(templates[:n]):
        # 变换：加场景前缀 + 粤语转换
        variants = [t]
        for scene in SCENE_PREFIX[:2]:
            variants.append(f'{scene}{t}')
        for v in cantonese_transform(t):
            if v != t:
                variants.append(v)
        samples.append({
            'text': random.choice(variants)[:500],
            'label': 'crisis',
            'source': 'augmented_crisis',
        })
    return samples


def generate_negative_templates(n=2000):
    """补充 negative 模板"""
    samples = []
    templates = NEGATIVE_TEMPLATES * (n // len(NEGATIVE_TEMPLATES) + 1)
    random.shuffle(templates)
    for t in templates[:n]:
        variants = [t]
        for v in cantonese_transform(t):
            if v != t:
                variants.append(v)
        for scene in SCENE_PREFIX[:2]:
            variants.append(f'{scene}{t}')
        samples.append({
            'text': random.choice(variants)[:500],
            'label': 'negative',
            'source': 'augmented_negative',
        })
    return samples


def main():
    print("=" * 60)
    print("合成扩充训练样本")
    print("=" * 60)

    base_samples = read_jsonl(INPUT_PATH)
    print(f"读取基础样本: {len(base_samples)}")

    # 按标签分组
    by_label = {'positive': [], 'neutral': [], 'negative': [], 'crisis': []}
    for s in base_samples:
        if s['label'] in by_label:
            by_label[s['label']].append(s)

    all_augmented = []

    # 1. 对现有 crisis 样本做扩充变换（每人 3 变体）
    print("\n[1/4] 扩充 crisis 变体...")
    crisis_base = by_label['crisis']
    for s in crisis_base:
        all_augmented.extend(augment_sample(s, max_variants=3))
    print(f"  生成: {len(all_augmented)}")

    # 2. 直接生成 crisis 模板（弥补稀疏）
    print("[2/4] 生成 crisis 模板...")
    crisis_gen = generate_crisis_templates(3000)
    all_augmented.extend(crisis_gen)
    print(f"  生成: {len(crisis_gen)}")

    # 3. 对现有 negative 样本扩充（随机采样 3000 条做变换）
    print("[3/4] 扩充 negative 变体...")
    neg_sample = random.sample(by_label['negative'], min(3000, len(by_label['negative'])))
    neg_aug = []
    for s in neg_sample:
        neg_aug.extend(augment_sample(s, max_variants=2))
    neg_gen = generate_negative_templates(2000)
    all_augmented.extend(neg_aug)
    all_augmented.extend(neg_gen)
    print(f"  生成: {len(neg_aug) + len(neg_gen)}")

    # 4. 粤语转换扩充（从所有类抽样）
    print("[4/4] 粤语转换扩充...")
    cantonese_aug = []
    sample_pool = (by_label['negative'][:1000] + by_label['crisis'][:500] +
                   by_label['positive'][:500])
    for s in sample_pool:
        for v in cantonese_transform(s['text']):
            if v != s['text']:
                cantonese_aug.append({'text': v[:500], 'label': s['label'], 'source': 'augmented_cantonese'})
    all_augmented.extend(cantonese_aug)
    print(f"  生成: {len(cantonese_aug)}")

    # 去重
    seen = set()
    unique = []
    for s in all_augmented:
        key = s['text']
        if key not in seen and len(key) >= 4:
            seen.add(key)
            unique.append(s)

    # 标签分布
    dist = {}
    for s in unique:
        dist[s['label']] = dist.get(s['label'], 0) + 1

    print(f"\n去重后样本数: {len(unique)}")
    print("标签分布:")
    for label in ['positive', 'neutral', 'negative', 'crisis']:
        count = dist.get(label, 0)
        print(f"  {label:10s}: {count:6d}")

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        for s in unique:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')

    print(f"\n已写入: {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
