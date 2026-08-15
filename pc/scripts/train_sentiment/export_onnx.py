"""
Export trained sentiment model to ONNX format
Supports INT8 quantization for smaller model size
"""

import os
import sys
import argparse
from pathlib import Path

import torch
import numpy as np
from transformers import BertTokenizer, BertForSequenceClassification
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# ── Paths ──────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
MODEL_DIR = OUTPUT_DIR / "model"
ONNX_DIR = OUTPUT_DIR / "onnx"
ONNX_MODEL_PATH = ONNX_DIR / "sentiment.onnx"
ONNX_QUANT_PATH = ONNX_DIR / "sentiment_quant.onnx"


def export_onnx(quantize: bool = True):
    """Export PyTorch model to ONNX format"""

    # Check if model exists
    if not MODEL_DIR.exists():
        print(f"Error: Model not found at {MODEL_DIR}")
        print("Please run train.py first.")
        sys.exit(1)

    # Create output directory
    ONNX_DIR.mkdir(parents=True, exist_ok=True)

    # Load model and tokenizer
    print(f"Loading model from: {MODEL_DIR}")
    tokenizer = BertTokenizer.from_pretrained(str(MODEL_DIR))
    model = BertForSequenceClassification.from_pretrained(str(MODEL_DIR))
    model.eval()

    # Create dummy input
    dummy_text = "今天心情很好"
    dummy_input = tokenizer(
        dummy_text,
        max_length=256,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )

    # Export to ONNX
    print(f"Exporting to ONNX: {ONNX_MODEL_PATH}")
    torch.onnx.export(
        model,
        (
            dummy_input["input_ids"],
            dummy_input["attention_mask"],
        ),
        str(ONNX_MODEL_PATH),
        opset_version=14,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
            "logits": {0: "batch_size"},
        },
    )

    # Verify ONNX model
    print("Verifying ONNX model...")
    onnx_model = onnx.load(str(ONNX_MODEL_PATH))
    onnx.checker.check_model(onnx_model)
    print("ONNX model verification passed!")

    # Print model size
    model_size = os.path.getsize(str(ONNX_MODEL_PATH)) / (1024 * 1024)
    print(f"ONNX model size: {model_size:.2f} MB")

    # Quantize if requested
    if quantize:
        print(f"\nQuantizing model (INT8)...")
        quantize_dynamic(
            str(ONNX_MODEL_PATH),
            str(ONNX_QUANT_PATH),
            weight_type=QuantType.QInt8,
        )

        quant_size = os.path.getsize(str(ONNX_QUANT_PATH)) / (1024 * 1024)
        print(f"Quantized model size: {quant_size:.2f} MB")
        print(f"Size reduction: {((model_size - quant_size) / model_size * 100):.1f}%")

    print(f"\nExport complete!")
    print(f"ONNX model: {ONNX_MODEL_PATH}")
    if quantize:
        print(f"Quantized model: {ONNX_QUANT_PATH}")


def test_inference():
    """Test ONNX model inference"""

    import onnxruntime as ort

    if not ONNX_QUANT_PATH.exists():
        model_path = ONNX_MODEL_PATH
    else:
        model_path = ONNX_QUANT_PATH

    if not model_path.exists():
        print("No ONNX model found. Please export first.")
        return

    print(f"Testing inference with: {model_path}")

    # Load tokenizer
    tokenizer = BertTokenizer.from_pretrained(str(MODEL_DIR))

    # Create ONNX session
    session = ort.InferenceSession(str(model_path))

    # Test texts
    test_texts = [
        "今天心情很好，很开心",
        "感觉很焦虑，压力好大",
        "普通的一天，没什么特别的",
        "和朋友聚会，非常快乐",
        "工作好累，快要崩溃了",
    ]

    label_names = ["negative", "neutral", "positive"]

    print("\n" + "=" * 60)
    print("Inference Test Results")
    print("=" * 60)

    for text in test_texts:
        # Tokenize
        inputs = tokenizer(
            text,
            max_length=256,
            padding="max_length",
            truncation=True,
            return_tensors="np",
        )

        # Run inference
        outputs = session.run(
            None,
            {
                "input_ids": inputs["input_ids"].astype(np.int64),
                "attention_mask": inputs["attention_mask"].astype(np.int64),
            },
        )

        # Get prediction
        logits = outputs[0][0]
        probs = np.exp(logits) / np.sum(np.exp(logits))
        pred = np.argmax(probs)

        print(f"\nText: {text}")
        print(f"Prediction: {label_names[pred]} ({probs[pred]:.2%})")
        print(f"Probabilities: neg={probs[0]:.2%}, neu={probs[1]:.2%}, pos={probs[2]:.2%}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export sentiment model to ONNX")
    parser.add_argument("--no-quantize", action="store_true", help="Skip INT8 quantization")
    parser.add_argument("--test", action="store_true", help="Test inference after export")
    args = parser.parse_args()

    export_onnx(quantize=not args.no_quantize)

    if args.test:
        test_inference()
