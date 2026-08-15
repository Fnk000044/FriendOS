# FriendOS 风险预警方法说明（Risk Methodology）

> 版本：v1.0 ｜ 维护：FriendOS 开发团队 ｜ 最后更新：2026-08
>
> 本文档回答一个问题：**FriendOS 的"风险预警"到底是怎么算出来的？哪些部分是机器学习（ML），哪些部分是统计方法？阈值从哪里来？**
> 答辩评审如需追问"预测依据"，请以本文档 + `model_card.md` + `eval_report.md` 为准。

---

## 1. 一句话定位

FriendOS 的风险预警 = **多信号可解释风险评估（统计加权） + 统计早期预警（移动平均 / 线性回归 / 逻辑回归） + ML 情感 / 危机识别（ONNX 4 分类）**。

- 真 ML（神经网络）：**只有**情感/危机文本分类（ONNX BERT 4 分类，见 `model_card.md`）。
- 其余（风险评分、早期预警、趋势预测）均为**可解释的统计方法**，不声称"AI 预测"。
- 一律带免责：**统计预测 ≠ 医疗诊断**。本应用不替代专业医疗。

---

## 2. ML vs 统计 边界（诚实声明）

| 能力 | 实现 | 是否真 ML | 依据 |
|---|---|---|---|
| 情感 4 分类（negative/neutral/positive/crisis） | `SentimentService.cjs`：关键词 L1 + ONNX L2（BERT，onnxruntime-node） | ✅ 真 ML（ONNX 神经网络） | `model_card.md` / `eval_report.md` |
| 危机关键词预筛（否定窗口/排除规则） | `crisisKeywords.cjs` 规则表 | ❌ 规则 | 人工整理词表 + 排除误报 |
| 综合风险评分 0-100 | `RiskScoringEngine.cjs`：5 信号加权求和 | ❌ 统计加权 | 见第 3 节 |
| 早期预警等级（green/yellow/orange/red） | `EarlyWarningService.ts`：3 天窗口特征 + 异常分 + 距临界天数 | ❌ 统计（移动平均/斜率） | 见第 5 节 |
| 7 日情绪预测 + 风险升级概率 | `RiskTrendPredictor.cjs`：线性回归 + 逻辑回归（纯 JS） | ❌ 统计学习模型（非神经网络） | 见第 6 节 |
| 个人基线对比 | `BehaviorAnalyzer.cjs`：均值 ± 标准差 | ❌ 统计 | 见第 4 节 |

**结论**：本项目"真 AI"能力集中在 ONNX 情感/危机识别；预测与预警全部为可解释统计方法，并在 UI 上带 `method` + `note` 如实标注（引用本文档）。

---

## 3. 风险评分：5 信号加权（0-100）

实现：`pc/electron/services/RiskScoringEngine.cjs`。

### 3.1 权重（weight）

| 信号 | 权重 | 数据来源 | 设定理由 |
|---|---|---|---|
| 情绪分析 emotion | **0.30** | `emotionRecords`（ONNX + 关键词） | 高频被动信号，覆盖全，权重最高 |
| 行为异常 behavior | **0.25** | `behaviorRecords`（BehaviorAnalyzer） | 无感识别核心通道，参考 StudentLife (Wang et al., 2014) 数字表型研究 |
| 评估量表 assessment | **0.25** | `assessments`（PHQ-9 / GAD-7 / PSS-10 / C-SSRS） | PHQ-9/GAD-7 为临床金标准自评量表，准确度最高；但需用户主动填写、数据稀疏，故与情绪信号等权（25%）而非更高，避免数据缺失时失分 |
| 聊天情感 chat | **0.10** | `conversationSummaries` | 对话摘要通道，数据相对稀疏 |
| 日记情绪 diary | **0.10** | `diaries.mood`（1-5 主观评分） | 参考价值次于量表，权重低 |

总分 = Σ(各信号分 × 权重)，再 clamp 到 [0, 100]。

### 3.2 风险等级阈值（risk level）

| 分数区间 | 等级 | 映射来源 |
|---|---|---|
| 0 – 25 | low（低） | PHQ-9 严重度分级的"正常-轻度"下界映射 |
| 26 – 50 | medium_low（中低） | 对应"轻度"关注区间 |
| 51 – 75 | medium（中） | 对应"中度"关注区间 |
| 76 – 90 | high（高） | 对应"中重度及以上" |
| 91 – 100 | critical（危急） | 对应"重度 + 临床升级" |

### 3.3 量表 cutoff 来源

| 量表 | cutoff | 出处 |
|---|---|---|
| PHQ-9 | ≥5 轻度 / ≥10 中度 / ≥15 中重度 / ≥20 重度 | Kroenke et al., 2001（DSM-5 常用） |
| GAD-7 | ≥5 轻度 / ≥10 中度 / ≥15 重度 | Spitzer et al., 2006 |
| PSS-10 | ≥14 中等压力 / ≥27 高压力 | **Cohen, Kamarck & Mermelstein, 1983** |
| C-SSRS | Q3/Q4/Q5 任一阳性 → 临床急性风险 | Posner et al., 2011（Columbia） |

### 3.4 临床升级（safety net）

满足任一即把等级推到 `critical`（可归因诊断，`diagnostics.escalation.reasons`）：
1. `totalScore >= 91`（原始阈值）；
2. C-SSRS Q3/Q4/Q5 任一阳性（伴意图/计划/行为的自杀意念）；
3. `totalScore >= 76` 且 ≥ 2 个危机信号源命中（多通道危机收敛，如聊天 + 日记同时出现危机内容）。

### 3.5 排除规则（exclusion rules）

危机关键词命中但被 `crisisKeywords.cjs` 排除表命中（如成语、网络用语误报），不计分但记入 `diagnostics.exclusionsHit`，便于归因与审计。

---

## 4. 个人基线（BehaviorAnalyzer）

实现：`pc/electron/services/BehaviorAnalyzer.cjs`。

- 至少 **7 天**数据才建立个人基线（`MIN_BASELINE_DAYS = 7`）。
- 基线指标：心情均值 ± 标准差、任务完成率均值 ± 标准差、习惯一致率均值 ± 标准差、日记频率。
- 异常判定：当日值与基线偏差 > `1.5 × std`（下限保护：心情 ≥1 分、任务率 ≥20%、习惯率 ≥20%）。
- 参考：StudentLife 数字表型研究（Wang et al., 2014）；打字行为参考 Campbell et al.（抑郁时打字速度变慢，效应量 d≈0.3-0.5）。

---

## 5. 早期预警（EarlyWarningService）

实现：`pc/src/services/emotion/EarlyWarningService.ts`（渲染层统计服务，纯本地）。

- **3 天窗口特征**：`moodTrend`（窗口斜率）、`moodDipDays`（低值天数）、`moodVolatility`（波动率）、`diarySkipDays`、`taskRate`/`habitRate` 下降、`lateNightFreq`。
- **异常分**（0-100）：对窗口特征加权归一，超过阈值触发预警等级（green/yellow/orange/red）。
- **距临界天数**：用线性回归斜率外推"达到 high/critical 分数"所需天数。
- **方法学**：移动平均 + 线性回归，均为统计方法；UI 展示预警时带"统计早期预警"口径与免责。

---

## 6. 趋势预测（RiskTrendPredictor）

实现：`pc/electron/services/RiskTrendPredictor.cjs`（主进程，纯 JS，零依赖）。

- **输入**：`dailySeries`（每日心情/任务/习惯/深夜/风险分序列）+ `personalBaseline`（可选）。
- **特征（每 3 天窗口）**：`moodMean`、`moodTrend`（斜率）、`moodVolatility`、`diarySkipDays`、`taskRate`、`habitRate`、`lateNightFreq`、`riskScoreLevel`。
- **7 日情绪预测**：线性回归（最小二乘闭式解）外推。
- **风险升级概率**：逻辑回归（纯 JS 梯度下降拟合个人历史样本），输出 `riskUpgradeProb`（未来 7 天风险等级上升 ≥1 档的概率）。
- **样本不足回退**：个人历史样本 < 30 时，回退为启发式（趋势斜率 + 波动率 + 深夜频率），并在 `method: 'heuristic-fallback'` 与 `note` 中如实标注。
- **输出**：`{ riskUpgradeProb, moodForecast7d[7], riskTrend, confidence, method, note }`。
- **诚实义务**：`method` 与 `note` 必须随结果返回（如 `logistic-regression` / `heuristic-fallback`）；UI 展示时必须引用本文档并带免责。

---

## 7. 免责声明（统一话术）

> **统计预测 ≠ 医疗诊断。**
> FriendOS 的评分、预警与趋势预测基于统计规则与可解释模型，仅用于**自我关注与早期提示**，不能替代精神科 / 心理科专业评估与治疗。如出现持续低落、睡眠障碍、自伤念头，请立即联系专业机构或拨打全国心理援助热线（400-161-9995 / 12356）。

## 8. 已知局限

1. 情感模型测试集与训练集同分布，外部泛化指标可能低于同分布指标（详见 `eval_report.md` 与 `external_validation.md`）。
2. 弱标注（关键词打标）存在 ±10% 噪声。
3. 行为/睡眠推断基于应用内活动时间，非可穿戴设备精确测量（StudentLife 睡眠推断准确度 r≈0.43）。
4. 外部人工验证目前为骨架 + 作者自评降级方案（见 `external_validation.md`）。

---

## 9. 本地个性化自进化（可解释统计校准层）

实现：`pc/src/services/selfevolution/SelfEvolutionService.ts`（渲染层）+ 主进程
`SentimentService.cjs` / `RiskScoringEngine.cjs` / `RiskTrendPredictor.cjs` 的纯函数校准层。
设计文档：`deliverables/qingyuanbei/arch-self-evolution.md`。

### 9.1 定位：不是「AI 在线训练」

个性化自进化**不是**对 ONNX 模型微调，也不是 per-user 在线神经网络训练。它是在既有
统计基线之上叠加的一层**可解释统计校准层**：

- **情感分类**：用户先验偏移 β（在 softmax 前的 logit 空间加类别偏置），零和、有界；
- **风险评分**：单信号乘法因子 λ（0.7–1.3）+ 全局偏移 δ（±10），叠加在五信号基线权重之上；
- **干预推荐**：带遗忘因子的指数加权有效率（EMA，α=0.3），替换静态「有效次数/总次数」；
- **趋势预测**：按预测步长的偏差修正（EMA）+ Platt 概率重标定。

所有参数均可解释、可追溯、可重置；`method`/`note` 与 `calibration` 元数据随结果返回。

### 9.2 危机单向锁定（硬约束）

个性化**永远不能**降低危机灵敏度：

1. **情感危机通道完全冻结**：先验偏移只作用于 `negative/neutral/positive` 三类，
   `crisis` 通道 β≡0；危机判定**只用未校准概率**。
2. **危机触发双确认（方案A，2026-08）**：弹窗级 `crisis` 要求
   ONNX crisis 概率 ≥ 0.5 **且**（命中 L1 危机词 或 语义强词表 `STRONG_CRISIS_PHRASES`）；
   ONNX 单路危机（无语义佐证）降为 `high`（风险卡 + 热线，不弹全屏）。
   依据：`docs/external_eval_onnx.md` 外部语料实测（模型对"绝望/无意义/用药"类
   高置信判危机，单路弹窗会导致警报疲劳）。
3. **个人化误报降级（有界）**：用户把危机提醒标记为"误报"后，样本进入
   `calibration.crisisFeedback`；仅当**无 L1 硬词命中**且当前文本与 ≥2 条
   历史误报样本相似（bigram Jaccard ≥ 0.5）时，`crisis` 降为 `high`。
   **L1 硬词（想死/自杀/…）命中时绝不降级**——反馈只能压误报，不能压真危机。
4. **临床量表冻结**：风险个性化 λ 仅作用于 `emotion/behavior/diary`，
   `assessment`（PHQ-9/GAD-7/PSS-10/C-SSRS 临床金标准）与 `chat`（历史通道）λ 恒为 1。
5. **危机升级 safety net 用基线分数**：`score ≥ 91` / C-SSRS Q3-Q5 急性 / 多通道危机收敛
   三条升级规则全部基于**未个性化基线分数**；一旦触发 critical，个性化完全失效
   （λ=1、δ=0），既不能凭空制造 critical，也不能把基线 critical 降级。

### 9.3 冷启动、收缩与漂移衰减

- **样本门槛**：情感 5 / 风险 8 / 干预 3 / 预测 5 次样本以下，对应模块**完全回退全局默认**。
- **收缩（shrinkage）**：`param = global + w·(learned - global)`，`w = min(1, N/10)`，
  样本少时自动拉向全局，防止 1–2 条反馈造成幻觉式误校准。
- **有界 clamp**：先验 ±1.0、λ ∈ [0.7,1.3]、δ ∈ [-10,10]。
- **漂移衰减**：参数 `lastUpdated` 距今 > 30 天时，向全局半衰期回退（×0.5）。
- **可重置**：设置页「重置个性化校准」删除 `selfEvoModels` 单行。

### 9.4 隐私与免责口径

- 反馈正文 `text`/`correction` 字段级 AES-GCM 加密（`crypto.ts`）；学习参数为聚合统计，
  整行加密存于 `selfEvoModels` 单行；反馈与学习参数**不参与 LAN sync**（每设备独立学习）。
- UI 必须标注「个性化基于本设备反馈，跨设备不共享」+「统计校准 ≠ 医疗诊断」。
- 危机场景禁用风险分纠错入口（避免在高风险时刻引入二次判断干扰）；
  危机弹窗本身提供「准确/误报」反馈——误报仅参与 §9.2-3 的有界降级，不触碰风险分。

