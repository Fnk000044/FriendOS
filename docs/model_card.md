# FriendOS · ONNX 情感分类模型卡（Model Card）

> 版本：v1.0 ｜ 最后更新：2026-08 ｜ 指标来源：`pc/models/sentiment/sentiment.eval.json`

## 1. 用途（Intended Use）

- **任务**：中文文本 4 分类情感/危机识别：`negative` / `neutral` / `positive` / `crisis`。
- **应用场景**：FriendOS 桌面应用中，对用户日记、对话输入做**本地离线**情感分析，驱动：
  1. 情感感知对话降级引擎（`ChatFallbackEngine`）的共情分支选择；
  2. 风险评分引擎（`RiskScoringEngine`）的情绪信号通道；
  3. 危机文本的固定伦理回复触发（热线 + 安全确认 + 不替代专业医疗）。
- **运行方式**：`onnxruntime-node` 本地推理（CPU），**无网络、无 API Key**；模型 ~103MB（INT8 动态量化）。

## 2. 训练数据来源（Data Sources）

| 来源 | 说明 | 占比（训练集 24200 条） |
|---|---|---|
| 数据集1（PsyDTCorpus / SoulChat2.0 类心理对话） | 心理咨询对话语料 | ~59% |
| 增强（augment.py：同义替换/回译等） | 数据增强 | ~21% |
| 公开数据 | 通用中文情感语料 | ~6% |
| 数据集3（distill_psychology-10k-r1） | R1 蒸馏心理学咨询对话 | ~9% |
| 数据集2（catch_mdpcot / SoulChat-R1） | 心理对话链式推理 | ~5% |

- 训练脚本：`pc/scripts/train_sentiment/`（`build_dataset.py` → `augment.py` → `merge_dataset.py` → `train.py`/`train_full.py` → `export_onnx.py` → `eval_onnx.py`）。
- 测试集：同源划分 6050 条（`test_final.jsonl`），四分类相对均衡。

## 3. 标注方式（Labeling）

**如实说明**：训练标注为**关键词弱标注 + R1 推理解析**的混合方案，非纯人工标注。

- `build_dataset.py` 用 `CRISIS_KW / NEGATIVE_KW / POSITIVE_KW` 自动打标（弱标注）；
- 部分数据使用 R1 模型的 reasoning 输出解析得到更细的标签；
- 该方案标注噪声存在（估计 ±10%），已在 `eval_report.md` 中说明影响。

## 4. 评估指标（同分布测试集 6050 条）

> 数据复制自 `pc/models/sentiment/sentiment.eval.json`。

| 指标 | 值 |
|---|---|
| Accuracy | **97.57%**（0.9757） |
| Macro F1 | **97.60%**（0.97597） |
| Weighted F1 | **97.57%**（0.97571） |
| **crisis recall（关键：自杀意念漏报率）** | **98.87%**（0.98870） |

### 4.1 混淆矩阵（由 P/R/F1 + support 反推的近似混淆矩阵）

| 真实 \ 预测 | negative | neutral | positive | crisis |
|---|---|---|---|---|
| negative (1590) | ~1522 | ~7 | ~24 | ~37 |
| neutral (1629) | ~2 | ~1613 | ~14 | ~0 |
| positive (1592) | ~24 | ~4 | ~1543 | ~21 |
| crisis (1239) | ~22 | ~0 | ~7 | ~1210 |

> 说明：该矩阵为根据每类 P/R/F1 与 support 反推的**近似值**（行和为 support，对角为 TP=recall×support，非对角按比例分摊），用于文档展示；精确混淆矩阵请以 `eval_onnx.py` 输出为准。

### 4.2 各类别指标

| 类别 | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| negative | 96.94% | 95.72% | 96.33% | 1590 |
| neutral | 99.81% | 99.02% | 99.41% | 1629 |
| positive | 95.90% | 96.92% | 96.41% | 1592 |
| crisis | 97.61% | **98.87%** | 98.24% | 1239 |

## 5. 局限性（Limitations）

1. **同分布偏差**：测试集与训练集同源划分，真实世界分布下指标可能低于上表。
2. **弱标注噪声**：标签为关键词/规则弱标注，估计有 ±10% 噪声。
3. **领域范围**：主要面向中文心理/日常场景文本；网络用语、方言、混合语言可能表现下降。
4. **危机判定仅作提示**：模型输出 `crisis` 概率用于触发伦理固定回复，**不构成临床诊断**；漏报率已尽力压低（recall 98.87%），但不能保证零漏报。

## 6. 预期 / 禁止用途

**预期**：本地离线情感分析、危机文本提示、情感感知对话、风险评分情绪通道。
**禁止**：
- 作为医疗诊断工具、自杀风险评估的唯一依据；
- 在未附免责声明的情况下对外宣称"AI 预测/诊断"；
- 在无监督场景下直接自动触达用户（必须经危机伦理流程：热线 + 安全确认 + 不替代专业医疗）。
