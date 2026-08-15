# FriendOS 知己

> **版本** 0.0.5 · 本地优先 · 数据本地存储

全功能心理健康个人管理系统 — 基于 Electron + React 的桌面应用。
把生产力工具（任务 / 习惯 / 日记）与 AI 对话陪伴、被动心理监测、主动干预工具整合在同一界面，
所有用户数据保存在本地 IndexedDB，对话情感分析与风险评分均在本地完成。

> **隐私架构**：云 LLM 对话（可选）通过主进程代理调用，API Key 经 OS 密钥链（DPAPI）加密存储、
> 不进渲染层、不进日志；渲染层 CSP `connect-src 'self'` 不放宽。未配置时自动使用离线陪伴模式。

---

## ✨ 核心特性

### AI 对话陪伴（0.0.5 新增）
- **对话式陪伴** — "知己"作为温暖、非评判的陪伴助手，3-5 句自然回复，先共情后建议
- **云 LLM 主进程代理** — 通义千问 / DeepSeek 可切换，API Key 不进渲染层，CSP 不放宽
- **离线陪伴模式** — 未配置 Key 时自动降级到规则模板引擎（时间感知 + 情绪分支 + 话术组合）
- **跨会话记忆** — 注入最近对话摘要到上下文，AI 能自然跟进上次提到的事件
- **主动陪伴** — 每日首次打开主动问候、沉默 3 天后回归关切、结合风险预警主动发起对话
- **上下文注入** — 近 7 天心情、当前风险等级、最近量表结果、学期阶段、深夜活跃注入 prompt
- **危机联动** — 对话消息走 ONNX 情感分析，crisis 级立即触发危机干预弹窗，不调 LLM

### 生产力工具
- **任务管理** — 优先级（紧急 / 高 / 中 / 低，组内自动排序）、子任务、截止时间、拖拽排序、自动延期、循环任务
- **习惯追踪** — 每日 / 每周 / 每月频率、连续打卡、**每张卡片的可折叠打卡月历**（支持点击任意历史日期补卡 / 取消）
- **日记系统** — 日历视图、心情评分（1-5）、天气、标签、引导式写作、情感分析徽标
- **记忆库** — 从日记 / 任务自动提取记忆候选、规则分类建议、搜索与整理
- **快速记录** — 悬浮快捷键一键唤起，快速记录想法 / 任务 / 日记
- **每日语录** — 内置激励语句库

### 心理健康 — 被动监测
- **两层情感分析** — 关键词预筛 → ONNX 模型（BERT-base-chinese INT8 量化，单模型 4 分类：negative / neutral / positive / crisis，测试集准确率 97.6%）。本地推理，对话与日记同通道
- **PANAS 情绪模型** — 正负情感维度
- **行为模式分析** — 个人基线建立（≥7 天），检测情绪 / 任务 / 习惯 / 日记 / 打字行为偏差
- **综合风险评分** — 0-100 分，五级风险，五个信号源加权（情绪 / 行为 / 评估 / 对话 / 日记）
- **C-SSRS 映射** — Columbia 自杀严重度评定量表框架集成

### 心理健康 — 主动工具
- **临床量表** — PHQ-9（抑郁）、GAD-7（焦虑）、PSS-10（压力）
- **CBT 思维记录** — 七步认知重构，干预前后情绪采集
- **呼吸练习** — 4-7-8 呼吸、方块呼吸、腹式呼吸、共振频率呼吸，前后情绪评分追踪效果
- **正念冥想** — 引导式冥想会话，前后情绪评分追踪效果
- **干预效果统计** — 各干预类型平均提升分、有效率、个人最有效干预 TOP 1（Reports 页）
- **个性化干预推荐** — 规则基础分 × 0.6 + 历史有效率 × 0.4，数据不足退回纯规则
- **风险评估仪表盘** — 复合风险指数、信号源分析、个人基线对比、7/14/30 天趋势、**风险时间线**（30 天折线 + 基线带 + 事件锚点）

### 心理健康 — 危机干预
- **自动危机检测** — 从日记 / 对话内容识别危机信号
- **对话危机联动** — 对话消息走 ONNX 情感分析，crisis 级立即弹危机干预弹窗，不调 LLM
- **双确认触发（方案A）** — 危机弹窗需"ONNX 判定 + 危机词/语义强词"双确认；仅模型单路命中时降为高风险卡片+热线（减少警报疲劳，依据外部语料实测）
- **反馈自进化** — 危机弹窗可标记「误报」，此后相似的表达会被个人化降级（L1 硬词命中绝不降级：压误报、不压真危机）
- **含蓄表达识别** — 理解"想消失""撑不下去""我没事"等中文含蓄表达
- **危机干预弹窗** — 5 秒倒计时防误关，集成中国心理援助热线
- **危机安全计划（SPI）** — 六步安全计划（预警信号/自我应对/转移注意力/可信赖的人/专业资源/活下去的理由），字段 AES-GCM 加密，危机时刻一键调出

### 心理科普与评估扩展（0.0.6 新增）
- **离线心理科普库** — 14 个话题（考前焦虑/失眠/抑郁/社恐/拖延/欺凌/危机应对等）双语知识库，加权检索，聊天中自动推荐相关知识卡
- **量表扩展** — 新增 ISI-7 失眠严重程度指数（Bastien 2001）、CD-RISC-10 心理韧性（Campbell-Sills 2007）
- **心理报告导出 PDF** — 复盘页一键导出 A4 PDF（统计卡 + AI 解读 + 健康维度 + 每日记录 + 相关性），可打印带给心理老师
- **《隐私政策》页面** — 依据《个人信息保护法》起草的正式政策页（10 节，中英双语）

### 主动风险预警（0.0.6 新增）
- **每日健康检查** — 应用启动 + 每天 21:00 自动跑 EarlyWarning + RiskScoring，visibilitychange 补偿
- **行为洞察卡片** — 连续未写日记 / 深夜活跃 / 任务下降 / 习惯中断 / 情绪低于基线，无异常给正面反馈
- **分级预警横幅** — 关注（静默）/ 提醒（toast + "和知己聊聊"）/ 警告（模态 + 推荐预约）/ 危机（已有）
- **预警 → 对话 → 干预链路** — 提醒/警告级通知带"和知己聊聊"按钮，跳转 ChatPage，AI 主动提及预警原因

### 学生群体适配
- **可配置校历** — 用户设置开学日 / 考试周起止，替代硬编码月份
- **学期节奏识别** — 自动判断假期 / 开学初 / 期中 / 期末复习 / 考试周 / 考后
- **应激水平评估** — 考试周前 14 天线性渐进，考试周 ×1.5 学业压力权重喂 RiskScoringEngine
- **专项心理支持** — 面向中国高校学生的定制化干预策略

### 数据与报告
- **日 / 周 / 月报告** — 规则引擎 / 云 LLM 双模式（配 key 时 AI 解读，降级走规则，诚实标注生成方式）
- **健康雷达图** — 六维可视化（情绪 / 压力 / 精力 / 社交 / 睡眠 / 自我关怀），resize 自适应不漂移
- **多维度综合分析** — 散点图（心情 × 任务完成率，点大小 = 习惯完成率）+ 皮尔逊相关系数（心情↔任务、心情↔习惯、任务↔习惯）
- **情绪趋势图** — 多维情绪指标时间序列
- **情绪热力图** — GitHub 风格日历格，最近 12 周心情色阶，点击查看当天详情
- **情绪预测** — 基于历史数据的情感趋势预测

### 基础设施
- **LAN 同步** — 局域网设备间同步，QR 码连接，Token 认证
- **数据导出 / 导入** — 全量 JSON 备份
- **应用锁** — PBKDF2（10 万次迭代）密码保护，锁屏界面
- **双语界面** — 中文 / English
- **主题系统** — 跟随系统 / 浅色 / 深色，毛玻璃效果
- **可配置快捷键** — 全局快捷键 + 应用内快捷键
- **通知提醒** — 定时提醒（默认：晚 9 点日记、早 9 点习惯）
- **新手引导** — 4 步 Onboarding Tour

---

## 🛠 技术栈

| 层级 | 技术 |
|---|---|
| 桌面壳 | Electron 42（无边框窗口，自定义标题栏） |
| 前端框架 | React 18.3 + TypeScript 5.5 |
| 构建工具 | Vite 5.4 |
| 打包 | electron-builder 26（NSIS 安装包 + afterPack 体积优化） |
| 路由 | react-router-dom 6.26（HashRouter） |
| 状态管理 | Zustand 4.5（8 个 store，persist 中间件） |
| 客户端数据库 | Dexie 4（IndexedDB ORM，21 张表，11 个 schema 版本） |
| 样式 | Tailwind CSS 3.4（毛玻璃主题 + CSS 变量） |
| 图表 | Recharts 2.12（雷达 / 散点 / 折线 / 柱状 / 环形） |
| 图标 | lucide-react |
| 情感分析 | onnxruntime-node 1.26（INT8 量化 ONNX 模型，CPU EP） |
| Markdown | react-markdown + remark-gfm |
| Toast | react-hot-toast |
| 测试 | Vitest + @testing-library/react + jsdom |

---

## 📦 下载与安装

### 方式一：使用预编译安装包
1. 在 [Releases](https://github.com/Fnk000044/FriendOS/releases) 页面下载 `FriendOSSetup-0.0.5.exe`
2. 双击运行，选择安装目录
3. 安装完成后从开始菜单或桌面快捷方式启动

### 方式二：从源码构建
```bash
git clone https://github.com/Fnk000044/FriendOS.git
cd FriendOS/pc
npm install
npm run dist      # 生成 release/FriendOSSetup-0.0.5.exe
```

打包产物体积（经 afterPack 优化）：

| 产物 | 体积 |
|---|---|
| `release/win-unpacked/`（解压版） | ~481 MB |
| `release/FriendOSSetup-0.0.5.exe`（NSIS 安装包） | ~171 MB |

体积优化措施：
- 情感模型从 3-model ensemble（296 MB FP32 量化后）改为单 BERT INT8 量化（100 MB），准确率持平（98%）
- afterPack 钩子裁剪 onnxruntime-node 多余平台二进制（darwin / linux / win32-arm64）
- locales 只保留 zh-CN + en-US
- 移除 Chromium LICENSES.html 与顶层 dxcompiler.dll

---

## 💻 开发

### 环境要求
- Node.js ≥ 18
- Windows 10/11

### 常用命令
```bash
cd pc

# 安装依赖
npm install

# 开发模式（Vite + Electron 并行）
npm run electron:dev

# 仅前端开发（浏览器预览）
npm run dev

# 构建前端
npm run build

# 构建并打包 exe
npm run dist

# 运行测试
npm run test
npm run test:watch      # 监听模式
npm run test:coverage   # 覆盖率报告
```

### 情感模型训练（可选）
模型已预置在 `pc/models/sentiment/`，无需训练即可使用。
若要重新训练或量化：

```bash
cd pc/scripts/train_sentiment

# 一键训练 + 导出 + 量化 + 部署（需 CUDA 环境）
run_4090.bat

# 仅对现有 sentiment.onnx 做 INT8 量化（无需重训）
python quantize_only.py

# 从单个 checkpoint 导出 + 量化（推荐，体积最小）
python export_single_quantized.py --checkpoint output/remote_results/checkpoints/run1

# 评估模型准确率
python eval_onnx.py --model ../../models/sentiment/sentiment.onnx
```

---

## 📁 项目结构

```
FriendOS/
├── pc/
│   ├── electron/                      # Electron 主进程
│   │   ├── main.cjs                   # 入口，IPC 处理
│   │   ├── preload.cjs                # Context Bridge
│   │   └── services/                  # 主进程服务
│   │       ├── SentimentService.cjs              # ONNX 情感分析
│   │       ├── EmotionAnalysisEngine.cjs         # 情绪引擎
│   │       ├── BehaviorAnalyzer.cjs              # 行为分析
│   │       ├── RiskScoringEngine.cjs             # 风险评分
│   │       ├── NotificationService.cjs           # 通知服务
│   │       ├── ApiKeyStore.cjs                   # 加密存储（DPAPI）
│   │       ├── crisisKeywords.cjs                # 危机关键词表
│   │       └── __tests__/                        # 主进程测试
│   ├── src/
│   │   ├── pages/                     # 页面（13 个路由）
│   │   │   ├── DashboardPage          # 仪表盘首页
│   │   │   ├── TasksPage              # 任务管理
│   │   │   ├── HabitsPage             # 习惯追踪
│   │   │   ├── DiaryPage              # 日记系统
│   │   │   ├── MemoriesPage           # 记忆库
│   │   │   ├── EmotionPage            # 情绪仪表盘
│   │   │   ├── TherapyPage            # 心理工具
│   │   │   ├── AssessmentPage         # 临床量表
│   │   │   ├── RiskDashboardPage      # 风险评估
│   │   │   ├── ReportsPage            # 数据报告
│   │   │   ├── SyncPage               # 同步管理
│   │   │   ├── SettingsPage           # 设置
│   │   │   └── WelcomePage            # 欢迎页
│   │   ├── components/                # UI 组件
│   │   │   ├── layout/                # 布局（侧边栏 / 标题栏 / 状态栏）
│   │   │   ├── common/                # 通用（Button / Modal / Card / AnimatedNumber 等 21 个）
│   │   │   ├── crisis/                # 危机干预弹窗
│   │   │   ├── dashboard/             # 仪表盘卡片
│   │   │   ├── diary/                 # 日记编辑器 / 日历
│   │   │   ├── habits/                # 习惯卡片 + 打卡月历
│   │   │   ├── tasks/                 # 任务列表 / 日历 / 详情
│   │   │   ├── memories/              # 记忆卡片
│   │   │   ├── quick-capture/         # 快速记录弹窗
│   │   │   ├── emotion/               # 情绪趋势 / 健康雷达 / 风险雷达
│   │   │   ├── assessment/            # PHQ-9 / GAD-7 / PSS-10 表单
│   │   │   ├── therapy/               # 呼吸 / 正念 / 思维记录
│   │   │   ├── reports/               # 图表 / 统计 / 周报 / 相关性散点图
│   │   │   └── settings/              # 外观设置
│   │   ├── services/                  # 前端业务服务
│   │   │   ├── ai/                    # AI 报告生成
│   │   │   ├── emotion/               # 健康档案 / 早期预警 / 情绪预测 / 本土化 / 学生适配
│   │   │   ├── memory/                # 记忆候选提取 / 分类建议
│   │   │   └── feedback/              # 用户反馈
│   │   ├── stores/                    # Zustand 状态管理（8 个 store）
│   │   ├── hooks/                     # React Hooks（16 个）
│   │   ├── db/                        # Dexie 数据库定义（21 张表）
│   │   ├── i18n/                      # 国际化（中 / 英）
│   │   ├── utils/                     # 工具函数（reports / date / sync 等）
│   │   └── types/                     # TypeScript 类型定义
│   ├── models/
│   │   └── sentiment/                 # ONNX 情感模型（INT8 量化，~100 MB）
│   ├── build/                         # 打包资源（图标 / NSIS 脚本 / afterPack 钩子）
│   ├── scripts/
│   │   ├── train_sentiment/           # 模型训练 / 量化 / 评估脚本（Python）
│   │   ├── eval-sentiment.cjs         # 前端情感模型评估
│   │   ├── eval-risk.cjs              # 风险评分评估
│   │   └── generate-ico.cjs           # 图标生成
│   └── package.json
├── docs/                              # 设计文档
├── 索引/                              # 项目索引
└── README.md
```

---

## 🗄 数据库

基于 Dexie（IndexedDB 封装），当前 schema 版本 **v11**，共 **21 张表**：

| 分类 | 表 | 说明 |
|---|---|---|
| 生产力 | tasks | 任务（子任务 / 拖拽排序 / 自动延期） |
| 生产力 | habits | 习惯定义 |
| 生产力 | habitLogs | 习惯打卡记录 |
| 生产力 | categories | 分类 |
| 日记 | diaries | 日记条目（心情 / 天气 / 标签） |
| 情绪 | emotionRecords | 情绪记录（来自日记 / 对话） |
| 情绪 | behaviorRecords | 行为记录（每日汇总） |
| 健康 | healthProfiles | 健康档案（六维） |
| 健康 | assessments | 临床评估（PHQ-9 / GAD-7 / PSS-10） |
| 健康 | therapyRecords | 治疗记录 |
| 记忆 | memories | 记忆条目 |
| 记忆 | memoryCandidates | 候选记忆 |
| 记录 | dailyRecords | 每日汇总快照 |
| 记录 | quickCaptures | 快速记录 |
| 记录 | crisisLogs | 危机日志 |
| AI | conversations | 完整对话历史 |
| AI | conversationSummaries | 对话摘要 |
| AI | aiReportCache | AI 报告缓存（按周期复用） |
| 系统 | syncLogs | 同步日志 |
| 系统 | feedbackLogs | 用户反馈 |
| 系统 | quotes | 每日语录 |

---

## 🔒 安全设计

- **无边框窗口** — 自定义标题栏，无原生菜单
- **CSP 策略** — 开发 / 生产环境分别配置
- **Context Isolation** — 启用，nodeIntegration 禁用
- **导航拦截** — 阻止加载非白名单 URL
- **同步服务** — CORS 限制局域网 IP，Token 10 分钟过期，1MB 请求体限制
- **API Key 加密** — Electron safeStorage（Windows DPAPI）
- **应用锁** — PBKDF2 + 随机盐，10 万次迭代

---

## 🧪 测试

```bash
cd pc
npm run test           # 运行所有测试
npm run test:watch     # 监听模式
npm run test:coverage  # 覆盖率报告
```

测试覆盖：
- 主进程服务：`SentimentService` / `BehaviorAnalyzer` / `RiskScoringEngine` / `ChatFallbackEngine`
- 前端服务：`emotion` 模块（`EarlyWarningService` / `StudentAdaptationService`）/ `therapy`（`EffectivenessService`）
- 组件：`assessment` 表单 / `crisis` 干预 / `risk` 图表
- 工具函数：`utils`

---

## 📝 变更日志

### 0.0.5 — AI 对话陪伴系统
- 新增"AI 陪伴"对话页面（`/chat`），流式输出，provider 状态徽标
- 云 LLM 走主进程代理（通义千问 / DeepSeek 可切换），API Key 不进渲染层、CSP 不放宽
- 离线陪伴模式：规则模板兜底（6 情绪分支 × ≥10 模板，时间感知 + 话术组合）
- 主动陪伴：每日首次打开主动问候、沉默 3 天后回归关切、跨会话记忆注入
- 危机联动：对话消息走 ONNX 情感分析，crisis 级立即弹危机干预弹窗，不调 LLM
- 对话情感写入 `emotionRecords`，激活 RiskScoringEngine chat 通道（原 10% 空置权重）
- 设置页 LLM 配置区块（provider / API Key / 测试连接）
- 修 README：删"三层语义 / Qwen3"，改"两层（关键词 + ONNX）+ 云 LLM 对话（可选）"

### 0.0.6 — 主动风险预警 + 干预效果闭环 + 学生适配
- 新增 `DailyCheckScheduler`：应用启动 + 每天 21:00 自动跑 EarlyWarning + RiskScoring
- 新增 `BehaviorInsightCard`：自然语言行为洞察，无异常给正面反馈
- 新增 `RiskBanner`：4 级预警横幅（关注 / 提醒 / 警告 / 危机），"和知己聊聊"按钮跳 ChatPage
- 新增 `EffectivenessService`：干预前后情绪采集，各类型平均提升分 / 有效率 / 个人 TOP 1
- `InterventionRecommendationService` 加历史有效率权重（规则 × 0.6 + 有效率 × 0.4）
- 新增可配置校历：用户设置开学日 / 考试周起止，替代硬编码月份
- `StudentAdaptationService`：考试周 × 1.5 学业压力权重喂 RiskScoringEngine
- 统一风险算法口径：RiskScoringEngine 为权威，EmotionAnalysisEngine 限情绪维度
- 评估脚本结果落盘 `pc/models/eval/*.json`

### 0.0.7 — 可视化 + 报告 AI 化
- 新增 `RiskTimelineChart`：30 天风险分折线 + 个人基线带（±1σ）+ 事件锚点（日记 / 量表 / 危机 / 对话危机）
- 新增 `MoodHeatmap`：GitHub 风格情绪热力图，最近 12 周心情色阶
- `ReportAIService`：配 key 时云 LLM 生成"AI 解读"，降级走规则引擎，诚实标注生成方式

### 0.1.0 — 打磨 + 测试 + 演示
- 新增 `ChatFallbackEngine` / `StudentAdaptationService` / `EffectivenessService` 单测（42 个测试）
- 情感分析 debounce（300ms），防止快速连续发送时每次跑 ONNX
- `seedDemoData` 扩展：添加 AI 对话历史 + 对话情感记录（喂 chat 通道）
- README 全面更新，CHANGELOG 0.0.5 → 0.1.0

---

## 📜 许可证

私人项目，未公开发布。
