"""
Sentiment Analysis Model Training Script (v2 - 4分类增强版)
Trains BERT-base-chinese for Chinese text sentiment + crisis classification.

标签体系（4分类）：
  0 = negative  负面情绪（焦虑/抑郁/压力，无自杀意念）
  1 = neutral   中性
  2 = positive  积极
  3 = crisis    危机（自杀意念/自伤/绝望）

数据源：pc/scripts/train_sentiment/data/train_final.jsonl
       pc/scripts/train_sentiment/data/test_final.jsonl
（由 build_dataset.py + download_public.py + augment.py + merge_dataset.py 生成）

输出：pc/scripts/train_sentiment/output/model/ （PyTorch 模型）
后续用 export_onnx.py 导出 ONNX 替换 pc/models/sentiment/sentiment.onnx
"""

import os
import json
import random
import numpy as np
from pathlib import Path
from typing import List, Tuple

import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    get_linear_schedule_with_warmup,
)
from sklearn.metrics import classification_report, confusion_matrix
from tqdm import tqdm

# ── Configuration ──────────────────────────────────────────────

MODEL_NAME = "bert-base-chinese"
NUM_LABELS = 4  # negative, neutral, positive, crisis
LABEL2ID = {'negative': 0, 'neutral': 1, 'positive': 2, 'crisis': 3}
ID2LABEL = {0: 'negative', 1: 'neutral', 2: 'positive', 3: 'crisis'}
MAX_LENGTH = 256
BATCH_SIZE = 16
EPOCHS = 3
LEARNING_RATE = 2e-5
WARMUP_RATIO = 0.1
SEED = 42

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
TRAIN_PATH = DATA_DIR / "train_final.jsonl"
TEST_PATH = DATA_DIR / "test_final.jsonl"
OUTPUT_DIR = SCRIPT_DIR / "output"
MODEL_DIR = OUTPUT_DIR / "model"


# ── Dataset ────────────────────────────────────────────────────

class SentimentDataset(Dataset):
    """Dataset for 4-class sentiment + crisis classification"""

    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_length: int):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(label, dtype=torch.long),
        }


def read_jsonl(path: Path) -> List[dict]:
    samples = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))
    return samples


def load_train_data() -> Tuple[List[str], List[int]]:
    """从 train_final.jsonl 加载训练数据"""
    if not TRAIN_PATH.exists():
        raise FileNotFoundError(
            f"训练数据不存在: {TRAIN_PATH}\n"
            "请先运行: python build_dataset.py && python augment.py && python merge_dataset.py"
        )

    samples = read_jsonl(TRAIN_PATH)
    texts = []
    labels = []
    for s in samples:
        label_str = s.get('label', 'neutral')
        if label_str not in LABEL2ID:
            continue
        text = s.get('text', '').strip()
        if len(text) < 4:
            continue
        texts.append(text[:512])
        labels.append(LABEL2ID[label_str])

    return texts, labels


def load_test_data() -> Tuple[List[str], List[int]]:
    """从 test_final.jsonl 加载测试数据"""
    if not TEST_PATH.exists():
        return [], []

    samples = read_jsonl(TEST_PATH)
    texts = []
    labels = []
    for s in samples:
        label_str = s.get('label', 'neutral')
        if label_str not in LABEL2ID:
            continue
        text = s.get('text', '').strip()
        if len(text) < 4:
            continue
        texts.append(text[:512])
        labels.append(LABEL2ID[label_str])

    return texts, labels


# ── Training ───────────────────────────────────────────────────

def train():
    """Main training function"""

    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    if device.type == 'cuda':
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    print(f"Loading model: {MODEL_NAME}")
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
    model = BertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    model.to(device)

    # Load training data
    train_texts, train_labels = load_train_data()
    print(f"Training samples: {len(train_texts)}")
    dist = {ID2LABEL[i]: train_labels.count(i) for i in range(NUM_LABELS)}
    print(f"Label distribution: {dist}")

    # 划分训练/验证（从训练集再切 10% 做验证）
    split_idx = int(len(train_texts) * 0.9)
    train_texts, val_texts = train_texts[:split_idx], train_texts[split_idx:]
    train_labels, val_labels = train_labels[:split_idx], train_labels[split_idx:]

    print(f"Train: {len(train_texts)}, Val: {len(val_texts)}")

    train_dataset = SentimentDataset(train_texts, train_labels, tokenizer, MAX_LENGTH)
    val_dataset = SentimentDataset(val_texts, val_labels, tokenizer, MAX_LENGTH)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * WARMUP_RATIO),
        num_training_steps=total_steps,
    )

    best_val_loss = float("inf")
    for epoch in range(EPOCHS):
        print(f"\n{'='*50}")
        print(f"Epoch {epoch + 1}/{EPOCHS}")
        print(f"{'='*50}")

        model.train()
        total_loss = 0
        progress = tqdm(train_loader, desc="Training")

        for batch in progress:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )

            loss = outputs.loss
            total_loss += loss.item()

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()

            progress.set_postfix({"loss": f"{loss.item():.4f}"})

        avg_train_loss = total_loss / len(train_loader)
        print(f"Average training loss: {avg_train_loss:.4f}")

        # Validation
        model.eval()
        val_loss = 0
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch in tqdm(val_loader, desc="Validating"):
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)

                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels,
                )

                val_loss += outputs.loss.item()
                preds = torch.argmax(outputs.logits, dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        avg_val_loss = val_loss / len(val_loader)
        print(f"Validation loss: {avg_val_loss:.4f}")

        target_names = ["negative", "neutral", "positive", "crisis"]
        print("\nClassification Report (validation):")
        print(classification_report(all_labels, all_preds, target_names=target_names, zero_division=0))

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            print(f"Saving best model (val_loss: {avg_val_loss:.4f})...")
            model.save_pretrained(str(MODEL_DIR))
            tokenizer.save_pretrained(str(MODEL_DIR))

    # ── 在测试集上最终评估 ──────────────────────────────────────
    test_texts, test_labels = load_test_data()
    if test_texts:
        print(f"\n{'='*50}")
        print(f"Final evaluation on test set ({len(test_texts)} samples)")
        print(f"{'='*50}")

        test_dataset = SentimentDataset(test_texts, test_labels, tokenizer, MAX_LENGTH)
        test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

        model.eval()
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch in tqdm(test_loader, desc="Testing"):
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                preds = torch.argmax(outputs.logits, dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        target_names = ["negative", "neutral", "positive", "crisis"]
        print("\nClassification Report (test):")
        print(classification_report(all_labels, all_preds, target_names=target_names, zero_division=0))

        print("\nConfusion Matrix:")
        cm = confusion_matrix(all_labels, all_preds)
        print(f"{'':>12}" + "".join(f"{n:>12}" for n in target_names))
        for i, row in enumerate(cm):
            print(f"{target_names[i]:>12}" + "".join(f"{v:>12}" for v in row))

        # 危机召回率（临床红线）
        crisis_idx = LABEL2ID['crisis']
        crisis_total = sum(1 for l in all_labels if l == crisis_idx)
        crisis_correct = sum(1 for l, p in zip(all_labels, all_preds) if l == crisis_idx and p == crisis_idx)
        crisis_recall = crisis_correct / crisis_total if crisis_total > 0 else 0
        print(f"\n危机检测召回率: {crisis_recall*100:.1f}% ({crisis_correct}/{crisis_total})")
        print(f"漏报率: {(1-crisis_recall)*100:.1f}%  ← 临床红线，应接近 0%")

    print(f"\nTraining complete! Model saved to: {MODEL_DIR}")
    print(f"Best validation loss: {best_val_loss:.4f}")
    print(f"\n下一步: python export_onnx.py  导出 ONNX 模型")

    return MODEL_DIR


if __name__ == "__main__":
    train()
