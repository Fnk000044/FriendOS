"""
对现有 sentiment.onnx 做 INT8 动态量化，直接原地覆盖。

无需重训，复用 export_ensemble.py 的 quantize_dynamic(QuantType.QInt8) 逻辑。
量化前后体积对比打印；量化产物路径不变（仍是 pc/models/sentiment/sentiment.onnx）。

用法：
  python quantize_only.py                 # 量化 pc/models/sentiment/sentiment.onnx
  python quantize_only.py --model <path>  # 量化指定路径
  python quantize_only.py --keep-backup   # 保留 FP32 备份为 sentiment.fp32.onnx
"""

import argparse
import shutil
import sys
from pathlib import Path

# pc/scripts/train_sentiment/quantize_only.py
# 模型在 pc/models/sentiment/sentiment.onnx
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL = SCRIPT_DIR.parent.parent / "models" / "sentiment" / "sentiment.onnx"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=str, default=str(DEFAULT_MODEL),
                        help='待量化的 ONNX 模型路径（默认 pc/models/sentiment/sentiment.onnx）')
    parser.add_argument('--keep-backup', action='store_true',
                        help='保留 FP32 原件为 *.fp32.onnx（默认直接覆盖）')
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        print(f"[ERROR] Model not found: {model_path}", file=sys.stderr)
        sys.exit(1)

    before_size = model_path.stat().st_size
    print(f"Source:        {model_path}")
    print(f"Size before:   {before_size / 1024 / 1024:.1f} MB")

    # 量化到临时文件，验证后再覆盖
    tmp_path = model_path.with_suffix('.quant.tmp.onnx')
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        print("[ERROR] onnxruntime not installed. pip install onnxruntime",
              file=sys.stderr)
        sys.exit(2)

    print("Quantizing (INT8 dynamic, weight_type=QInt8) ...")
    quantize_dynamic(
        str(model_path),
        str(tmp_path),
        weight_type=QuantType.QInt8,
    )

    after_size = tmp_path.stat().st_size
    print(f"Size after:    {after_size / 1024 / 1024:.1f} MB")
    print(f"Reduction:     {(before_size - after_size) / 1024 / 1024:.1f} MB "
          f"({(1 - after_size / before_size) * 100:.1f}%)")

    # 备份或直接覆盖
    if args.keep_backup:
        backup = model_path.with_suffix('.fp32.onnx')
        shutil.move(str(model_path), str(backup))
        print(f"FP32 backup:   {backup}")
    else:
        model_path.unlink()

    shutil.move(str(tmp_path), str(model_path))
    print(f"Quantized model written to: {model_path}")


if __name__ == '__main__':
    main()
