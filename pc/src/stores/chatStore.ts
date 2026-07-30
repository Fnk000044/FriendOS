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

interface ChatState {
  messages: ChatMessageState[];
  currentSessionId: string | null;
  isStreaming: boolean;
  providerStatus: ChatProviderStatus;
  errorMessage: string | null;
  hasGreetedToday: boolean;

  setMessages: (msgs: ChatMessageState[]) => void;
  addMessage: (msg: ChatMessageState) => void;
  appendToLast: (delta: string) => void;
  finalizeLast: (patch?: Partial<ChatMessageState>) => void;
  clearMessages: () => void;
  setSessionId: (id: string | null) => void;
  setStreaming: (v: boolean) => void;
  setProviderStatus: (s: ChatProviderStatus, err?: string | null) => void;
  setHasGreetedToday: (v: boolean) => void;
}

// FIFO: 内存上限 200 条，超出截断（旧消息已落库）
const MAX_MESSAGES = 200;

function genId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentSessionId: null,
  isStreaming: false,
  providerStatus: 'fallback',
  errorMessage: null,
  hasGreetedToday: false,

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

  clearMessages: () => set({ messages: [], errorMessage: null }),
  setSessionId: (id) => set({ currentSessionId: id }),
  setStreaming: (v) => set({ isStreaming: v }),
  setProviderStatus: (s, err = null) => set({ providerStatus: s, errorMessage: err }),
  setHasGreetedToday: (v) => set({ hasGreetedToday: v }),
}));

export { genId };
