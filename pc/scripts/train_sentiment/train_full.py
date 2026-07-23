"""
BERT 4分类全量训练脚本（4090 优化版）

功能：
  - 全量数据训练（不做欠采样）
  - Class Weight 自动计算（inverse frequency）
  - FP16 混合精度（RTX 4090 Tensor Core）
  - Focal Loss 替代 CrossEntropy，聚焦 hard example
  - Cosine LR schedule with warmup
  - CLI 参数支持（方便多组 LR 对比）
  - Early stopping（patience=2）

用法：
  python train_full.py --lr 2e-5 --output-dir output/run1
  python train_full.py --lr 3e-5 --output-dir output/run2
  python train_full.py --lr 1e-5 --output-dir output/run3
"""

import argparse
import json
import math
import random
import numpy as np
from pathlib import Path
from typing import List, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    get_cosine_schedule_with_warmup,
)
from sklearn.metrics import classification_report, confusion_matrix
from tqdm import tqdm


# ── 标签映射 ──────────────────────────────────────────────────
LABEL2ID = {'negative': 0, 'neutral': 1, 'positive': 2, 'crisis': 3}
ID2LABEL = {0: 'negative', 1: 'neutral', 2: 'positive', 3: 'crisis'}
NUM_LABELS = 4

# ── 路径 ──────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
DEFAULT_TRAIN_PATH = DATA_DIR / "train_full.jsonl"
DEFAULT_VAL_PATH = DATA_DIR / "val_full.jsonl"
DEFAULT_TEST_PATH = DATA_DIR / "test_final.jsonl"


class FocalLoss(nn.Module):
    """Focal Loss for multi-class classification"""
    def __init__(self, gamma=2.0, weight=None):
        super().__init__()
        self.gamma = gamma
        self.weight = weight

    def forward(self, logits, labels):
        ce_loss = F.cross_entropy(logits, labels, weight=self.weight, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma * ce_loss).mean()
        return focal_loss


class SentimentDataset(Dataset):
    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_length: int = 128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(self.labels[idx], dtype=torch.long),
        }


def read_jsonl(path: Path) -> List[dict]:
    samples = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))
    return samples


def compute_class_weights(labels: List[int]) -> torch.Tensor:
    """按 inverse frequency 计算类别权重，crisis 类获得最高权重"""
    counts = [labels.count(i) for i in range(NUM_LABELS)]
    total = sum(counts)
    weights = [total / (c * NUM_LABELS) for c in counts]  # inverse frequency
    print(f"Class weights: {[f'{w:.2f}' for w in weights]}")
    return torch.tensor(weights, dtype=torch.float)


def load_split(path: Path, max_samples=None) -> Tuple[List[str], List[int]]:
    samples = read_jsonl(path)
    if max_samples and len(samples) > max_samples:
        samples = random.sample(samples, max_samples)
    texts, labels = [], []
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


def train_one_epoch(model, loader, optimizer, scheduler, scaler, device, epoch, use_fp16):
    model.train()
    total_loss = 0
    progress = tqdm(loader, desc=f"Epoch {epoch+1}")

    for batch in progress:
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)

        with torch.amp.autocast('cuda', enabled=use_fp16):
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            loss = model.criterion(logits, labels)

        if use_fp16:
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

        scheduler.step()
        optimizer.zero_grad()
        total_loss += loss.item()
        progress.set_postfix({"loss": f"{loss.item():.4f}"})

    return total_loss / len(loader)


def evaluate(model, loader, device, name="Val"):
    model.eval()
    all_preds = []
    all_labels = []
    total_loss = 0

    with torch.no_grad():
        for batch in tqdm(loader, desc=f"{name}ing"):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            with torch.amp.autocast('cuda', enabled=True):
                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                logits = outputs.logits
                loss = F.cross_entropy(logits, labels)

            total_loss += loss.item()
            preds = torch.argmax(logits, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(loader)
    target_names = [ID2LABEL[i] for i in range(NUM_LABELS)]
    report = classification_report(all_labels, all_preds, target_names=target_names, zero_division=0, output_dict=True)

    return avg_loss, all_labels, all_preds, report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lr', type=float, default=2e-5)
    parser.add_argument('--batch-size', type=int, default=128)
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--max-length', type=int, default=128)
    parser.add_argument('--patience', type=int, default=2)
    parser.add_argument('--gamma', type=float, default=2.0, help='Focal Loss gamma')
    parser.add_argument('--output-dir', type=str, default='output/run')
    parser.add_argument('--max-samples', type=int, default=None, help='限制训练样本数（调试用）')
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--no-fp16', action='store_true', help='禁用 FP16')
    args = parser.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    OUTPUT_DIR = SCRIPT_DIR / args.output_dir
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"Device: {device}")
    if device.type == 'cuda':
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    print(f"LR: {args.lr}, Batch: {args.batch_size}, MaxLen: {args.max_length}")
    print(f"Epochs: {args.epochs}, Patience: {args.patience}, FocalGamma: {args.gamma}")
    print(f"FP16: {not args.no_fp16}")
    print(f"{'='*60}\n")

    # ── 加载数据 ──────────────────────────────────────────────
    print("Loading data...")
    train_texts, train_labels = load_split(DEFAULT_TRAIN_PATH, args.max_samples)
    val_texts, val_labels = load_split(DEFAULT_VAL_PATH, args.max_samples)

    print(f"Train: {len(train_texts)} | Val: {len(val_texts)}")
    train_dist = {ID2LABEL[i]: train_labels.count(i) for i in range(NUM_LABELS)}
    val_dist = {ID2LABEL[i]: val_labels.count(i) for i in range(NUM_LABELS)}
    print(f"Train dist: {train_dist}")
    print(f"Val dist:   {val_dist}")

    # ── 类别权重 ──────────────────────────────────────────────
    class_weights = compute_class_weights(train_labels)
    print(f"  → negative: {class_weights[0]:.2f}, neutral: {class_weights[1]:.2f}, "
          f"positive: {class_weights[2]:.2f}, crisis: {class_weights[3]:.2f}")

    # ── Loss Function ─────────────────────────────────────────
    # 使用 Focal Loss，class_weights 作为 FocalLoss 的 weight 参数
    criterion = FocalLoss(gamma=args.gamma, weight=class_weights.to(device))

    # ── Tokenizer & Model ──────────────────────────────────────
    print("Loading BERT model...")
    tokenizer = BertTokenizer.from_pretrained("bert-base-chinese")
    model = BertForSequenceClassification.from_pretrained(
        "bert-base-chinese",
        num_labels=NUM_LABELS,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    model.class_weights = class_weights
    model.criterion = criterion
    model.to(device)

    # ── DataLoaders ────────────────────────────────────────────
    train_dataset = SentimentDataset(train_texts, train_labels, tokenizer, args.max_length)
    val_dataset = SentimentDataset(val_texts, val_labels, tokenizer, args.max_length)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size * 2, shuffle=False, num_workers=4, pin_memory=True)

    # ── Optimizer & Scheduler ─────────────────────────────────
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_cosine_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps,
    )

    # ── FP16 Scaler ────────────────────────────────────────────
    use_fp16 = (device.type == 'cuda') and not args.no_fp16
    scaler = torch.amp.GradScaler('cuda', enabled=use_fp16)

    # ── Training Loop ──────────────────────────────────────────
    best_val_loss = float("inf")
    patience_counter = 0
    results = []

    for epoch in range(args.epochs):
        print(f"\n{'='*50}")
        print(f"Epoch {epoch + 1}/{args.epochs}")
        print(f"{'='*50}")

        train_loss = train_one_epoch(model, train_loader, optimizer, scheduler, scaler, device, epoch, use_fp16)
        val_loss, _, _, report = evaluate(model, val_loader, device, "Val")

        print(f"  Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
        print(f"  Val Accuracy: {report['accuracy']:.4f}")
        print(f"  Crisis Recall: {report.get('crisis', {}).get('recall', 0):.4f}")

        results.append({'epoch': epoch + 1, 'train_loss': train_loss, 'val_loss': val_loss, 'report': report})

        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            print(f"  ✅ Saving best model (val_loss: {val_loss:.4f})...")
            model.save_pretrained(str(OUTPUT_DIR / "best"))
            tokenizer.save_pretrained(str(OUTPUT_DIR / "best"))
        else:
            patience_counter += 1
            print(f"  Patience: {patience_counter}/{args.patience}")
            if patience_counter >= args.patience:
                print(f"  Early stopping triggered.")
                break

        # Save last epoch
        model.save_pretrained(str(OUTPUT_DIR / "last"))
        tokenizer.save_pretrained(str(OUTPUT_DIR / "last"))

    # ── Final: load best & evaluate on test set ────────────────
    print(f"\n{'='*60}")
    print("Loading best model and evaluating on test set...")
    model = BertForSequenceClassification.from_pretrained(str(OUTPUT_DIR / "best"))
    model.class_weights = class_weights
    model.criterion = FocalLoss(gamma=args.gamma, weight=class_weights.to(device))
    model.to(device)

    test_texts, test_labels = load_split(DEFAULT_TEST_PATH)
    print(f"Test samples: {len(test_texts)}")
    test_dataset = SentimentDataset(test_texts, test_labels, tokenizer, args.max_length)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size * 2, shuffle=False, num_workers=4, pin_memory=True)

    test_loss, test_true, test_pred, test_report = evaluate(model, test_loader, device, "Test")

    target_names = [ID2LABEL[i] for i in range(NUM_LABELS)]
    print(f"\n{'='*60}")
    print("Test Set Results:")
    print(classification_report(test_true, test_pred, target_names=target_names, zero_division=0))

    cm = confusion_matrix(test_true, test_pred)
    print("\nConfusion Matrix:")
    header = "".join(f"{n:>12}" for n in target_names)
    print(f"{'':>12}{header}")
    for i, row in enumerate(cm):
        print(f"{target_names[i]:>12}" + "".join(f"{v:>12}" for v in row))

    crisis_idx = LABEL2ID['crisis']
    crisis_total = sum(1 for l in test_true if l == crisis_idx)
    crisis_correct = sum(1 for l, p in zip(test_true, test_pred) if l == crisis_idx and p == crisis_idx)
    crisis_recall = crisis_correct / crisis_total if crisis_total > 0 else 0
    print(f"\nCrisis Recall: {crisis_recall*100:.1f}% ({crisis_correct}/{crisis_total})")
    print(f"Miss Rate: {(1-crisis_recall)*100:.1f}%")

    # Save results
    with open(OUTPUT_DIR / "results.json", 'w') as f:
        json.dump({
            'args': vars(args),
            'test_report': test_report,
            'crisis_recall': crisis_recall,
            'best_val_loss': best_val_loss,
            'epoch_results': results,
        }, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Model saved to: {OUTPUT_DIR}")
    print(f"Results saved to: {OUTPUT_DIR / 'results.json'}")


if __name__ == '__main__':
    main()
