"""
Psy-Qwen-SFT Training Script (QLoRA - 8GB VRAM optimized)
Fine-tune Qwen3.5-0.8B with psychology counseling datasets using QLoRA.

Datasets:
1. PsyDTCorpus (数据集1) - Multi-turn REBT therapy conversations
2. catch_mdpcot (数据集2) - Single-session therapy instructions
3. distill_psychology (数据集3) - Psychology Q&A pairs

Hardware: NVIDIA RTX 4060 Laptop (8GB VRAM)
"""

import json
import os
import torch
from pathlib import Path

# Use HuggingFace mirror for faster downloads in China
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq,
)
from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training
from datasets import Dataset

# ── Configuration ─────────────────────────────────────────────────

BASE_MODEL = "Qwen/Qwen3.5-0.8B"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output", "psy-qwen-0.8b-sft")
MAX_LENGTH = 1024  # Reduced from 2048
LORA_RANK = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.05
LEARNING_RATE = 2e-4
NUM_EPOCHS = 3
BATCH_SIZE = 1  # Reduced from 2
GRADIENT_ACCUMULATION = 8  # Increased from 4 to maintain effective batch size
WARMUP_RATIO = 0.1

# Dataset paths
DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..")
PSYDTCORPUS_PATH = os.path.join(DATASET_DIR, "数据集1", "PsyDTCorpus", "PsyDTCorpus_train_mulit_turn_packing.json")
CATCH_MDPCOT_PATH = os.path.join(DATASET_DIR, "数据集2", "catch_mdpcot.json")
DISTILL_PATH = os.path.join(DATASET_DIR, "数据集3", "distill_psychology-10k-r1.json")


# ── Dataset Loading ───────────────────────────────────────────────

def load_psychology_datasets():
    """Load and combine all three psychology datasets."""
    all_samples = []

    # 1. PsyDTCorpus - Multi-turn conversations
    print("Loading PsyDTCorpus...")
    with open(PSYDTCORPUS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data[:3000]:  # Reduced for memory
        messages = item.get("messages", [])
        if len(messages) < 2:
            continue

        system_msg = ""
        conversation = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"][:300]
            elif msg["role"] in ("user", "assistant"):
                conversation.append({"role": msg["role"], "content": msg["content"]})

        if len(conversation) >= 2:
            user_msg = next((m["content"] for m in conversation if m["role"] == "user"), "")
            assistant_msg = next((m["content"] for m in conversation if m["role"] == "assistant"), "")
            if user_msg and assistant_msg:
                all_samples.append({
                    "instruction": system_msg[:200] if system_msg else "你是一位专业的心理咨询师。",
                    "input": user_msg[:500],
                    "output": assistant_msg[:500],
                })

    print(f"  PsyDTCorpus: {len(all_samples)} samples")

    # 2. catch_mdpcot - Instruction-response
    print("Loading catch_mdpcot...")
    with open(CATCH_MDPCOT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    count_before = len(all_samples)
    for item in data[:3000]:
        instruction = item.get("system", "")[:200]
        user_msg = item.get("instruction", "")
        output = item.get("output", "")

        if user_msg and output:
            all_samples.append({
                "instruction": instruction[:200] if instruction else "你是一位专业的心理咨询师。",
                "input": user_msg[:500],
                "output": output[:500],
            })

    print(f"  catch_mdpcot: {len(all_samples) - count_before} samples")

    # 3. distill_psychology - Q&A pairs (JSONL format)
    print("Loading distill_psychology...")
    count_before = len(all_samples)
    with open(DISTILL_PATH, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= 5000:
                break
            try:
                item = json.loads(line.strip())
                user_msg = item.get("input", "")
                output = item.get("content", "")

                if user_msg and output:
                    all_samples.append({
                        "instruction": "你是一位专业的心理咨询师，能够提供专业、温暖的心理支持。",
                        "input": user_msg[:500],
                        "output": output[:500],
                    })
            except json.JSONDecodeError:
                continue

    print(f"  distill_psychology: {len(all_samples) - count_before} samples")
    print(f"Total: {len(all_samples)} samples")

    return all_samples


def format_sample(sample, tokenizer):
    """Format a sample into model input format."""
    instruction = sample["instruction"]
    user_input = sample["input"]
    output = sample["output"]

    messages = [
        {"role": "system", "content": instruction},
        {"role": "user", "content": user_input},
        {"role": "assistant", "content": output},
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=False,
    )

    return {"text": text}


# ── Training ──────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Psy-Qwen-SFT Training (QLoRA - 8GB VRAM)")
    print("=" * 60)

    if not torch.cuda.is_available():
        print("ERROR: CUDA not available!")
        return

    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    # Load tokenizer
    print("\nLoading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL,
        trust_remote_code=True,
        padding_side="right",
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Load model with 4-bit quantization (QLoRA)
    print("Loading model with 4-bit quantization...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb_config,
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)
    model.config.use_cache = False

    # Setup LoRA
    print("Setting up LoRA...")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=LORA_RANK,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        bias="none",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Enable gradient checkpointing
    model.gradient_checkpointing_enable()

    # Load datasets
    print("\nLoading datasets...")
    samples = load_psychology_datasets()

    # Format samples
    print("Formatting samples...")
    formatted = [format_sample(s, tokenizer) for s in samples]
    dataset = Dataset.from_list(formatted)

    # Tokenize
    def tokenize_fn(examples):
        result = tokenizer(
            examples["text"],
            truncation=True,
            max_length=MAX_LENGTH,
            padding="max_length",
            return_tensors=None,
        )
        result["labels"] = result["input_ids"].copy()
        return result

    print("Tokenizing...")
    tokenized_dataset = dataset.map(
        tokenize_fn,
        batched=True,
        remove_columns=["text"],
        desc="Tokenizing",
    )

    # Training arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION,
        learning_rate=LEARNING_RATE,
        warmup_ratio=WARMUP_RATIO,
        logging_steps=10,
        save_strategy="epoch",
        fp16=True,
        optim="paged_adamw_8bit",  # 8-bit optimizer for memory savings
        gradient_checkpointing=True,
        report_to="none",
        remove_unused_columns=False,
        dataloader_pin_memory=False,
        max_grad_norm=0.3,
    )

    # Data collator
    data_collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        padding=True,
        max_length=MAX_LENGTH,
    )

    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=data_collator,
    )

    # Train
    print("\nStarting training...")
    trainer.train()

    # Save
    print(f"\nSaving model to {OUTPUT_DIR}...")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print("\nTraining complete!")
    print(f"Model saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
