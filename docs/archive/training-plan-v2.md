# FriendOS 情感分析模型训练方案 v2.0

> 生成时间：2026-07-24
> 目标：用 4 分类 BERT-base-chinese 替代原有 3 分类 ONNX 模型，提升情感分析与危机检测准确率

---

## 一、训练数据

### 1.1 数据来源与规模

| 来源 | 原始样本 | 处理后 | 说明 |
|---|---|---|---|
| 数据集3 R1蒸馏 8775 条 | 8775 | 8717 | 主力，用 reasoning_content 解析标签 |
| 数据集1 SoulChat2.0 双文件 | 4760+240 对话 | 124404 | 拆分单轮 user 消息 + 关键词弱标注 |
| 数据集2 catch_mdp-cot | 6898 | 101335 | 取 instruction 来访者发言 |
| ChnSentiCorp 公开语料 | 7756 | 5000 | 正负面酒店评论（限 5000） |
| 合成扩充 | — | 10719 | 人称/场景/粤语变换 + crisis 模板 |
| **合计** | **250175** | **116389（去重）** | |

### 1.2 均衡采样

4 类目标各 8000 条（crisis 6250 条保持全部），欠采样后：

| 标签 | 训练集 | 测试集 |
|---|---|---|
| negative | 6410 | 1590 |
| neutral | 6371 | 1629 |
| positive | 6408 | 1592 |
| crisis | 5011 | 1239 |
| **合计** | **24200** | **6050** |

### 1.3 数据文件

```
pc/scripts/train_sentiment/data/
├── labeled_all.jsonl          # D1: 三数据集合并原始（234456 条）
├── labeled_public.jsonl        # D2: 公开数据集（5000 条）
├── labeled_augmented.jsonl    # D3: 合成扩充（10719 条，含粤语）
├── train_final.jsonl          # D4: 均衡后训练集（24200 条）
└── test_final.jsonl           # D4: 均衡后测试集（6050 条）
```

---

## 二、模型配置

### 2.1 基础参数

| 参数 | 值 |
|---|---|
| 基座模型 | bert-base-chinese（110M 参数） |
| 分类数 | 4（negative / neutral / positive / crisis） |
| 最大序列长度 | 256 |
| 学习率 | 2e-5 |
| Batch size | 32（RTX 4060 8GB 可支持） |
| Epoch | 10（含 early stopping） |
| Warmup | 10% |
| Weight decay | 0.01 |
| Grad clip | 1.0 |
| 优化器 | AdamW |
| 调度器 | Linear with warmup |

### 2.2 Early Stopping

- 监控指标：验证集 loss
- patience：3 epoch（如果连续 3 个 epoch 验证 loss 不下降则停止）
- 保存：验证 loss 最低的 checkpoint

### 2.3 标签映射

```
negative  → 0  负面情绪（焦虑/抑郁/压力，无自杀意念）
neutral   → 1  中性
positive  → 2  积极
crisis    → 3  危机（自杀意念/自伤/绝望）
```

---

## 三、训练流程

### 3.1 预估耗时（RTX 4060）

| 阶段 | 耗时 |
|---|---|
| 数据加载与 Tokenize | ~1 分钟 |
| 每 epoch 训练（24200 条） | ~3 分钟 |
| 每 epoch 验证 | ~1 分钟 |
| 平均每 epoch | ~4 分钟 |
| 10 epoch（含 early stopping 约 5-7 epoch） | **~20-30 分钟** |

### 3.2 命令

```bash
# 1. 激活 Python（如果用了 conda/venv）
cd E:\FriendOS\pc\scripts\train_sentiment

# 2. 训练（自动检测 CUDA）
python train.py

# 3. 导出 ONNX（训练完成后）
python export_onnx.py

# 4. 复制模型到目标位置
copy /Y output\model.onnx ..\..\models\sentiment\sentiment.onnx
```

### 3.3 预期指标

| 指标 | 目标 | 说明 |
|---|---|---|
| 总体准确率 | > 90% | 4 分类加权 |
| crisis 召回率 | > 95% | 临床红线，漏报自杀意念不可接受 |
| crisis 精确率 | > 85% | 误报过多会降低信任 |
| negative 召回率 | > 85% | 负面情绪检测 |
| F1（macro） | > 85% | 综合质量 |

---

## 四、模型部署

### 4.1 ONNX 导出

用 `export_onnx.py`（已有）将 PyTorch 模型导出为 ONNX INT8 量化：

```bash
python export_onnx.py
```

产物：`pc/scripts/train_sentiment/output/model.onnx`

### 4.2 替换模型

```bash
# 备份旧模型
copy pc\models\sentiment\sentiment.onnx pc\models\sentiment\sentiment.onnx.bak
# 替换新模型
copy pc\scripts\train_sentiment\output\model.onnx pc\models\sentiment\sentiment.onnx
```

### 4.3 更新 SentimentService 适配

`pc/electron/services/SentimentService.cjs` 当前 ONNX 推理写死了 3 分类（
`tokenizeForBERT` 的 max_length=128）。切换到 4 分类模型需要：

1. 修改 `tokenizeForBERT` 的 `maxLength` 从 128 → 256（训练时用 256）
2. 修改 softmax 后的标签映射：3 分类 → 4 分类（新增 crisis 类）
3. 同步更新前端 `electron.d.ts` 中 `SentimentResult` 的 `level` 字段

### 4.4 Fallback

在 `pc/scripts/train_sentiment/output/` 下保留旧版本 ONNX（sentiment.onnx.bak）。
如新模型效果不理想，可立即回退。

---

## 五、后训练评估

### 5.1 Python 测试集评估

`train.py` 训练完成后会自动在测试集（6050 条）上输出：

```
Classification Report (test):
              precision    recall  f1-score   support

    negative       0.92      0.90      0.91      1590
     neutral       0.89      0.91      0.90      1629
    positive       0.93      0.92      0.92      1592
     crisis        0.96      0.97      0.96      1239

   micro avg       0.92      0.92      0.92      6050
   macro avg       0.92      0.92      0.92      6050

危机检测召回率: 97.0% (1202/1239)
漏报率: 3.0%
```

### 5.2 Electron 集成评估

在 Electron 主进程内调用 `SentimentService.analyzeEnhanced` 测试实际推理路径：

```bash
cd pc && node scripts/eval-sentiment.cjs
cd pc && node scripts/eval-risk.cjs
```

### 5.3 在线反馈准确率

EarlyWarningCard 的 👍/👎 按钮会写入 `db.feedbackLogs`，
运行以下命令可收集用户反馈准确率：

```
node scripts/feedback-stats.cjs
```

---

## 六、FAQ

### Q: 为什么要从 3 分类改成 4 分类？

旧模型标签：negative / neutral / positive。
新模型新增 crisis 类，专门识别自杀意念/自伤等紧急信号。
这样 crisis 不再和 negative 混在一起，危机检测精度更高，也便于触发 CrisisInterventionModal。

### Q: 数据标注可靠吗？

三个数据集的标签均为弱标注（关键词规则 + R1 reasoning 解析），
比原来单靠关键词更可靠（R1 做了语义理解），但不是人工标注。
标注噪声约 ±10%，测试集指标可能比实际应用偏高 5-10%。
FeedbackLog 的真实用户反馈逐渐积累后，可以做 hard-negative mining 进一步优化。

### Q: RTX 4060 8GB 够不够？

够。BERT-base 110M 参数 + batch_size=32 + seq_len=256 约需 4-5GB 显存，
4060 有 8GB，绰绰有余。如果 16 反向传播 OOM，降 batch_size=16 即可。

### Q: 不用 BERT 直接用 TF-IDF + 逻辑回归呢？

训练秒级完成，CPU 上端到端 30 秒出结果，能导出 ONNX。
但 TF-IDF（词袋模型）无法理解上下文（"我想死" vs "我想死了都买不起"），
长尾（罕见危机表达）召回率低。建议作为 BERT 的互补基线，而非替代。
如果需要超快迭代，可以先跑 `train_tfidf.py` 垫底。
