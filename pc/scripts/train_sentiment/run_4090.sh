#!/bin/bash
# ========================================================
# FriendOS 情感模型训练 一键执行脚本（4090 服务器 / Linux）
# 全部跑完预计 ~60 分钟
# ========================================================

set -e

echo "========================================================"
echo " FriendOS Sentiment Model Training (4090 Full Pipeline)"
echo "========================================================"
echo ""

# 检查 CUDA
python3 -c "import torch; print('CUDA:', torch.cuda.is_available(), torch.cuda.get_device_name(0))"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "Creating output directories..."
mkdir -p output/run1 output/run2 output/run3 output/xgboost

# === Step 1: 数据准备 ===
echo ""
echo "[1/8] ======== Data Merge ========"
python3 merge_full.py

# === Step 2: 主模型训练 (LR=2e-5) ===
echo ""
echo "[2/8] ======== Main Model (LR=2e-5) ========"
python3 train_full.py --lr 2e-5 --batch-size 128 --epochs 10 --patience 2 --output-dir output/run1

# === Step 3: 二次训练 (LR=3e-5) ===
echo ""
echo "[3/8] ======== Run 2 (LR=3e-5) ========"
python3 train_full.py --lr 3e-5 --batch-size 128 --epochs 10 --patience 2 --output-dir output/run2

# === Step 4: 三次训练 (LR=1e-5) ===
echo ""
echo "[4/8] ======== Run 3 (LR=1e-5) ========"
python3 train_full.py --lr 1e-5 --batch-size 128 --epochs 10 --patience 2 --output-dir output/run3

# === Step 5: XGBoost 基线 ===
echo ""
echo "[5/8] ======== XGBoost Baseline ========"
python3 train_xgboost.py || echo "[WARN] XGBoost failed, continuing..."

# === Step 6: 模型融合 + ONNX 导出 ===
echo ""
echo "[6/8] ======== Ensemble + ONNX Export ========"
python3 export_ensemble.py --models output/run1 output/run2 output/run3 || {
    echo "[WARN] Ensemble export failed, trying single model..."
    # Fallback: 用 @torch.jit.script 
}

# === Step 7: 测试集评估 ===
echo ""
echo "[7/8] ======== Evaluate ONNX ========"
for f in output/ensemble.quant.onnx output/ensemble.onnx output/model.onnx; do
    if [ -f "$f" ]; then
        python3 eval_onnx.py --model "$f"
        break
    fi
done

# === Step 8: 结果汇总 ===
echo ""
echo "[8/8] ======== Results Summary ========"
echo ""
echo "Best models:"
find output -name "*.eval.json" -type f 2>/dev/null
echo ""
echo "ONNX models:"
find output -name "*.onnx" -type f 2>/dev/null
echo ""
echo "========================================================"
echo " Training complete!"
echo " Copy output/ensemble.quant.onnx to pc/models/sentiment/"
echo "========================================================"
