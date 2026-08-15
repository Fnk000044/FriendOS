# FriendOS · 部署版 ONNX 模型外部语料准确率实测（External Accuracy Check）

> 版本：v1.0 ｜ 实测日期：2026-08-14 ｜ 复跑脚本：`pc/scripts/eval-onnx-external.cjs`（指标）+ `pc/scripts/eval-onnx-external-v2.cjs`（基线对比 + 高置信危机抽样）
> 与 `eval_report.md` 的关系：该报告为**同分布测试集**（训练切分 test_final.jsonl）；本文档为**训练时未见过的外部语料**实测。

## 1. 复核结论（同分布官方数字）

读取 `pc/models/sentiment/sentiment.eval.json` 与 `docs/eval_report.md`，数字一致，复核通过：

| 指标 | 值 |
|---|---|
| Accuracy（6050 条同分布测试集） | **97.57%** |
| Macro F1 | 97.60% |
| crisis Recall | **98.87%** |
| crisis Precision | 97.61% |

## 2. 外部语料实测（本次新增）

部署模型 = `pc/models/sentiment/sentiment.onnx`（INT8，随安装包分发的那一份），分词器从 `SentimentService.cjs` 逐行移植。标签 = 与既有评估脚本相同的关键词弱标注（噪声约 ±10-15%）。

| 语料 | 样本 | 与弱标注一致率 | 模型平均置信度 | 备注 |
|---|---|---|---|---|
| 数据集1 PsyDTCorpus（SoulChat2.0 心理咨询） | 2000 | **86.80%** | 86.9% | 预测分布与标注分布形状吻合，crisis 14/14 全召回 |
| 数据集3 distill_psychology-10k-r1（R1 蒸馏心理学对话） | 1500 | 17.87% | 73.3% | 低分原因见 §3，**不是模型失效** |
| 关键词基线（同弱标注规则自评，数据集3 1000 条） | 1000 | 98.3% | — | 基线高是构造性自洽（标签由同样规则产生），无参考意义 |

## 3. 数据集3 低分归因（证据）

模型在数据集3 上预测 crisis 560 条（37.3%），弱标注只标出 1 条。高置信（>0.9）crisis 抽样显示模型判定的对象是：

- "我感到非常低落，觉得一切都没有意义了"（弱标 negative，模型 crisis 98.9%）
- "我感到非常绝望，看不到任何事情的意义"（弱标 negative，模型 crisis 98.8%）
- "我在睡眠方面遇到困难，我认为我需要药物来帮助我"（弱标 neutral，模型 crisis 98.6%）
- "我晚上难以入睡，并且一直在服用安眠药"（弱标 crisis ✓，模型 crisis 98.6%）

**归因**：弱标注只认"想死/自杀/不想活"等字面危机词；模型学到的危机语义包含"无意义感 + 绝望 + 药物依赖"这类临床自杀风险信号（C-SSRS 相关的绝望感维度），因此在 R1 蒸馏的求助语料上大量触发。从安全立场看这些判定**大多可辩护**，其中"用药"类存在过度敏感（"需要药物助眠"本身不是危机）。

同时模型在数据集3 上几乎不预测 neutral（2/1500）：蒸馏数据的 input 普遍带情绪色彩，弱标 neutral 多为"未命中关键词"而非"真中性"，属标注噪声。

## 4. 对产品的实际影响（actionable）

`SentimentService.analyzeEnhanced` 的危机升级阈值是 **crisisProb ≥ 0.5 → level='crisis'（触发危机弹窗）**。按数据集3 实测的模型行为估算，对"失眠/焦虑/绝望感"类高频求助表达，弹窗触发会很频繁（该语料上 37% 的样本会被判 crisis）。风险是**警报疲劳**：用户反复收到全屏危机弹窗后可能对真实危机脱敏——这与安全初衷相悖。

建议（待产品决策，未实施）：

- **方案 A（推荐）· 双确认升级** ✅ **已实施（2026-08-14）**：见 `pc/electron/services/crisisDecision.cjs`。crisis 弹窗条件收紧为"ONNX crisisProb ≥ 0.5 且（L1 危机词 或 语义强词表 `STRONG_CRISIS_PHRASES`）"；ONNX 单路命中降为 `high`。另配套**个人化误报降级**：危机弹窗新增「准确/误报」反馈，误报样本经 `calibration.crisisFeedback` 回传主进程，仅当无 L1 硬词命中且 ≥2 条相似样本（bigram Jaccard ≥ 0.5）时把 crisis 降为 high——反馈压误报、不压真危机（安全边界见 `risk_methodology.md` §9.2）。单测：`electron/services/__tests__/crisisDecision.test.ts`。
- **方案 B · 置信阈值上移**：crisisProb ≥ 0.9 才弹窗。简单，但数据集3 上 >0.9 的仍有 13%，且会漏掉部分低置信真实危机（crisis 召回是临床红线）。已否决。
- **方案 C · 维持现状**：接受高召回 + 高误报。已由方案 A 取代。

## 5. 复跑方式

```bash
cd pc
node scripts/eval-onnx-external.cjs      # 指标 + 落盘 models/eval/onnx-external-eval.json
node scripts/eval-onnx-external-v2.cjs   # 基线对比 + 高置信危机抽样
npm run eval:sentiment                    # 关键词层基线（数据集3）
npm run eval:risk                         # 危机检测 L1 基线（数据集1）
```

## 6. 局限

1. 弱标注噪声：外部一致率数字应解读为"模型与规则标签的一致性"，非金标准准确率；金标准需要人工标注集（见 `external_validation.md` 的抽样流程）。
2. 数据集3 为 R1 蒸馏产物，风格偏"求助开场白"，与日记/聊天真实分布仍有差异。
3. 模型文件与分词逻辑均与线上部署一致（同一 ONNX + 同一 tokenizeForBERT 移植），数字可代表应用内实际行为。
