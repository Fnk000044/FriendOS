# FriendOS · docs 索引

本目录存放 FriendOS 的人类可读文档。仓库边界与三个源根约束见根目录 `AGENTS.md`。

## AI 科学依据（比赛答辩 / 评审用）

| 文档 | 内容 | 读者 |
|---|---|---|
| [risk_methodology.md](./risk_methodology.md) | 风险预警方法说明：哪些是真 ML、哪些是统计；信号权重与阈值来源；免责声明 | 答辩评审 / 开发者 |
| [model_card.md](./model_card.md) | ONNX 情感分类模型卡：用途 / 训练数据 / 标注方式 / 指标 / 局限 / 预期与禁止用途 | 答辩评审 |
| [eval_report.md](./eval_report.md) | 情感模型评估报告：混淆矩阵、类别指标、错误分析、与关键词基线对比 | 答辩评审 / QA |
| [external_validation.md](./external_validation.md) | 外部人工验证报告：抽样方法、一致率结果、不一致示例（骨架 + 占位） | 答辩评审 / QA |
| [demo_script.md](./demo_script.md) | 30 秒决赛速览路径 + 5 分钟答辩视频脚本（共用「小明 30 天」故事线） | 答辩 / 决赛现场 |
| [offline_smoke_test.md](./offline_smoke_test.md) | 干净离线 Windows 打包版冒烟测试清单（含结果记录） | QA / 决赛现场 |

## 工程与协作

| 文档 | 内容 |
|---|---|
| [目录整理规范.md](./目录整理规范.md) | 目录规范（引用 AGENTS.md 三个源根边界）+ 新增 / 移动 / 清理清单 |
| [archive/](./archive/) | 历史归档文档（不参与当前迭代） |

> 统一对外表述：FriendOS 的风险预警 = **多信号可解释风险评估（统计加权） + 统计早期预警（移动平均 / 线性回归 / 逻辑回归） + ML 情感 / 危机识别（ONNX 4 分类）**。禁止笼统说"AI 预测"，必须带免责："统计预测 ≠ 医疗诊断"。
