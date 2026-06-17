"""
Sentiment Analysis Model Training Script
Trains BERT-base-chinese for Chinese text sentiment classification
Output: Sentiment classification model (positive/negative/neutral)
"""

import os
import json
import random
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple

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
NUM_LABELS = 3  # positive, negative, neutral
MAX_LENGTH = 256
BATCH_SIZE = 16
EPOCHS = 3
LEARNING_RATE = 2e-5
WARMUP_RATIO = 0.1
SEED = 42

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
DATASET_DIR = PROJECT_ROOT / "数据集1" / "PsyDTCorpus"
OUTPUT_DIR = SCRIPT_DIR / "output"
MODEL_DIR = OUTPUT_DIR / "model"

# ── Sentiment Keywords for Auto-labeling ───────────────────────

POSITIVE_WORDS = [
    '开心', '快乐', '幸福', '满足', '安心', '平静', '温暖', '感恩',
    '希望', '自信', '放松', '舒适', '满意', '喜悦', '兴奋', '感动',
    '轻松', '自在', '乐观', '积极', '勇敢', '坚强', '成长', '进步',
    '突破', '收获', '理解', '包容', '信任', '支持', '陪伴', '关爱',
    '成就', '成功', '顺利', '好运', '惊喜', '享受', '充实', '美好',
]

NEGATIVE_WORDS = [
    '难过', '焦虑', '抑郁', '绝望', '痛苦', '悲伤', '孤独', '恐惧',
    '愤怒', '烦躁', '不安', '迷茫', '疲惫', '无力', '崩溃', '心碎',
    '失落', '沮丧', '委屈', '压抑', '自卑', '内疚', '羞耻', '嫉妒',
    '怨恨', '厌倦', '麻木', '空虚', '无助', '彷徨', '忧虑', '紧张',
    '害怕', '担心', '烦恼', '苦闷', '消沉', '颓废', '失眠', '噩梦',
]

# ── Dataset ────────────────────────────────────────────────────

class SentimentDataset(Dataset):
    """Dataset for sentiment classification"""

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


def auto_label(text: str) -> int:
    """
    Auto-label text based on sentiment keywords
    Returns: 0=negative, 1=neutral, 2=positive
    """
    text_clean = text.replace("，", "").replace("。", "").replace("！", "").replace("？", "")

    pos_count = sum(1 for w in POSITIVE_WORDS if w in text_clean)
    neg_count = sum(1 for w in NEGATIVE_WORDS if w in text_clean)

    if pos_count > neg_count:
        return 2  # positive
    elif neg_count > pos_count:
        return 0  # negative
    else:
        return 1  # neutral


def load_dataset() -> Tuple[List[str], List[int]]:
    """Load and preprocess dataset from PsyDTCorpus"""

    print(f"Loading dataset from: {DATASET_DIR}")

    # Try to load PsyDTCorpus
    train_file = DATASET_DIR / "PsyDTCorpus_train_mulit_turn_packing.json"

    if not train_file.exists():
        print(f"Dataset file not found: {train_file}")
        print("Generating synthetic training data...")
        return generate_synthetic_data()

    with open(train_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = []
    labels = []

    # Extract text from PsyDTCorpus format
    for item in tqdm(data[:5000], desc="Processing dataset"):  # Use first 5000 samples
        if isinstance(item, dict):
            # Try different possible formats
            text = None
            if "input" in item:
                text = item["input"]
            elif "text" in item:
                text = item["text"]
            elif "content" in item:
                text = item["content"]
            elif "conversations" in item:
                # Multi-turn conversation format
                for conv in item["conversations"]:
                    if isinstance(conv, dict) and conv.get("role") == "user":
                        text = conv.get("content", "")
                        break

            if text and len(text) > 10:
                label = auto_label(text)
                texts.append(text[:512])  # Truncate long texts
                labels.append(label)

    if len(texts) < 100:
        print("Not enough data from dataset, generating synthetic data...")
        return generate_synthetic_data()

    print(f"Loaded {len(texts)} samples")
    print(f"Label distribution: neg={labels.count(0)}, neu={labels.count(1)}, pos={labels.count(2)}")

    return texts, labels


def generate_synthetic_data() -> Tuple[List[str], int]:
    """Generate synthetic training data for sentiment analysis"""

    print("Generating synthetic training data...")

    templates = {
        0: [  # Negative
            "今天心情{}，感觉{}",
            "工作{}，压力{}",
            "和朋友{}，感到{}",
            "最近{}，{}得不行",
            "生活{}，{}笼罩着我",
        ],
        1: [  # Neutral
            "今天{}，没什么特别的",
            "工作{}，一般般",
            "天气{}，适合{}",
            "日常{}，继续{}",
            "平淡的一天，{}",
        ],
        2: [  # Positive
            "今天{}，心情{}",
            "工作{}，感到{}",
            "和朋友{}，{}极了",
            "最近{}，{}满满",
            "生活{}，{}每一天",
        ],
    }

    negative_words = ["难过", "焦虑", "疲惫", "烦躁", "失落", "沮丧", "委屈", "压抑"]
    neutral_words = ["普通", "正常", "一般", "平淡", "平常", "还行", "可以", "不错"]
    positive_words = ["开心", "快乐", "满足", "兴奋", "感动", "幸福", "愉快", "高兴"]

    fill_words = {
        0: negative_words,
        1: neutral_words,
        2: positive_words,
    }

    texts = []
    labels = []

    for label in [0, 1, 2]:
        for template in templates[label]:
            for _ in range(50):  # 50 samples per template
                words = fill_words[label]
                text = template.format(*random.sample(words, 2))
                texts.append(text)
                labels.append(label)

    # Shuffle
    combined = list(zip(texts, labels))
    random.shuffle(combined)
    texts, labels = zip(*combined)

    print(f"Generated {len(texts)} synthetic samples")
    return list(texts), list(labels)


# ── Training ───────────────────────────────────────────────────

def train():
    """Main training function"""

    # Set seed
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Check device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load tokenizer and model
    print(f"Loading model: {MODEL_NAME}")
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
    model = BertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
    )
    model.to(device)

    # Load dataset
    texts, labels = load_dataset()

    # Split dataset
    split_idx = int(len(texts) * 0.8)
    train_texts, val_texts = texts[:split_idx], texts[split_idx:]
    train_labels, val_labels = labels[:split_idx], labels[split_idx:]

    print(f"Training samples: {len(train_texts)}")
    print(f"Validation samples: {len(val_texts)}")

    # Create datasets
    train_dataset = SentimentDataset(train_texts, train_labels, tokenizer, MAX_LENGTH)
    val_dataset = SentimentDataset(val_texts, val_labels, tokenizer, MAX_LENGTH)

    # Create dataloaders
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # Optimizer and scheduler
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * WARMUP_RATIO),
        num_training_steps=total_steps,
    )

    # Training loop
    best_val_loss = float("inf")
    for epoch in range(EPOCHS):
        print(f"\n{'='*50}")
        print(f"Epoch {epoch + 1}/{EPOCHS}")
        print(f"{'='*50}")

        # Training
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

        # Classification report
        target_names = ["negative", "neutral", "positive"]
        print("\nClassification Report:")
        print(classification_report(all_labels, all_preds, target_names=target_names))

        # Save best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            print(f"Saving best model (val_loss: {avg_val_loss:.4f})...")
            model.save_pretrained(str(MODEL_DIR))
            tokenizer.save_pretrained(str(MODEL_DIR))

    print(f"\nTraining complete! Model saved to: {MODEL_DIR}")
    print(f"Best validation loss: {best_val_loss:.4f}")

    return MODEL_DIR


if __name__ == "__main__":
    train()
