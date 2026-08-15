# FriendOS · 外部人工验证报告（External Validation）

> 版本：v1.0 ｜ 最后更新：2026-08 ｜ 状态：**骨架 + 占位（作者自评降级方案）**
>
> 目的：对 ONNX 情感模型的同分布指标（accuracy 97.57% / crisis recall 98.87%）做**跨分布人工抽查**，验证真实语料下的泛化能力。

## 1. 抽样方法（Sampling Method）

- **数据源**：`数据集3/distill_psychology-10k-r1.json`（R1 蒸馏心理学咨询对话，与训练集不同分布）。
- **分层抽样**：按 4 类（negative / neutral / positive / crisis）配额抽样，共 **120 条**。
  - negative：36 条；neutral：24 条；positive：30 条；crisis：30 条。
- **抽样脚本**：`pc/scripts/external_validation.cjs`（`npm run eval:external`）。
  - 产出 `docs/external_validation/sample.csv`（id, text, model_label）；
  - 产出盲评表 `docs/external_validation/label_sheet.csv`（id, text, 空标签列, 评审人列），**不含模型标签**，避免诱导。
- **评审人**：建议 2-3 人独立盲评（PM / QA / 架构师各抽一部分），互不参照。
- **一致率计算**：`node scripts/external_validation.cjs --agreement` 读回填结果，计算总体 + 各类别一致率，回写本文档占位表。

## 2. 一致率结果（占位，待回填）

> 运行 `--agreement` 后自动回填。

| 类别 | 样本数 | 评审一致数 | 一致率 |
|---|---|---|---|
| negative | 36 | — | — |
| neutral | 24 | — | — |
| positive | 30 | — | — |
| crisis | 30 | — | — |
| **总体** | **120** | — | — |

> ⚠️ 若无人力完成盲评，采用降级方案：**作者自评 + 抽样展示**（在"不一致示例"中列出模型标签与作者判断的差异），并在答辩时如实说明。

## 3. 不一致示例（占位）

| # | 文本（脱敏） | 模型标签 | 评审标签 | 说明 |
|---|---|---|---|---|
| 1 | — | — | — | — |
| 2 | — | — | — | — |
| 3 | — | — | — | — |

## 4. 与同分布指标的对比（占位）

| 指标 | 同分布测试集 | 外部验证 |
|---|---|---|
| Accuracy | 97.57% | — |
| crisis recall | 98.87% | — |

## 5. 结论（占位）

- [ ] 外部一致率 ≥ 85% → 泛化可接受
- [ ] 外部一致率 70-85% → 标注差异可控，需在文档说明
- [ ] 外部一致率 < 70% → 需补充领域微调

---

### 操作说明

```bash
cd pc
npm run eval:external                 # 生成 sample.csv + label_sheet.csv（分层抽样 120 条）
# 评审人填写 label_sheet.csv 的 label / reviewer 列
node scripts/external_validation.cjs --agreement   # 计算一致率并回写本文档
# 可选：对抽样文本重算关键词模型标签
node scripts/eval-sentiment.cjs --external-sample 120
```
