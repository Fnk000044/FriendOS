# FriendOS 知己

全功能心理健康个人管理系统 — 基于 Electron + React 的桌面应用，完全离线运行，数据存储在本地。

> **版本** 0.0.4

## 功能概览

### 生产力工具

- **任务管理** — 优先级（紧急/高/中/低）、子任务、截止时间提醒、拖拽排序、自动延期、循环任务
- **习惯追踪** — 每日/每周/每月频率、连续打卡、可视化进度、图表统计
- **日记系统** — 日历视图、心情评分（1-5）、天气、标签、引导式写作、情感分析徽标
- **记忆库** — 从日记/任务自动提取记忆、AI 分类建议、搜索与整理
- **快速记录** — 悬浮快捷键一键唤起，快速记录想法/任务/日记
- **每日语录** — 激励语句展示

### AI 助理

- **本地 LLM** — Qwen3.5 0.8B（GGUF 格式），完全离线推理
- **流式输出** — 实时逐字显示回复
- **5 种语气模式** — 专业、友好、简洁、鼓励、心理咨询师
- **模式选择** — 快捷切换对话模式，适配不同场景
- **上下文感知** — 自动整合任务、日记、习惯、记忆、对话历史
- **对话记忆** — 长期记忆摘要，跨会话保持上下文
- **主动问候** — 基于行为分析主动关心（低落情绪、未写日记、习惯中断等）
- **CUDA 加速检测** — 自动检测 GPU 推理能力并显示状态
- **模型管理** — 下载/切换/状态监控界面
- **危机协议** — 所有 AI 提示词内置危机干预流程
- **Prompt 注入防御** — Unicode 规范化、零宽字符过滤、模式黑名单、长度限制

### 心理健康 — 被动监测

- **三层情感分析** — 关键词预筛 → ONNX 模型 → LLM 语义判断
- **PANAS 情绪模型** — 正负情感维度分析
- **行为模式分析** — 个人基线建立（≥7 天），检测情绪/任务/习惯/日记/打字行为偏差
- **综合风险评分** — 0-100 分，五级风险（低/中低/中/高/危急），五个信号源加权
- **C-SSRS 映射** — Columbia 自杀严重度评定量表框架集成

### 心理健康 — 主动工具

- **临床量表** — PHQ-9（抑郁）、GAD-7（焦虑）、PSS-10（压力），完整评估页面
- **CBT 思维记录** — 七步认知重构
- **呼吸练习** — 4-7-8 呼吸、方块呼吸、腹式呼吸、共振频率呼吸
- **正念冥想** — 引导式冥想会话
- **个性化干预建议** — 基于健康档案的规则引擎推荐
- **风险评估仪表盘** — 复合风险指数、信号源分析、个人基线对比

### 心理健康 — 危机干预

- **自动危机检测** — 从日记和对话内容识别危机信号
- **统一关键词表** — 集中管理的危机关键词，确保检测一致性
- **危机干预弹窗** — 5 秒倒计时防误关，集成中国心理援助热线
- **含蓄表达识别** — 针对中文文化中的隐晦危机表达（"想消失"、"撑不下去"等）
- **中文本土化** — 理解"我没事"、"还好"、"随便"等含蓄表达背后的真实情绪

### 学生群体适配

- **学期节奏识别** — 自动判断寒假/期中/期末/考试周等阶段
- **学业压力感知** — 基于校历的应激水平评估
- **专项心理支持** — 面向中国高校学生的定制化干预策略

### 数据与报告

- **日/周/月报告** — AI 生成分析报告，任务完成率、情绪趋势、习惯图表
- **健康雷达图** — 六维可视化（情绪、压力、精力、社交、睡眠、自我关怀）
- **情绪热力图** — 12 周情绪变化概览
- **情绪趋势图** — 多维情绪指标时间序列
- **情绪预测** — 基于历史数据的情感趋势预测

### 基础设施

- **LAN 同步** — 局域网设备间同步，QR 码连接，Token 认证
- **数据导出/导入** — 全量 JSON 备份（20 张表）
- **应用锁** — PBKDF2（10 万次迭代）密码保护，锁屏界面
- **双语界面** — 中文 / English
- **主题系统** — 跟随系统 / 浅色 / 深色，毛玻璃效果
- **自定义快捷键** — 可配置键盘快捷键
- **通知提醒** — 定时提醒（默认：晚 9 点日记、早 9 点习惯）
- **新手引导** — 4 步 Onboarding Tour

## 技术栈

| 层级 | 技术 |
|---|---|
| 桌面壳 | Electron 42（无边框窗口，自定义标题栏） |
| 前端框架 | React 18.3 + TypeScript 5.5 |
| 构建工具 | Vite 5.4 |
| 路由 | react-router-dom 6.26（HashRouter） |
| 状态管理 | Zustand 4.5（9 个 store，persist 中间件） |
| 客户端数据库 | Dexie 4（IndexedDB ORM，21 张表，9 个 schema 版本） |
| 样式 | Tailwind CSS 3.4（毛玻璃主题） |
| 图表 | Recharts 2.12 |
| 图标 | lucide-react |
| 本地 AI 推理 | node-llama-cpp 3.18（Qwen3.5 0.8B GGUF） |
| 情感分析 | onnxruntime-node 1.26（ONNX 模型） |
| Markdown | react-markdown + remark-gfm |
| Toast | react-hot-toast |
| 测试 | Vitest + @testing-library/react + jsdom |

## 开发

### 环境要求

- Node.js ≥ 18
- Windows 10/11（GPU 加速需支持 Vulkan 的显卡）

### 安装与运行

```bash
cd pc

# 安装依赖
npm install

# 开发模式（Vite + Electron 并行）
npm run electron:dev

# 仅前端开发（浏览器预览）
npm run dev
```

### 构建与打包

```bash
# 构建前端 + 手动打包 Electron
npm run pack

# 构建 + electron-builder（NSIS 安装包）
npm run dist

# 单独构建安装包
npm run installer
```

输出目录：`pc/release/FriendOS/`

### 测试

```bash
npm run test           # 运行所有测试
npm run test:watch     # 监听模式
npm run test:coverage  # 覆盖率报告
```

## 项目结构

```
FriendOS/
├── pc/
│   ├── electron/                 # Electron 主进程
│   │   ├── main.cjs              # 入口，IPC 处理
│   │   ├── preload.cjs           # Context Bridge
│   │   └── services/             # 主进程服务
│   │       ├── LocalModelService.cjs          # LLM 推理
│   │       ├── SentimentService.cjs           # 情感分析
│   │       ├── EmotionAnalysisEngine.cjs      # 情绪引擎
│   │       ├── BehaviorAnalyzer.cjs           # 行为分析
│   │       ├── RiskScoringEngine.cjs          # 风险评分
│   │       ├── NotificationService.cjs        # 通知服务
│   │       ├── ModelRegistry.cjs              # 模型注册
│   │       ├── ApiKeyStore.cjs                # 加密存储
│   │       └── crisisKeywords.cjs             # 危机关键词表
│   ├── src/
│   │   ├── pages/                # 页面（14 个路由）
│   │   │   ├── DashboardPage     # 仪表盘首页
│   │   │   ├── TasksPage         # 任务管理
│   │   │   ├── HabitsPage        # 习惯追踪
│   │   │   ├── DiaryPage         # 日记系统
│   │   │   ├── MemoriesPage      # 记忆库
│   │   │   ├── AssistantPage     # AI 对话
│   │   │   ├── EmotionPage       # 情绪仪表盘
│   │   │   ├── TherapyPage       # 心理工具
│   │   │   ├── AssessmentPage    # 临床量表
│   │   │   ├── RiskDashboardPage # 风险评估
│   │   │   ├── ReportsPage       # 数据报告
│   │   │   ├── SyncPage          # 同步管理
│   │   │   ├── SettingsPage      # 设置
│   │   │   └── WelcomePage       # 欢迎页
│   │   ├── components/           # UI 组件
│   │   │   ├── layout/           # 布局（侧边栏、标题栏、状态栏）
│   │   │   ├── common/           # 通用（20+ 组件：Button, Modal, Card, Skeleton 等）
│   │   │   ├── ai/               # AI（设置、模型、问候、模式选择、CUDA 状态）
│   │   │   ├── assistant/        # AI 对话面板（聊天、消息气泡、空状态）
│   │   │   ├── crisis/           # 危机干预（弹窗、热线卡片）
│   │   │   ├── dashboard/        # 仪表盘（今日任务、日记概览、快速统计等）
│   │   │   ├── diary/            # 日记（编辑器、日历、列表、情感选择）
│   │   │   ├── habits/           # 习惯（卡片）
│   │   │   ├── tasks/            # 任务（输入框、自动延期横幅）
│   │   │   ├── memories/         # 记忆（卡片、编辑器）
│   │   │   ├── quick-capture/    # 快速记录（弹窗、类型徽标）
│   │   │   ├── emotion/          # 情绪（趋势图、热力图、健康雷达、预测）
│   │   │   ├── assessment/       # 评估（PHQ-9、GAD-7、PSS-10 表单）
│   │   │   ├── therapy/          # 治疗（呼吸练习、正念、思维记录）
│   │   │   └── reports/          # 报告（图表、统计卡片、周报）
│   │   ├── services/             # 前端业务服务
│   │   │   ├── ai/               # AI 服务（AIService, ContextService, Proactive 等）
│   │   │   ├── emotion/          # 情绪服务（预测、健康档案、本土化、学生适配）
│   │   │   └── memory/           # 记忆服务（候选提取、分类建议）
│   │   ├── stores/               # Zustand 状态管理（9 个 store）
│   │   ├── hooks/                # React Hooks（16 个自定义 hooks）
│   │   ├── db/                   # Dexie 数据库定义（21 张表，9 个 schema 版本）
│   │   ├── i18n/                 # 国际化（中/英）
│   │   └── types/                # TypeScript 类型定义
│   ├── models/                   # 模型文件
│   │   └── sentiment/            # ONNX 情感模型
│   ├── scripts/                  # 构建脚本
│   └── package.json
├── 索引/                          # 项目索引文档
└── README.md
```

## 数据库

基于 Dexie（IndexedDB 封装），当前 schema 版本 **v9**，共 **20 张表**：

| 分类 | 表 | 说明 |
|---|---|---|
| 生产力 | tasks | 任务（含子任务、拖拽排序） |
| 生产力 | habits | 习惯定义 |
| 生产力 | habitLogs | 习惯打卡记录 |
| 生产力 | categories | 分类 |
| 日记 | diaries | 日记条目 |
| 情绪 | emotionRecords | 情绪记录 |
| 情绪 | behaviorRecords | 行为记录 |
| 健康 | healthProfiles | 健康档案 |
| 健康 | assessments | 临床评估（PHQ-9/GAD-7/PSS-10） |
| 健康 | therapyRecords | 治疗记录 |
| 记忆 | memories | 记忆条目 |
| 记忆 | memoryCandidates | 候选记忆 |
| 记录 | dailyRecords | 每日汇总 |
| 记录 | quickCaptures | 快速记录 |
| 记录 | crisisLogs | 危机日志 |
| AI | conversations | 完整对话历史 |
| AI | conversationSummaries | 对话摘要 |
| 系统 | syncLogs | 同步日志 |
| 系统 | feedbackLogs | 用户反馈 |
| 系统 | quotes | 每日语录 |

## 安全设计

- **无边框窗口** — 自定义标题栏，无原生菜单
- **CSP 策略** — 开发/生产环境分别配置
- **Context Isolation** — 启用，nodeIntegration 禁用
- **导航拦截** — 阻止加载非白名单 URL
- **同步服务** — CORS 限制局域网 IP，Token 10 分钟过期，1MB 请求体限制
- **API Key 加密** — Electron safeStorage（Windows DPAPI）
- **应用锁** — PBKDF2 + 随机盐，10 万次迭代

## 许可证

私人项目，未公开发布。
