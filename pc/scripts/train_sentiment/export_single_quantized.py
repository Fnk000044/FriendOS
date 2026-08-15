"""
从单个训练好的 BERT checkpoint 导出 ONNX + INT8 动态量化，
覆盖到 pc/models/sentiment/sentiment.onnx。

相比 export_ensemble.py 的 3-model ensemble（量化后 296MB），
单模型量化后约 98MB，体积减少 ~200MB，准确率损失通常 <1%。

用法：
  python export_single_quantized.py
  python export_single_quantized.py --checkpoint output/remote_results/checkpoints/run1
  python export_single_quantized.py --checkpoint ... --no-quantize
"""

import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
import torch
from transformers import BertTokenizer, BertForSequenceClassification

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_CHECKPOINT = SCRIPT_DIR / "output" / "remote_results" / "checkpoints" / "run1"
DEFAULT_MODEL_DIR = SCRIPT_DIR.parent.parent / "models" / "sentiment"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', type=str, default=str(DEFAULT_CHECKPOINT),
                        help='HF checkpoint 目录（默认 output/remote_results/checkpoints/run1）')
    parser.add_argument('--output', type=str, default=None,
                        help='输出 ONNX 路径（默认 pc/models/sentiment/sentiment.onnx）')
    parser.add_argument('--max-length', type=int, default=128,
                        help='序列长度（与 SentimentService 对齐，默认 128）')
    parser.add_argument('--no-quantize', action='store_true',
                        help='跳过 INT8 量化')
    parser.add_argument('--keep-backup', action='store_true',
                        help='保留原模型为 sentiment.bak.onnx')
    args = parser.parse_args()

    ckpt = Path(args.checkpoint)
    if not ckpt.exists():
        print(f"[ERROR] checkpoint not found: {ckpt}", file=sys.stderr)
        sys.exit(1)

    out_path = Path(args.output) if args.output else (DEFAULT_MODEL_DIR / "sentiment.onnx")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Load model + tokenizer
    print(f"Loading model from: {ckpt}")
    tokenizer = BertTokenizer.from_pretrained(str(ckpt))
    model = BertForSequenceClassification.from_pretrained(str(ckpt))
    model.to(device)
    model.eval()
    n_params = sum(p.numel() for p in model.parameters())
    print(f"Params: {n_params / 1e6:.1f}M  (FP32 ~{n_params * 4 / 1024 / 1024:.1f} MB)")

    # Dummy input
    dummy = tokenizer(
        "这是一个测试样本，用于验证ONNX导出",
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=args.max_length,
    )

    # 验证推理
    with torch.no_grad():
        logits = model(input_ids=dummy["input_ids"].to(device),
                       attention_mask=dummy["attention_mask"].to(device)).logits
        pred = torch.argmax(logits, dim=1).item()
        print(f"Test inference: pred={pred}")

    # 导出到临时文件
    tmp_fp32 = out_path.with_suffix('.fp32.tmp.onnx')
    print(f"Exporting FP32 ONNX -> {tmp_fp32}")
    torch.onnx.export(
        model,
        (dummy["input_ids"].to(device), dummy["attention_mask"].to(device)),
        str(tmp_fp32),
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

    # PyTorch 导出时把所有中间张量第 0 维写成固定值 1，与 dynamic_axes 的 batch_size
    # 冲突，导致 onnxruntime 量化前的 shape_inference 报 (768) vs (4) 等错误。
    # 这里清空所有 value_info，让 shape_inference 从 input 开始重新推断。
    import onnx
    onnx_model = onnx.load(str(tmp_fp32), load_external_data=False)
    while len(onnx_model.graph.value_info) > 0:
        onnx_model.graph.value_info.pop()
    # 同时把 graph output 的固定维改成符号维
    for out in onnx_model.graph.output:
        if out.name == "logits":
            dims = out.type.tensor_type.shape.dim
            while len(dims) > 0:
                dims.pop()
            d0 = dims.add(); d0.dim_param = "batch_size"
            d1 = dims.add(); d1.dim_value = 4
            print("Cleared value_info; fixed logits -> [batch_size, 4]")
    onnx.save_model(onnx_model, str(tmp_fp32))
    fp32_size = tmp_fp32.stat().st_size
    print(f"FP32 ONNX size: {fp32_size / 1024 / 1024:.1f} MB")

    # 量化
    if args.no_quantize:
        final_path = tmp_fp32
    else:
        final_path = out_path.with_suffix('.quant.tmp.onnx')
        print(f"Quantizing (INT8 dynamic, QInt8) -> {final_path}")
        from onnxruntime.quantization import quantize_dynamic, QuantType
        quantize_dynamic(
            str(tmp_fp32),
            str(final_path),
            weight_type=QuantType.QInt8,
        )
        quant_size = final_path.stat().st_size
        print(f"INT8 ONNX size: {quant_size / 1024 / 1024:.1f} MB "
              f"(reduction {(1 - quant_size / fp32_size) * 100:.1f}%)")
        tmp_fp32.unlink()

    # 备份并覆盖
    if out_path.exists() and args.keep_backup:
        backup = out_path.with_suffix('.bak.onnx')
        shutil.move(str(out_path), str(backup))
        print(f"Backup: {backup}")
    elif out_path.exists():
        out_path.unlink()

    shutil.move(str(final_path), str(out_path))
    print(f"\nFinal model: {out_path}")
    print(f"Final size: {out_path.stat().st_size / 1024 / 1024:.1f} MB")
    print("Next: run eval_onnx.py --model <path> to verify accuracy")


if __name__ == '__main__':
    main()
