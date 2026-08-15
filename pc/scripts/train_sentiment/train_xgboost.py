"""
TF-IDF + XGBoost 轻量情感分类基线。
训练秒级完成，作为 BERT 的互补模型。

用法：python train_xgboost.py
"""

import json
import random
import pickle
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
TRAIN_PATH = DATA_DIR / "train_full.jsonl"
VAL_PATH = DATA_DIR / "val_full.jsonl"
TEST_PATH = DATA_DIR / "test_final.jsonl"
OUTPUT_DIR = SCRIPT_DIR / "output" / "xgboost"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

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


def load_split(path):
    samples = read_jsonl(path)
    texts, labels = [], []
    for s in samples:
        l = s.get('label', 'neutral')
        if l not in LABEL2ID:
            continue
        t = s.get('text', '').strip()
        if len(t) < 4:
            continue
        texts.append(t)
        labels.append(LABEL2ID[l])
    return texts, labels


def main():
    print("=" * 60)
    print("TF-IDF + XGBoost 情感分类基线")
    print("=" * 60)

    train_texts, train_labels = load_split(TRAIN_PATH)
    val_texts, val_labels = load_split(VAL_PATH)
    test_texts, test_labels = load_split(TEST_PATH)

    print(f"Train: {len(train_texts)}, Val: {len(val_texts)}, Test: {len(test_texts)}")

    # TF-IDF
    print("\nVectorizing...")
    vectorizer = TfidfVectorizer(
        max_features=50000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        analyzer='char_wb',  # 中文 char-level ngram 效果好
    )
    X_train = vectorizer.fit_transform(train_texts)
    X_val = vectorizer.transform(val_texts)
    X_test = vectorizer.transform(test_texts)
    print(f"Vocabulary size: {len(vectorizer.get_feature_names_out())}")
    print(f"Matrix shape: {X_train.shape}")

    # Calculate scale_pos_weight for crisis class
    neg_count = train_labels.count(0)
    crisis_count = train_labels.count(3)
    scale_pos_weight = neg_count / max(crisis_count, 1)

    # 训练 XGBoost（多分类）
    print("\nTraining XGBoost...")
    model = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=4,
        max_depth=6,
        learning_rate=0.1,
        n_estimators=500,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_lambda=2.0,
        reg_alpha=1.0,
        eval_metric='mlogloss',
        early_stopping_rounds=20,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(
        X_train, train_labels,
        eval_set=[(X_val, val_labels)],
        verbose=False,
    )

    print(f"Best iteration: {model.best_iteration + 1}")
    print(f"Best val loss: {model.best_score:.4f}")

    # 测试集评估
    y_pred = model.predict(X_test)
    target_names = [ID2LABEL[i] for i in range(4)]

    print("\nTest Set Results:")
    print(classification_report(test_labels, y_pred, target_names=target_names, zero_division=0))

    cm = confusion_matrix(test_labels, y_pred)
    print("\nConfusion Matrix:")
    header = "".join(f"{n:>12}" for n in target_names)
    print(f"{'':>12}{header}")
    for i, row in enumerate(cm):
        print(f"{target_names[i]:>12}" + "".join(f"{v:>12}" for v in row))

    crisis_idx = 3
    crisis_total = sum(1 for l in test_labels if l == crisis_idx)
    crisis_correct = sum(1 for l, p in zip(test_labels, y_pred) if l == crisis_idx and p == crisis_idx)
    print(f"\nCrisis Recall: {crisis_correct/max(crisis_total,1)*100:.1f}% ({crisis_correct}/{crisis_total})")

    # 保存
    print("\nSaving model...")
    with open(OUTPUT_DIR / "vectorizer.pkl", 'wb') as f:
        pickle.dump(vectorizer, f)
    model.save_model(str(OUTPUT_DIR / "xgboost.json"))

    print(f"Model saved to: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
