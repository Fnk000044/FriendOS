import { create } from 'zustand';

export type ChatProviderStatus = 'cloud' | 'fallback' | 'connecting' | 'error';

export interface ChatMessageState {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  method?: 'cloud' | 'fallback' | 'greeting';
  emotionLabel?: string;
  crisisFlag?: boolean;
  streaming?: boolean;
}

<<<<<<< HEAD
// 情感感知多轮对话：会话状态（与 electron.d.ts 的 ChatSessionState 保持一致）
export interface ChatSessionState {
  turnCount: number;
  emotionHistory: string[];      // FIFO 10
  topics: string[];              // 最多 5
  summary: string;               // 上下文摘要（截断 60 字）
  usedTemplates: string[];       // 会话内已用模板标识（去重用）
  dominantEmotion: string;       // negative/neutral/positive
}

// 会话增量（主进程 ChatFallbackEngine 返回，渲染层合并）
export interface ChatSessionDelta {
  turnCount?: number;
  emotionHistory?: string[];
  topics?: string[];
  summary?: string;
  usedTemplates?: string[];
  dominantEmotion?: string;
}

export function createEmptySession(): ChatSessionState {
  return {
    turnCount: 0,
    emotionHistory: [],
    topics: [],
    summary: '',
    usedTemplates: [],
    dominantEmotion: 'neutral',
  };
}

/** 历史会话概要（conversations 表投影） */
export interface ChatSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export function mergeSessionDelta(
  session: ChatSessionState,
  delta: ChatSessionDelta | undefined
): ChatSessionState {
  if (!delta) return session;
  return {
    turnCount: typeof delta.turnCount === 'number' ? delta.turnCount : session.turnCount,
    emotionHistory: delta.emotionHistory ?? session.emotionHistory,
    topics: delta.topics ?? session.topics,
    summary: typeof delta.summary === 'string' ? delta.summary : session.summary,
    usedTemplates: delta.usedTemplates ?? session.usedTemplates,
    dominantEmotion: typeof delta.dominantEmotion === 'string' ? delta.dominantEmotion : session.dominantEmotion,
  };
}

interface ChatState {
  messages: ChatMessageState[];
  currentSessionId: string | null;
  /** 历史会话概要列表（id/title/updatedAt），按更新时间倒序 */
  sessions: ChatSessionSummary[];
=======
interface ChatState {
  messages: ChatMessageState[];
  currentSessionId: string | null;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  isStreaming: boolean;
  providerStatus: ChatProviderStatus;
  errorMessage: string | null;
  hasGreetedToday: boolean;
<<<<<<< HEAD
  /** 情感感知多轮对话会话状态（渲染层权威，随 chatFallback 传入/回传） */
  session: ChatSessionState;
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  setMessages: (msgs: ChatMessageState[]) => void;
  addMessage: (msg: ChatMessageState) => void;
  appendToLast: (delta: string) => void;
  finalizeLast: (patch?: Partial<ChatMessageState>) => void;
  clearMessages: () => void;
  setSessionId: (id: string | null) => void;
<<<<<<< HEAD
  setSessions: (list: ChatSessionSummary[]) => void;
  setStreaming: (v: boolean) => void;
  setProviderStatus: (s: ChatProviderStatus, err?: string | null) => void;
  setHasGreetedToday: (v: boolean) => void;
  /** 更新会话状态（合并增量或直接覆盖） */
  updateSession: (delta: ChatSessionDelta) => void;
  /** 重置会话（clearMessages 同时调用） */
  resetSession: () => void;
=======
  setStreaming: (v: boolean) => void;
  setProviderStatus: (s: ChatProviderStatus, err?: string | null) => void;
  setHasGreetedToday: (v: boolean) => void;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}

// FIFO: 内存上限 200 条，超出截断（旧消息已落库）
const MAX_MESSAGES = 200;

function genId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentSessionId: null,
<<<<<<< HEAD
  sessions: [],
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  isStreaming: false,
  providerStatus: 'fallback',
  errorMessage: null,
  hasGreetedToday: false,
<<<<<<< HEAD
  session: createEmptySession(),
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

  setMessages: (msgs) =>
    set({ messages: msgs.slice(-MAX_MESSAGES) }),

  addMessage: (msg) =>
    set((s) => {
      const next = [...s.messages, msg];
      if (next.length > MAX_MESSAGES) next.splice(0, next.length - MAX_MESSAGES);
      return { messages: next };
    }),

  appendToLast: (delta) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, content: last.content + delta, streaming: true };
      return { messages: msgs };
    }),

  finalizeLast: (patch) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, streaming: false, ...patch };
      return { messages: msgs };
    }),

<<<<<<< HEAD
  clearMessages: () => set({ messages: [], errorMessage: null, session: createEmptySession() }),
  setSessionId: (id) => set({ currentSessionId: id }),
  setSessions: (list) => set({ sessions: list }),
  setStreaming: (v) => set({ isStreaming: v }),
  setProviderStatus: (s, err = null) => set({ providerStatus: s, errorMessage: err }),
  setHasGreetedToday: (v) => set({ hasGreetedToday: v }),
  updateSession: (delta) => set((s) => ({ session: mergeSessionDelta(s.session, delta) })),
  resetSession: () => set({ session: createEmptySession() }),
=======
  clearMessages: () => set({ messages: [], errorMessage: null }),
  setSessionId: (id) => set({ currentSessionId: id }),
  setStreaming: (v) => set({ isStreaming: v }),
  setProviderStatus: (s, err = null) => set({ providerStatus: s, errorMessage: err }),
  setHasGreetedToday: (v) => set({ hasGreetedToday: v }),
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}));

export { genId };
