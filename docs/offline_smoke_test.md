# FriendOS · 打包版离线冒烟测试清单

| 文档版本 | v2.0 |
|---|---|
| 撰写人 | 工程师 寇豆码（模板）；实测结果由 T05 回填 |
| 目的 | 决赛设备（无网、无 API Key）可完整演示的保命验证 |
| 模板状态 | ⬜ 待实测回填（T05） |

> 执行环境与打包版路径在下方「0. 环境记录」如实填写；每项冒烟在「结果」列写 pass / fail / N/A，并附差异说明。

---

## 0. 环境记录（T05 回填）

- 打包版路径：`E:\FriendOS\pc\release\win-unpacked\FriendOS.exe`（安装包：`pc/release/FriendOSSetup-0.0.5.exe`，electron-builder NSIS）
- 执行环境：`本机 Windows 10（0.0.26200）/ 开发沙箱（GUI 冒烟待决赛设备或干净离线 Windows 复测）`
- 网络状态：`构建机联网（用于下载 electron 运行时）；冒烟模拟断网需在决赛设备执行`
- API Key 状态：`未配置（无 Key）`
- 应用版本：`0.0.5`
- 截图/日志位置：`（GUI 冒烟时填写）`

### 打包配置核验结论（T01 记录，T05 实测复核）

- ✅ `pc/electron-builder.json` `files` 已含 `models/**/*`；
- ✅ `asarUnpack` 已含 `models/**/*` + `onnxruntime-node/**/*` + `onnxruntime-common/**/*` + `build/**/*`；
- ✅ 实测确认打包目录内存在 `resources/app.asar.unpacked/models/sentiment/sentiment.onnx`（asarUnpack 生效）；
- ✅ `npm run build`（vite）成功：`✓ built`，dist 产物齐全；
- ✅ `npm run dist` 流程可用（electron-builder 下载 electron 42.1.0 并打包 win-unpacked + NSIS）；
- ✅ 回归：`npm run test` 306 通过 / 0 失败；`npm run typecheck` 通过；`npm run lint` 0 error（40 warning 均为既有 any/prefer-const 风格提示）。

> 说明：本会话为代码冲刺，GUI 逐项冒烟（启动/自检/对话/证据链/危机/清理）需在打包机上以断网 + 无 Key 环境人工执行，结果回填下表。

---

## 1. 冒烟清单

> 约定：每项先写「操作」，再写「预期」，执行后把「结果」填为 pass / fail / N/A，差异写在「备注」。

| # | 项目 | 操作 | 预期 | 结果 | 备注 |
|---|---|---|---|---|---|
| 1 | 模型进包 | 检查打包目录 `resources/app.asar.unpacked/models/` 或运行自检面板 | `models/sentiment/sentiment.onnx` 存在；自检面板「模型=ONNX 就绪」绿灯 | ✅ | `app.asar.unpacked/models/sentiment/sentiment.onnx` 已确认存在 |
| 2 | 启动 | 断网双击启动打包版 | 应用正常启动，无报错弹窗；首屏 Dashboard 可交互 | ⬜ | 待 GUI 实测 |
| 3 | 启动自检 | 打开「设置 → 自检」（或首屏自检面板） | 四态卡片出现：联网=离线（灰）、模型=ONNX 就绪（绿）、Key=未配置（灰）、降级路径=「离线模式-模板对话已就绪（情感感知增强中）」（黄） | ⬜ | 待 GUI 实测 |
| 4 | 演示模式注入 | 设置 → 数据管理 →「一键注入 30 天演示数据」 | 确认弹窗后刷新；顶部横幅出现「演示模式 · 数据为模拟数据」；业务表有 demo_* 数据 | ⬜ | 待 GUI 实测 |
| 5 | 离线对话（≥6 轮） | AI助理连续对话 6 轮（示例：考试压力 → 失眠 → 想家 → 和室友矛盾 → 状态低落 → 恢复） | 每轮秒回（无 30s 云等待）；消息气泡带「本地」徽标；第 3 轮起回复引用历史主题；无重复模板；情感点与内容匹配 | ⬜ | 待 GUI 实测 |
| 6 | 风险看板 | 左侧导航 →「风险评估」 | 综合风险总分 + 等级 + 早期预警卡出现；无半成品/空状态 | ⬜ | 待 GUI 实测 |
| 7 | 证据链下钻 | 评分卡/预警卡点「查看证据链」 | 弹层显示总分+等级 → 5 条信号贡献条（宽度=contribution/总分，数值）→ 触发依据 → 建议动作（可跳转）→ 免责声明 | ⬜ | 待 GUI 实测 |
| 8 | 预测卡 | 情绪分析页查看「7 日情绪预测」 | 展示 riskUpgradeProb / moodForecast7d / method 徽标 + note 全文 +「统计预测 ≠ 医疗诊断」+ 方法说明链接；无「AI 预测」表述 | ⬜ | 待 GUI 实测 |
| 9 | 危机干预 | 聊天页输入危机文本（如「活着没意思」） | 危机弹窗弹出：热线卡含 12356 + 400-161-9995 +「我不能替代专业医疗」；聊天回复为固定危机回复并带警示色 | ⬜ | 待 GUI 实测 |
| 10 | 会话状态 | 对话 ≥6 轮后刷新页面 | 聊天历史保留；再次对话 session 接续（turnCount 继续递增） | ⬜ | 待 GUI 实测 |
| 11 | 演示数据清理 | 设置 → 数据管理 →「清理演示数据」 | 确认弹窗后业务表清空；演示模式横幅消失；demoModeStore 回到 inactive；刷新不残留 | ⬜ | 待 GUI 实测 |
| 12 | 退出 | 正常关闭应用 | 无崩溃、无卡死；日志无未捕获异常 | ⬜ | 待 GUI 实测 |

---

## 2. 与预期差异说明（T05 回填）

- （待填）

---

## 3. 复测记录（可选）

- 干净离线 Windows 虚拟机复测：`（待填：通过 / 未执行 / 差异）`
- 决赛设备实测：`（待填）`
