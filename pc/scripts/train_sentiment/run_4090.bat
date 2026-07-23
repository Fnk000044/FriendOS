@echo off
REM ========================================================
REM FriendOS 情感模型训练 一键执行脚本（4090 服务器用）
REM 全部跑完预计 ~60 分钟
REM ========================================================

setlocal enabledelayedexpansion

echo ========================================================
echo  FriendOS Sentiment Model Training (4090 Full Pipeline)
echo ========================================================
echo.

REM 检查 CUDA
python -c "import torch; print('CUDA:', torch.cuda.is_available(), torch.cuda.get_device_name(0))"
if %errorlevel% neq 0 (
    echo [ERROR] PyTorch 不可用
    exit /b 1
)

cd /d "%~dp0"

REM === Step 1: 数据准备 ===
echo.
echo [1/8] ======== Data Merge ========
python merge_full.py
if %errorlevel% neq 0 (
    echo [ERROR] Data merge failed
    exit /b 1
)

REM === Step 2: 主模型训练 (LR=2e-5) ===
echo.
echo [2/8] ======== Main Model (LR=2e-5) ========
python train_full.py --lr 2e-5 --batch-size 128 --epochs 10 --patience 2 --output-dir output/run1
if %errorlevel% neq 0 (
    echo [ERROR] Run 1 failed
    exit /b 1
)

REM === Step 3: 二次训练 (LR=3e-5) ===
echo.
echo [3/8] ======== Run 2 (LR=3e-5) ========
python train_full.py --lr 3e-5 --batch-size 128 --epochs 10 --patience 2 --output-dir output/run2
if %errorlevel% neq 0 (
    echo [ERROR] Run 2 failed
    exit /b 1
)

REM === Step 4: 三次训练 (LR=1e-5) ===
echo.
echo [4/8] ======== Run 3 (LR=1e-5) ========
python train_full.py --lr 1e-5 --batch-size 128 --epochs 10 --patience 2 --output-dir output/run3
if %errorlevel% neq 0 (
    echo [ERROR] Run 3 failed
    exit /b 1
)

REM === Step 5: XGBoost 基线 ===
echo.
echo [5/8] ======== XGBoost Baseline ========
python train_xgboost.py
if %errorlevel% neq 0 (
    echo [WARN] XGBoost failed, continuing...
)

REM === Step 6: 模型融合 + ONNX 导出 ===
echo.
echo [6/8] ======== Ensemble + ONNX Export ========
python export_ensemble.py --models output/run1 output/run2 output/run3 --quantize
if %errorlevel% neq 0 (
    echo [WARN] Ensemble export failed, trying single model...
    REM 回退：单独导出 run1
    python export_single.py --model output/run1
)

REM === Step 7: 测试集评估 ===
echo.
echo [7/8] ======== Evaluate ONNX ========
for %%f in (output\ensemble.quant.onnx output\ensemble.onnx output\model.onnx) do (
    if exist %%f (
        python eval_onnx.py --model %%f
        goto :evaldone
    )
)
python eval_onnx.py --model output/run1/best/model.onnx
:evaldone

REM === Step 8: 结果汇总 ===
echo.
echo [8/8] ======== Results Summary ========
echo.
echo Best models:
dir /s output\*.eval.json 2>nul
echo.
echo ONNX models:
dir /s output\*.onnx 2>nul
echo.

REM === Step 9: 复制量化模型到 pc/models/sentiment/ ===
echo [9/9] ======== Deploy to pc/models/sentiment/ ========
set "SENTIMENT_DIR=..\..\models\sentiment"
if not exist "%SENTIMENT_DIR%" mkdir "%SENTIMENT_DIR%"
for %%f in (output\ensemble.quant.onnx output\ensemble.onnx) do (
    if exist %%f (
        echo Copying %%f -^> %SENTIMENT_DIR%\sentiment.onnx
        copy /Y "%%f" "%SENTIMENT_DIR%\sentiment.onnx" >nul
        goto :deploydone
    )
)
:deploydone
echo ========================================================
echo  Training complete!
echo  Quantized model deployed to pc/models/sentiment/
echo ========================================================

pause
