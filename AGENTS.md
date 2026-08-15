# AGENTS.md

FriendOS 是一个本地优先、隐私优先的桌面心理健康应用（Electron + React 18 + TypeScript）。
本文件只列代理每次任务都需要的信息。完整人类文档见 `README.md` 与 `docs/`。

## 仓库布局

```
FriendOS/
├── pc/                # 桌面端唯一应用（Electron 主进程 + React 渲染层）
│   ├── src/           # 渲染层 TypeScript（React + Zustand + Dexie）
│   ├── electron/      # 主进程（CommonJS .cjs，沙箱 + contextBridge）
│   ├── scripts/       # 构建/打包/评估脚本（.cjs/.js，Node 运行）
│   ├── build/         # 构建产物（图标等）
│   ├── dist/          # vite build 输出
│   └── release/       # electron-builder 输出
<<<<<<< HEAD
├── docs/              # 人类可读架构文档（AI 科学依据 / 目录规范 / 离线冒烟测试）
│   ├── risk_methodology.md     # 风险预警方法说明（ML vs 统计、阈值来源、免责）
│   ├── model_card.md           # ONNX 情感模型卡
│   ├── eval_report.md          # 评估报告（混淆矩阵/错误分析/规则基线对比）
│   ├── external_validation.md  # 外部人工验证报告（脚本产出：docs/external_validation/）
│   ├── offline_smoke_test.md   # 打包版离线冒烟测试清单
│   ├── 目录整理规范.md          # 目录规范 + 新增/移动/清理清单
│   └── archive/               # 历史归档（含 _pdf_extract.txt）
=======
├── docs/              # 人类可读架构文档
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
├── 数据集*/  论文/  索引/   # 非代码资产，不要改
└── version            # 单行版本号（当前 0.0.4）
```

`pc/` 是 monorepo 内唯一的源码根，`pc/src`、`pc/electron`、`pc/scripts` 是三个源根。
其他顶层目录（数据集/论文/索引）是研究资产，非代码改动目标。

## 三个源根的边界与入口

### `pc/src` — 渲染层（React + TS）

- **入口**：`src/main.tsx` → `src/App.tsx`（HashRouter + 懒加载路由）
- **状态**：`src/stores/`（Zustand，8 个 store），渲染层状态权威
- **数据**：`src/db/`（Dexie / IndexedDB，20 张表），数据落在用户本地 IndexedDB
- **加密**：`src/db/crypto.ts`（AES-GCM 字段级加密，PBKDF2 100k）；加密密钥不进 IPC
- **路由**：`HashRouter` + `React.lazy` + `Suspense`，路由文件在 `src/pages/`
- **i18n**：`src/i18n/translations.ts` 是唯一文案源；新增字符串必须加 `TranslationKey`
  并同时补 zh-CN 和 en，否则 `t()` 会原样返回 key
- **动画降级**：统一走 `src/utils/reduceMotion.ts` 的 `shouldReduceMotion()`
  （只读应用开关）/ `prefersReducedMotion()`（含 OS 信号，仅危机音频用）。
  **不要**在新代码里直接 `window.matchMedia('(prefers-reduced-motion: reduce)')`，
  否则应用开关失效
- **测试基础设施**：`vitest` + `jsdom` + `fake-indexeddb`，setup 在 `src/test/setup.ts`。
  新增组件测试放 `__tests__/` 子目录，命名 `*.test.tsx`
- **不要**在渲染层 `require('electron')` 或访问 Node 模块；通过 `window.electronAPI` 调 IPC

### `pc/electron` — 主进程（CommonJS .cjs，沙箱）

- **入口**：`electron/main.cjs`（`app.whenReady` → `createWindow`）
- **preload**：`electron/preload.cjs` 必须保持**沙箱兼容**——只用 `contextBridge` +
  `ipcRenderer`，**禁止 `require`** 任何 Node 内置模块（fs/path/child_process 等），
  `process.platform` 也不可用，改走 `get-platform` IPC
- **IPC 约定**：所有主进程能力通过 `ipcMain.handle` 暴露，preload 用 `ipcRenderer.invoke`
  包装后 `contextBridge.exposeInMainWorld('electronAPI', ...)`。新 IPC 通道必须在
  `src/types/electron.d.ts` 的 `ElectronAPI` 接口里补类型
- **服务模块**：`electron/services/*.cjs`（RiskScoringEngine / SentimentService /
  ApiKeyStore / BehaviorAnalyzer / NotificationService），被 main.cjs 按需 `require`
- **安全**：`sandbox: true` + `contextIsolation: true` + `nodeIntegration: false` +
  严格 CSP（无外联域名）。新增外部网络请求需先评估 CSP
- **错误处理**：IPC catch 块用 `logError(op, err)`（见 main.cjs 顶部）写结构化日志，
  含 `operation` 字段；不要用裸 `console.error`
- **测试**：`electron/**` 用 vitest `node` 环境（见 `vitest.config.ts`），
  `.cjs` 模块用 `createRequire` 加载

### `pc/scripts` — 构建与评估脚本（Node）

- **入口**：每个 `.cjs`/`.js` 是独立可执行脚本，无统一入口
- **用途**：`build-installer.cjs` / `package-manual.js`（打包）、
  `generate-ico.cjs`（图标）、`eval-sentiment.cjs` / `eval-risk.cjs`（评估）、
<<<<<<< HEAD
  `external_validation.cjs`（外部人工验证抽样 + 一致率）、
  `train_sentiment/`（训练）
- **运行**：`node scripts/<name>.cjs`，工作目录是 `pc/`
- **约束**：不依赖渲染层或主进程的运行时；只读 `pc/dist`、`pc/build`、`pc/models`、`docs/external_validation`
=======
  `train_sentiment/`（训练）
- **运行**：`node scripts/<name>.cjs`，工作目录是 `pc/`
- **约束**：不依赖渲染层或主进程的运行时；只读 `pc/dist`、`pc/build`、`pc/models`
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
- **不要**把这些脚本当作应用代码引入 `src/` 或 `electron/`

## 跨源根约束

1. **类型契约单一来源**：`pc/src/types/electron.d.ts` 的 `ElectronAPI` 接口是
   主进程↔渲染层的唯一类型契约。preload 新增方法必须同步更新此文件
2. **数据流向**：渲染层（IndexedDB）↔ 主进程（IPC）↔ 服务模块（.cjs）。
   主进程不直接读写 IndexedDB；服务模块不直接调 IPC
3. **不引云**：仓库内 `SentimentService.cloudAnalyze` 是空实现，
   `ReportAIService` 只走规则引擎。不要假设有云 LLM 可用；
   如需接入须先评估 CSP 并显式确认
4. **加密本地**：所有用户敏感数据（日记内容、API Key）落盘前经 `crypto.ts` 加密，
   密钥派生自用户密码，不进 IPC、不进日志

## 常用命令（在 `pc/` 下执行）

```bash
npm run dev          # vite dev server
npm run test         # vitest run（全量，含 electron 服务测试）
npm run test:watch   # vitest watch
npm run build        # vite build（渲染层产物，不打包 exe）
npm run lint         # eslint src（最小规则）
npm run typecheck    # tsc --noEmit
npm run dist         # vite build + electron-builder（产出 exe）
<<<<<<< HEAD
npm run eval:external # 外部人工验证抽样（scripts/external_validation.cjs）
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
```

## 提交与分支

- 主分支 `main`，PR 目标分支默认 `main`
- 提交前必跑：`npm run test` + `npm run typecheck`（在 `pc/`）
- 类型错误若为历史遗留（与本次 diff 无关），在 PR 描述里列出，不要顺手修无关代码
- 不要 commit `pc/release/`、`pc/dist/`、`pc/node_modules/`（已在 .gitignore）

## 代理任务路由速查

| 任务类型 | 改哪里 | 先读 |
|---|---|---|
| UI / 交互 / 文案 | `pc/src/` | `App.tsx`、`stores/`、`i18n/translations.ts` |
| IPC / 主进程能力 | `pc/electron/main.cjs` + `preload.cjs` | `src/types/electron.d.ts` |
| 加密 / 数据库 schema | `pc/src/db/` | `crypto.ts`、`models.ts`、`index.ts` |
| 风险评分算法 | `pc/electron/services/RiskScoringEngine.cjs` | 同目录 `__tests__/` |
| 动画 / 无障碍 | `pc/src/utils/reduceMotion.ts`、`src/index.css` | `useAppearanceStore.ts` |
| 打包 / 安装器 | `pc/scripts/` | `build-installer.cjs` |
