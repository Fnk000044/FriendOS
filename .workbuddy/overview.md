# 任务概览：FriendOS P0 实施（反馈驱动自进化闭环）

## 完成内容

按庆园杯评审结论与架构方案，完成 P0 全部实施并通过 QA 验证：

1. **自进化三路闭环**（核心创新）：
   - F1 情感纠错 → ONNX 先验偏移 β（crisis 通道完全冻结）
   - F2 风险校准 → 信号因子 λ∈[0.7,1.3] + 全局偏移 δ∈[-10,10]（量表/危机冻结，安全网用基线分）
   - F3 干预有效性 → EMA 带遗忘因子有效率
2. **知己度感知层**：Dashboard 新增 0-100 进度环 + 分维度拆解 + 30 天自进化时间线 + 置信度来源
3. **修复 2 个现有 Bug**：日记情感等级恒为 low（analyzeWithONNX 缺 level）；反馈正文明文落盘（现 encryptField 加密）
4. **UI 动画打磨**：卡片 hover、按钮按压、模块淡入、时间线 stagger，全部走 shouldReduceMotion() 降级
5. **基础设施**：Dexie v12 selfEvoModels 表、37 个 i18n 双语 key、risk_methodology.md 新增自进化章节、FeedbackService 合并

## 质量结果

- typecheck 0 错误
- 全量测试 **365/365 通过**（29 文件），含 QA 新增独立测试 36 例
- 危机冻结双端验证：任何反馈不可削弱危机判定（SentimentService crisis 通道 + RiskScoringEngine safety net）
- QA 判定：PASS，无源码 Bug

## 关键决策

- 工程师纠正架构文档一处公式笔误：EMA 有效样本量 N_t=α+(1-α)N_{t-1} 收敛于 1 永达不到阈值 3，改用普通计数
- 情感先验更新用保守固定置信度近似（feedbackLogs 不存类别概率）
- 干预/预测校准懒计算，不写 selfEvoModels，避免抑制其他模块 30 天漂移衰减
- F4 预测自动结算与 Platt 拟合留 P1

## 后续事项

- P1 候选：F4/F5 反馈、风险评分可解释性展示、隐私可视化、可分享周报卡片
- 申报书与演示视频（用户暂缓）
- 建议运行 `npm run dev` 实际体验自进化流程
