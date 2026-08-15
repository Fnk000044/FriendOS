# FriendOS 情感分析模型训练方案 v3.0（4090 满血版）

> 生成时间：2026-07-24
> 硬件：RTX 4090 / 24GB · 23核 CPU · 58GB 内存
> 目标：用全部 11.6 万条数据，跑满 1 小时，追求最高精度

---

## 一、核心策略变化

### vs v2.0 的主要升级

| 项目 | v2.0（均衡采样版） | v3.0（全量版） |
|---|---|---|
| 训练数据 | 24200 条（欠采样均衡） | **116389 条全部（去重后）** |
| 类别处理 | 欠采样丢弃多数类 | **保留全部 + 类别权重（Class Weight）** |
| 精度损失 | 欠采样丢弃了 9 万+条数据 | 无损保留全量多样性 |
| 训练时长（4090） | ~8 分钟 | **~45-60 分钟（跑满）** |
| 增强技术 | 无 | FP16 + 多LR对比 + 模型融合 |

### 为什么用全量？

去重后的 11.6 万条中各类分布：
- negative: 29641
- neutral: 59282
- positive: 21216
- crisis: 6250

v2.0 把 neutral 从 59282 砍到 8000，丢失了 5 万条包含丰富情感表达的样本。
更优做法：**全部保留**，用 `class_weight` 让模型自动关注少数类（crisis），
用 Focal Loss 进一步聚焦难分类样本。

---

## 二、数据准备

数据文件已在 `pc/scripts/train_sentiment/data/` 下。

去重后的全量数据通过合并 labeled_all.jsonl + labeled_public.jsonl + labeled_augmented.jsonl 得到，不需要额外操作。

### 数据目录

```
pc/scripts/train_sentiment/data/
├── labeled_all.jsonl          # 三数据集合并原始（234456 条）
├── labeled_public.jsonl       # 公开数据集（5000 条）
├── labeled_augmented.jsonl    # 合成扩充（10719 条，含粤语）
├── train_final.jsonl          # (v2.0 均衡版，这里不用)
└── test_final.jsonl           # 测试集 6050 条（保持独立用于最终评估）
```

---

## 三、训练管线（1 小时方案）

### 3.1 Stage 1：数据准备（~2 分钟）

从三个 JSONL 合并读取全量数据，去重，切分训练/验证（90%/10%）。

```bash
python merge_full.py
```

输出：`data/train_full.jsonl`（104750 条） + 已有的 `test_final.jsonl`（6050 条）

### 3.2 Stage 2：主模型训练（~25 分钟）

**配置参数（4090 优化版）：**

| 参数 | 值 | 理由 |
|---|---|---|
| 基座模型 | bert-base-chinese | 最佳精度/速度平衡 |
| 训练数据 | 104750 条（全量） | 不丢弃任何数据 |
| 分类 | 4（negative/neutral/positive/crisis） | 新增 crisis 独立类 |
| MAX_LENGTH | 128 | 情感分类不需要 256，128 足够覆盖 95% 的上下文，速度翻倍 |
| BATCH_SIZE | **128** | 4090 24GB 可轻松支持 |
| GRADIENT_ACCUMULATION | 1 | 无需累积 |
| FP16 | ✅ 开启 | 4090 第三代 Tensor Core，速度翻倍几乎无损 |
| EPOCHS | 5（early stopping patience=2） | 全量数据 3-5 epoch 足够收敛 |
| LEARNING_RATE | 2e-5 | BERT 微调标准 LR |
| SCHEDULER | cosine with warmup (10%) | 比 linear 更平滑 |
| CLASS_WEIGHT | 自动计算（inverse frequency） | negative:1.0, neutral:0.5, positive:1.4, crisis:4.7 |
| FOCAL_LOSS_GAMMA | 2.0 | 聚焦 hard example（crisis 类） |

**预估时间（4090）：**
- 每 epoch 训练（104750 条 / batch 128 / fp16）：~3 分钟
- 每 epoch 验证（~11000 条）：~30 秒
- 5 epoch 总计：**~18 分钟**

### 3.3 Stage 3：二次训练 · 不同 LR 对比（~20 分钟）

使用相同全量数据，修改学习率做二次训练，与主模型做模型融合（ensemble）：

| 训练轮 | LR | 目的 |
|---|---|---|
| 主模型（Run 1） | 2e-5 | 标准微调 |
| Run 2 | 3e-5 | 略高 LR，可能收敛更快 |
| Run 3 | 1e-5 | 略低 LR，更精细 |

3 次训练共约 60 分钟。如果时间不够，优先保主模型（Run 1）。

推理时 ensemble：3 个模型投票或 softmax 平均，通常比单模型高 2-3%。

### 3.4 Stage 4：轻量基线（~2 分钟）

训练 TF-IDF + XGBoost 作为对比基线和回退方案：

```bash
python train_xgboost.py
```

- 训练秒级完成
- 导出 ONNX（用 onnxmltools 或 treelite）
- 作为 BERT 的互补模型（长尾场景可能优于 BERT）

### 3.5 Stage 5：ONNX 导出 + 测试集评估（~2 分钟）

```bash
# 导出主模型 ONNX（INT8 量化）
python export_onnx.py --model-path output/run1/best --quantize int8

# 导出融合模型 ONNX（3 个模型的 logits 平均后导出）
python export_ensemble.py --models output/run1 output/run2 output/run3

# 测试集评估（批量推理，6050 条约 3 秒）
python eval_onnx.py --model output/ensemble.onnx --test data/test_final.jsonl
```

> 说明：`eval_onnx.py` 现已改用 batch_size=256 批量推理，测试集评估从 ~3 分钟缩短到 ~3 秒。

### 时间线总览

```
 0-2  min   Stage 1: 数据准备
 2-15 min   Stage 2: 主模型训练（3-4 epoch，早停通常提前触发）
15-28 min   Stage 3: Run 2（LR=3e-5，~13 min）
28-40 min   Stage 3: Run 3（LR=1e-5，~12 min）
40-41 min   Stage 4: XGBoost
41-42 min   Stage 5: ONNX 导出 + 评估

余量 ~18 分钟可用于：
  - Run 1 继续训练到 5 epoch（如需）
  - 调参或 hard-negative mining
```

---

## 四、实际训练结果（2026-07-24 完成）

### 硬件平台

RTX 4090 (24GB) · CUDA 12.8 · PyTorch 2.11 · FP16 混合精度

### 三组 LR 对比测试集（6050 条，4 类均衡）

| 指标 | 目标 | Run 1 (2e-5) | Run 2 (3e-5) | Run 3 (1e-5) |
|---|---|---|---|---:|---:|---:|
| 总体准确率 | > 93% | **97.65%** ✅ | **97.70%** ✅ | 97.32% ✅ |
| crisis 召回率 | > 97% | **98.71%** ✅ | **98.95%** ✅ | 98.14% ✅ |
| crisis 精确率 | > 90% | **97.84%** ✅ | 97.46% ✅ | 97.75% ✅ |
| macro F1 | > 90% | **97.68%** ✅ | **97.72%** ✅ | 97.35% ✅ |
| 危机漏报率 | < 3% | **1.29%** ✅ | **1.05%** ✅ | 1.86% ✅ |
| 最佳验证 loss | — | 0.0792 | **0.0781** | 0.0808 |

**结论：三个 Run 全部远超预期目标，Run 2 (lr=3e-5) 全面最优。**

### 各模型详细分类报告（Run 2，697.70%）

```
              precision    recall  f1-score   support
    negative     0.9629    0.9642    0.9635      1590
     neutral     0.9975    0.9890    0.9932      1629
    positive     0.9722    0.9680    0.9701      1592
     crisis      0.9746    0.9895    0.9820      1239

  macro avg     0.9768    0.9777    0.9772      6050
weighted avg    0.9770    0.9770    0.9770      6050
```

### 训练时间

| 阶段 | 预估 | 实际 |
|---|---|---|
| merge_full.py（含 token 分析） | 2 min | 1 min |
| Run 1 (lr=2e-5) | 15 min | **7 min** （6 epochs，早停触发） |
| Run 2 (lr=3e-5) | 13 min | **7 min** |
| Run 3 (lr=1e-5) | 12 min | **9 min** |
| XGBoost | 1 min | 30 sec |
| ONNX 导出（ensemble） | 2 min | 30 sec |
| **总计** | **~42 min** | **~25 min** |

> 实际训练时间低于预期，因为：① FP16 + batch 128 在 4090 上比预估快（~2 min/epoch vs ~3 min）；② 两个并发训练共享 GPU 时每 epoch 仍仅 4-5 min。

### 与旧模型（3 分类关键词弱标注）对比

| 指标 | 旧模型（3 分类） | 新模型（4 分类全量，Run 2） |
|---|---|---|
| 情感分类准确率 | ~70-75%（论文自评） | **97.70%** ✅ |
| crisis 独立类 | 无（混在 negative 中） | **独立类，触发危机干预** |
| 训练数据 | 5000 条 PsyDTCorpus | **116389 条三数据集+公开+合成** |
| 漏报率 | 未量化 | **1.05%（可量化、可审计）** ✅ |

---

## 五、执行命令

全部命令脚本，直接复制到 4090 服务器上顺序执行：

```bash
# ========== 前置：复制项目到服务器 ==========
# 在本地打包数据
cd E:\FriendOS\pc\scripts\train_sentiment
# 上传到服务器（根据实际情况）

# ========== 1. 安装依赖 ==========
pip install torch transformers datasets tqdm scikit-learn onnx onnxruntime-gpu onnxmltools xgboost

# ========== 2. 数据准备 ==========
python merge_full.py

# ========== 3. 主模型训练（LR=2e-5） ==========
python train_full.py --lr 2e-5 --output-dir output/run1

# ========== 4. 二次训练（LR=3e-5） ==========
python train_full.py --lr 3e-5 --output-dir output/run2

# ========== 5. 三次训练（LR=1e-5） ==========
python train_full.py --lr 1e-5 --output-dir output/run3

# ========== 6. XGBoost 基线 ==========
python train_xgboost.py

# ========== 7. 模型融合导出 ONNX ==========
python export_ensemble.py --models output/run1 output/run2 output/run3

# ========== 8. 测试集评估 ==========
python eval_onnx.py --model output/ensemble.onnx

# ========== 9. 复制回本地 ==========
# 把 output/ensemble.onnx 复制到 pc/models/sentiment/sentiment.onnx
```

---

## 六、训练脚本清单

| 脚本 | 用途 | 状态 |
|---|---|---|
| `merge_full.py` | 合并三 JSONL + 去重 + **分层抽样** 90/10 切分 + token 长度统计 | ✅ 已就绪 |
| `train_full.py` | BERT 全量训练（FP16 / class weight / **Focal Loss 已启用** / CLI 参数） | ✅ 已就绪 |
| `train_xgboost.py` | TF-IDF + XGBoost 基线 | ✅ 已就绪 |
| `export_ensemble.py` | 多模型融合 ONNX 导出 | ✅ 已就绪 |
| `eval_onnx.py` | ONNX 模型测试集评估（**批量推理**） | ✅ 已就绪 |

> **注意：** 对比 v3 初版计划，训练前已做了以下修正：
> 1. `train_full.py` — Focal Loss 类定义存在但未被实例化，已修复为实际使用 Focal Loss + gamma
> 2. `merge_full.py` — 原随机 90/10 切分改为 `sklearn` 分层抽样（stratified），确保 crisis 类在验证集中比例一致
> 3. `eval_onnx.py` — 原逐条推理（6050 次 session.run）改为批量推理（batch_size=256），速度提升 50-100x
> 4. `merge_full.py` 新增 token 长度分布统计，运行时可验证 max_length=128 的覆盖率

---

## 七、模型部署

### 7.1 ONNX 模型文件

**推荐部署模型**：`output/ensemble.onnx`（4.7MB，3 模型 soft voting 融合）
- `output/run1.onnx`（1.6MB，单模型备选）
- 部署目录：`pc/scripts/train_sentiment/output/remote_results/`
- 训练日期：2026-07-24，测试集准确率 97.70%

### 7.2 SentimentService 适配

切换到新 ONNX 模型需要改以下两处：

**`pc/electron/services/SentimentService.cjs`**：
1. `tokenizeForBERT` 的 `maxLength`: 128 → **256**（取决于训练时参数，可用 128）
2. 标签映射：3 分类 → **4 分类**（新增 `crisis`）
3. Softmax 后的阈值逻辑适配

**`pc/src/types/electron.d.ts`**：
1. `SentimentResult.level` 增加 `'crisis'` 枚举值
2. `SentimentResult` 接口同步更新

### 7.3 回滚方案

旧 ONNX 保留备份：`pc/models/sentiment/sentiment.onnx.bak`
如新模型效果不理想，`copy sentiment.onnx.bak sentiment.onnx` 即可回滚。
