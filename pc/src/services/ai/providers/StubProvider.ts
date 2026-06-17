import type { AIProvider, AIProviderConfig } from '../types';

const responses = {
  greeting: [
    '你好！我是你的个人 AI 助理，有什么想聊的吗？',
    'Hi！我已经准备好帮你分析了，今天想聊点什么？',
    '你好！需要我帮你看看今天的计划和状态吗？',
  ],
  planAnalysis: [
    '根据今天的记录，你有 {pendingTasks} 项待办任务。其中 {overdueTasks} 项已过期，建议优先处理。最近的日记显示你的状态不错，继续保持！',
    '看了一下你的计划，今天共有 {totalTasks} 项任务，已完成 {completedTasks} 项。习惯打卡完成率 {habitRate}%，整体节奏不错。',
    '分析完毕！今日核心任务 {pendingTasks} 项，建议按优先级逐个击破。另外你的日记中提到了一些反思，值得深入整理到记忆库中。',
  ],
  status: [
    '最近一周你写了 {diaryCount} 篇日记，心情趋势：{moodTrend}。完成习惯打卡 {habitCompleted}/{habitTotal} 次。整体来看状态平稳。',
    '我查看了你的近况：{diaryCount} 篇日记，心情趋势 {moodTrend}，习惯完成率 {habitRate}%。有什么需要我帮忙梳理的吗？',
  ],
  memory: [
    '最近你收录了 {memoryCount} 条记忆，值得回顾一下。如果你想深入某个主题，我可以帮你分析。',
    '你的记忆库新增了 {memoryCount} 条内容，建议定期整理和回顾，这样能更好地沉淀知识。',
  ],
  default: [
    '好的，我来思考一下。基于你最近的记录，我的建议是：保持当前的节奏，优先处理重要且紧急的任务，同时留出时间做深度思考。',
    '收到你的消息了。从你的数据来看，整体状态良好。建议你每天留出 15 分钟做复盘和规划，这样能更好地掌控进度。',
    '谢谢分享！从你的日常记录中，我能感受到你在持续进步。记得定期回顾和整理，把经验沉淀到记忆库中。',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(value);
  }
  return result;
}

export class StubProvider implements AIProvider {
  readonly name = 'Stub Provider';
  readonly type = 'stub' as const;

  async initialize(_config: AIProviderConfig): Promise<void> {
    // No-op: stub doesn't need initialization
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available offline
  }

  async chat(messages: { role: string; content: string }[], context?: string): Promise<string> {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Parse context for dynamic responses
    const vars: Record<string, string> = {};
    if (context) {
      const lines = context.split('\n');
      for (const line of lines) {
        const [key, ...rest] = line.split(':');
        if (key && rest.length) {
          vars[key.trim()] = rest.join(':').trim();
        }
      }
    }

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Select response category based on message content
    if (lastMsg.includes('分析') || lastMsg.includes('计划') || lastMsg.includes('plan') || lastMsg.includes('analyze')) {
      return fill(pick(responses.planAnalysis), vars);
    }
    if (lastMsg.includes('状态') || lastMsg.includes('近况') || lastMsg.includes('status') || lastMsg.includes('how')) {
      return fill(pick(responses.status), vars);
    }
    if (lastMsg.includes('记忆') || lastMsg.includes('memory') || lastMsg.includes('回顾')) {
      return fill(pick(responses.memory), vars);
    }
    if (lastMsg.includes('你好') || lastMsg.includes('hello') || lastMsg.includes('hi')) {
      return pick(responses.greeting);
    }
    if (lastMsg.includes('帮助') || lastMsg.includes('help') || lastMsg.includes('能做什么')) {
      return '我可以帮你分析每日计划、总结近况、回顾记忆库中的内容。你可以问我"分析我的计划"或"看看我的状态"来试试看！';
    }

    return fill(pick(responses.default), vars);
  }
}
