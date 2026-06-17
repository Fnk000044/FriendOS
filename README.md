# FriendOS

全功能个人管理系统 - 基于 Electron + React 的桌面应用

## 功能

- **任务管理** - 创建、组织和追踪任务
- **习惯追踪** - 培养好习惯，追踪每日进度
- **日记** - 记录每日心情和生活
- **记忆库** - 保存和组织重要记忆
- **AI 助手** - 内置本地 LLM（Qwen3 0.6B）
- **数据同步** - 多设备间同步数据
- **数据报告** - 可视化分析习惯、情绪和任务数据

## 技术栈

- **框架**: Electron 42 + React 18.3 + TypeScript 5.5
- **构建**: Vite 5.4
- **状态管理**: Zustand 4.5
- **样式**: Tailwind CSS 3.4
- **数据库**: Dexie 4 (IndexedDB ORM)
- **AI**: node-llama-cpp + onnxruntime-node

## 开发

```bash
cd pc

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 项目结构

```
pc/
├── src/
│   ├── pages/          # 页面组件
│   ├── components/      # UI 组件
│   ├── hooks/           # React Hooks
│   ├── stores/          # Zustand 状态
│   ├── db/              # Dexie 数据库
│   ├── services/        # 业务服务
│   └── electron/        # Electron 主进程
```

## 版本

当前版本: 0.0.3