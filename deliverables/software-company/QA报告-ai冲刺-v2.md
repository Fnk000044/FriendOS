# QA 测试报告 · AI 冲刺 v2（最终验证）

| 项目信息 | 内容 |
|---|---|
| 文档版本 | v2.0 |
| 撰写人 | QA 工程师 严过关（Edward） |
| 上游输入 | 任务列表-ai冲刺-v2.md（T01-T05 DoD）+ AGENTS.md + 工程师产出代码 |
| 验证方式 | 全量测试 + 类型检查 + lint + 关键源码抽查 + 硬性检查点核验 |
| 验证时间 | 2026-08-02 |
| 路由判定 | **NoOne（全部通过，无需返修）** |

---

## 1. 测试结果总表

### 1.1 全量测试（`npm run test` → vitest run）

- **Test Files: 23 passed (23)**
- **Tests: 306 passed (306) / 0 failed / 0 skipped**
- 时长 19.08s，全量测试可完整跑通 ✅

| 测试文件 | 用例数 | 结果 | 说明 |
|---|---|---|---|
| `src/utils/__tests__/evidenceChain.test.ts` | 7 | ✅ PASS | 证据链纯函数单测（v2 新增） |
| `electron/services/__tests__/ChatFallbackEngine.test.cjs` | 14 | ✅ PASS | 状态机/去重/话题引用/危机（主进程） |
| `electron/services/__tests__/ChatFallbackEngine.test.ts` | 17 | ✅ PASS | 同上 TS 版 |
| `electron/services/__tests__/RiskTrendPredictor.test.cjs` | 8 | ✅ PASS | 预测趋势（v2 补充） |
| `electron/services/__tests__/DiagnosticsService.test.cjs` | 4 | ✅ PASS | 自检服务（v2 补充） |
| `src/components/crisis/__tests__/CrisisInterventionModal.test.tsx` | 5 | ✅ PASS | 危机弹窗（含倒计时/日志/截断） |
| `electron/services/__tests__/RiskScoringEngine.test.ts` | 76 | ✅ PASS | 风险引擎 |
| `electron/services/__tests__/BehaviorAnalyzer.test.ts` | 18 | ✅ PASS | 行为基线 |
| `electron/services/__tests__/SentimentService.test.ts` | 10 | ✅ PASS | 情感服务 |
| `electron/__tests__/main.ipc.test.ts` | 16 | ✅ PASS | IPC 畸形入参降级 |
| `src/db/__tests__/crypto.test.ts` | 17 | ✅ PASS | AES-GCM 字段加密 |
| `src/hooks/__tests__/useTasks.test.ts` | 15 | ✅ PASS | 任务钩子 |
| `src/hooks/__tests__/useHabits.test.ts` | 13 | ✅ PASS | 习惯钩子 |
| `src/hooks/__tests__/useDiary.test.ts` | 5 | ✅ PASS | 日记钩子 |
| `src/utils/__tests__/date.test.ts` | 13 | ✅ PASS | 日期工具 |
| 其余（assessment/risk/services 等） | — | ✅ PASS | 见 vitest 输出，全部通过 |

> stderr 中的 crypto 解密失败日志 / risk:calculate 畸形入参日志均为**测试预期路径**的故意触发（用例断言"返回空串/兜底结构而非抛出"），非缺陷。

### 1.2 类型检查（`npm run typecheck` → tsc --noEmit）

- **✅ 通过（0 错误）**。electron.d.ts 契约与全部新组件（EvidenceChainView / DiagnosticsPanel / PrivacyPanel / EmotionPrediction / CrisisInterventionModal / DataSettings / MessageBubble / AppLayout / ChatPage / RiskDashboardPage / SettingsPage）类型无误。

### 1.3 Lint（`npm run lint`）

- **0 errors / 40 warnings**，均为既有风格提示（`no-explicit-any`、`prefer-const`），无新增错误，与 T05 文档记录一致。非阻塞。

---

## 2. 关键源码抽查结论

### 2.1 `src/utils/evidenceChain.ts` ✅
- **Σ(contribution) = totalScore**：`totalScore = Math.round(Σ contribution)`（第 153-157 行），贡献条之和即总分，自洽；对真实引擎输出与原 totalScore 差 ≤1（引擎先四舍五入信号分再加权）。单测断言 `|Σ - totalScore| ≤ 1` 且 `totalScore = round(Σ)`，通过。
- **status 判定**：`score>=60 → elevated`；`score===0 && !hasData → no_data`；否则 `normal`。单测覆盖三种状态 + 全 no_data 场景，通过。
- **disclaimer 恒定**：恒返回 `EVIDENCE_DISCLAIMER_KEY`（evidence.disclaimer_text），单测断言恒定，通过。

### 2.2 `src/services/ai/ChatService.ts` ✅
- **无 Key 短路**：sendMessage 在 chatSend 之前先 `chatGetProviderConfig()`（第 205-211 行），`!hasKey` 直接走 `chatFallback` 并 return，**不发起云调用**（避免决赛无 Key/断网 30s 等待）；主进程在 IPC 异常时也返回 `{hasKey:false}`，故 `!hasKey` 覆盖「无 Key / IPC 异常」两种场景。
- **session 传入/回写**：无 Key 路径、云失败降级路径、异常兜底路径三处均传 `session: useChatStore.getState().session`，收到 `fb.sessionDelta` 后 `updateSession()` 回写；`store.session.turnCount` 随轮次递增，第 3 轮起可引用历史主题（ChatFallbackEngine 状态机验证通过）。
- 危机路径保持现状（ONNX crisis → 立即弹窗 + CRISIS_RESPONSE_TEXT，不调 LLM）。

### 2.3 `src/components/crisis/CrisisInterventionModal.tsx` ✅
- 引用 `utils/constants.ts` 的 `CRISIS_HOTLINES`（含 **12356** 全国统一心理援助热线 + **400-161-9995** + 010-82951332），弹窗热线与干预资源页同源。
- **三处话术一致性核验**（逐字比对）：
  | 位置 | 热线 | 免责 |
  |---|---|---|
  | Chat 危机回复（`ChatFallbackEngine.cjs` CRISIS_RESPONSE） | 400-161-9995 / 12356 | 「我不能替代专业医疗」 ✅ |
  | Chat 危机回复（渲染层 `constants.ts` CRISIS_RESPONSE_TEXT） | 400-161-9995 / 12356 | 与主进程**逐字一致** ✅ |
  | 危机弹窗（CrisisInterventionModal） | CRISIS_HOTLINES（12356+400-161-9995+010-82951332） | `crisis.not_medical`（我不能替代专业医疗） ✅ |
  | 干预资源页（RiskScoreCard hotline_label） | 400-161-9995 / 12356 | ✅ |
  | 量表结果（AssessmentResult / CSSRSForm） | 400-161-9995 / 010-82951332 | ✅ |

### 2.4 `src/components/emotion/EmotionPrediction.tsx` ✅
- 数据源为 `predictionGetTrend({dailySeries, personalBaseline})`（主进程 RiskTrendPredictor），展示 riskUpgradeProb / riskTrend / confidence / 7 日 moodForecast。
- **method + note 如实展示**：method 徽标映射 logistic-regression / linear-regression / heuristic-fallback（`pred.method_*` key），`result.note` 全文展示。
- **免责**：`pred.stat_note`（统计学习预测说明）+ `pred.disclaimer`（统计预测 ≠ 医疗诊断）+ `docs/risk_methodology.md` 链接。
- **无"AI 预测"笼统表述**：全文件未出现「AI 预测」笼统字样；文案为「统计预测/统计学习预测」。✅

### 2.5 `src/i18n/translations.ts` ✅
- 全量 key 成对性：zh-CN 749 key / en 754 key；**zh 中无独有 key**，仅 en 侧多出 5 个嵌套枚举误识别项（`Type`/`backup`/`counseling`/`critical`/`distortions`，为对象属性值被正则误抓，非 TranslationKey 缺失），实际翻译 key 全部成对。
- v2 新增 key 逐一核验 zh+en 均存在：`chat.source_local`、`chat.source_cloud`、`settings.demo_data_clear_btn/confirm/success`、`pred.stat_note/note/disclaimer/method_*`、`evidence.disclaimer_text/method_ref/reason_*/action_*`、`crisis.hotline_unified_name/desc`、`crisis.not_medical` 等 32 个关键 key **全部成对**。

### 2.6 `src/utils/seedDemoData.ts` ✅
- **无 `Math.random()`**（仅注释提及"移除 Math.random()"，实际代码 0 处调用）；id 全部固定 `demo_*` 前缀；时间戳由固定日期推导；两次运行产出完全一致（确定性）。✅
- 含 30 天故事线（正常→压力→焦虑→危机→恢复）、2 次预警事件、危机日记「活着没意思」+ 热线回复，满足演示叙事。

### 2.7 T03/T04 集成完整性（抽查）✅
- 自检面板 `DiagnosticsPanel.tsx`（四态 + 断网文案 `diag.offline` + 演示模式入口）✅
- 证据链视图 `EvidenceChainView.tsx` + RiskScoreCard/EarlyWarningCard「查看证据链」入口 + RiskDashboardPage 组装 ✅
- `DataSettings.tsx` 注入（activate）+ 清理（clearDemoData + deactivate + toast）✅
- `MessageBubble.tsx` 来源徽标（fallback→本地 / cloud→云端 / greeting）✅
- `SettingsPage.tsx` 接入 DiagnosticsPanel + PrivacyPanel ✅
- `ChatPage.tsx` 会话状态提示（turnCount / dominantEmotion / topics chip）✅
- `AppLayout.tsx` 演示模式横幅（demoModeStore active 时全局可见）✅
- `EmotionPrediction` 接入 RiskDashboardPage ✅
- 打包配置：`electron-builder.json` files + asarUnpack 均含 `models/**/*`；`pc/dist/index.html` 构建产物存在（11:22）✅

---

## 3. 硬性检查点核验

| # | 检查点 | 结果 |
|---|---|---|
| 1 | `npm run typecheck` 通过（或列出全部新错误） | ✅ 通过，0 错误 |
| 2 | 证据链 Σ = totalScore（容差 ±1） | ✅ 单测 + 源码核验 |
| 3 | 危机三处话术一致（Chat 危机回复 / 危机弹窗 / 干预资源页） | ✅ 逐字比对通过，含 12356 + 400-161-9995 + 「我不能替代专业医疗」 |
| 4 | i18n 新 key 成对（zh-CN + en） | ✅ 32 个抽查 key 全部成对，zh 无独有 key |
| 5 | 无「AI 预测」笼统表述（预测 UI 带 method+note+免责） | ✅ EmotionPrediction 满足 |
| 6 | 渲染层无 `require('electron')` | ✅ `src/` 全量 grep 无命中 |
| 7 | 演示数据确定性（无 Math.random） | ✅ 0 处调用 |

**7/7 全部通过。**

---

## 4. 路由判定

> **Send To: NoOne — 全部测试通过，代码抽查无缺陷，无需返修。**

- 源码 Bug：无（未发现需要工程师修复的缺陷）
- 测试 Bug：无（306 用例全绿，测试断言与 PRD/DoD 一致）
- 判定依据：所有验收标准（T01-T05 DoD + 7 项硬性检查点）均满足；`npm run test` 306/306、`npm run typecheck` 0 错误、`npm run lint` 0 error。

---

## 5. 遗留问题清单（非阻塞，供决赛准备参考）

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| 1 | `docs/offline_smoke_test.md` 第 64 行「干净离线 Windows 虚拟机复测：待填」 | 打包版 GUI 逐项冒烟（启动/自检/对话≥6轮/证据链/危机/清理）需在**断网 + 无 Key 的打包机**人工执行，本代码冲刺会话无法代跑 | 决赛前在目标设备按清单逐项执行并回填结果；模型进包已实测确认（`app.asar.unpacked/models/sentiment/sentinel.onnx` 存在），风险低 |
| 2 | lint 40 warnings（`no-explicit-any` / `prefer-const`） | 均为既有风格提示，无新增错误，不影响运行 | 可留作技术债，不建议决赛前大改 |
| 3 | `crypto.test.ts` / `main.ipc.test.ts` 测试输出中的解密失败/畸形入参日志 | 为测试**故意触发**的错误路径断言（返回空串/兜底结构），非缺陷 | 无需处理 |
| 4 | ChatService 中 `debounce` 在 sendMessage 内部新建 | 每次调用新建 debounce 实例，实际去抖语义弱（历史遗留） | 不影响无 Key 短路主链路，可后续优化 |

---

## 6. 结论

**T01-T05 全部验收通过，质量状态可交付。** 决赛演示链路（无 Key/断网短路 → 30 天确定性演示数据 → 离线对话 ≥6 轮 → 风险看板 → 证据链 → 危机 12356 → 清理）在测试层面全部验证通过；答辩自证材料（科学文档四件套 + demo_script + offline_smoke_test + 306 测试）齐备。唯一待办为决赛设备上的 GUI 人工冒烟回填（遗留问题 #1）。
