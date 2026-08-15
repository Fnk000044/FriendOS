"""
多模型融合 + ONNX 导出。

将 3 个 BERT 模型的 logits 做加权平均（soft voting），
导出为单个 ONNX 文件供 SentimentService 加载。

用法：
  python export_ensemble.py --models output/run1 output/run2 output/run3
"""

import argparse
import json
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
from transformers import BertTokenizer, BertForSequenceClassification

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
ID2LABEL = {0: 'negative', 1: 'neutral', 2: 'positive', 3: 'crisis'}


class EnsembleModel(nn.Module):
    """多个 BERT 模型的加权平均融合"""
    def __init__(self, models, weights=None):
        super().__init__()
        self.models = nn.ModuleList(models)
        self.num_models = len(models)
        if weights is None:
            weights = [1.0 / self.num_models] * self.num_models
        self.register_buffer("weights", torch.tensor(weights))

    def forward(self, input_ids, attention_mask):
        all_logits = []
        for model in self.models:
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            all_logits.append(outputs.logits.unsqueeze(0))

        stacked = torch.cat(all_logits, dim=0)  # [num_models, batch, num_labels]
        weighted = (stacked * self.weights.view(-1, 1, 1)).sum(dim=0)
        return weighted


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--models', nargs='+', required=True,
                        help='训练好的模型目录列表（relative to scripts/train_sentiment/）')
    parser.add_argument('--weights', nargs='+', type=float, default=None,
                        help='各模型权重（默认均等）')
    parser.add_argument('--output', type=str, default='ensemble.onnx')
    parser.add_argument('--quantize', action='store_true', default=False,
                        help='INT8 动态量化（需要 onnxruntime）')
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Load models
    models = []
    for model_path in args.models:
        full_path = SCRIPT_DIR / model_path / "best"
        if not full_path.exists():
            full_path = SCRIPT_DIR / model_path / "last"
        print(f"Loading model from: {full_path}")
        model = BertForSequenceClassification.from_pretrained(str(full_path))
        model.to(device)
        model.eval()
        models.append(model)

    # Load tokenizer (from first model)
    tokenizer = BertTokenizer.from_pretrained(str(SCRIPT_DIR / args.models[0] / "best"))

    # Create ensemble
    weights = args.weights or [1.0 / len(models)] * len(models)
    ensemble = EnsembleModel(models, weights).to(device)
    ensemble.eval()

    # 验证推理
    dummy_input = tokenizer(
        "这是一个测试样本，用于验证ONNX导出", 
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=128,
    )

    with torch.no_grad():
        output = ensemble(dummy_input["input_ids"].to(device), 
                          dummy_input["attention_mask"].to(device))
        pred = torch.argmax(output, dim=1).item()
        print(f"Test inference: label={ID2LABEL[pred]} (idx={pred})")

    # 导出 ONNX
    output_path = OUTPUT_DIR / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)

    torch.onnx.export(
        ensemble,
        (dummy_input["input_ids"].to(device), dummy_input["attention_mask"].to(device)),
        str(output_path),
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size"},
            "attention_mask": {0: "batch_size"},
            "logits": {0: "batch_size"},
        },
        opset_version=14,
        do_constant_folding=True,
    )

    # INT8 量化（量化产物落地为最终名 ensemble.quant.onnx，
    # 上游 run_4090.bat 会复制它到 pc/models/sentiment/sentiment.onnx）
    if args.quantize:
        import onnx
        from onnxruntime.quantization import quantize_dynamic, QuantType

        quantized_path = output_path.with_suffix('.quant.onnx')
        fp32_size = output_path.stat().st_size / 1024 / 1024
        quantize_dynamic(
            str(output_path),
            str(quantized_path),
            weight_type=QuantType.QInt8,
        )
        quant_size = quantized_path.stat().st_size / 1024 / 1024
        print(f"FP32 size:     {fp32_size:.1f} MB")
        print(f"INT8 size:     {quant_size:.1f} MB")
        print(f"Reduction:     {fp32_size - quant_size:.1f} MB "
              f"({(1 - quant_size / fp32_size) * 100:.1f}%)")
        print(f"Quantized model: {quantized_path}")
        print("Next: copy this file to pc/models/sentiment/sentiment.onnx")

    print(f"ONNX exported: {output_path}")
    print(f"Size: {output_path.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == '__main__':
    main()
