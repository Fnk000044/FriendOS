import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIConfig, ChatMessage, ToneType, LocalModel } from '../services/ai/types';
import { db } from '../db';

interface AIStore {
  config: AIConfig;
  messages: ChatMessage[];
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;
  localModelReady: boolean;
  setConfig: (config: Partial<AIConfig>) => void;
  setLocalModel: (model: LocalModel | null) => void;
  setLocalModelReady: (ready: boolean) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  startNewConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
}

const defaultConfig: AIConfig = {
  provider: 'local',
  tone: 'friendly',
  model: 'qwen3.5:0.8b',
  localModel: null,
  localModelPath: '',
};

const MAX_MESSAGES = 200;

// debounce 落库当前会话
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(getMessages: () => ChatMessage[], getId: () => string | null) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    persistTimer = null;
    const id = getId();
    const messages = getMessages();
    if (!id || messages.length === 0) return;
    const title = messages.find(m => m.role === 'user')?.content.slice(0, 20) || '新对话';
    const now = new Date().toISOString();
    try {
      const existing = await db.conversations.get(id);
      if (existing) {
        await db.conversations.update(id, { messages, title, updatedAt: now });
      } else {
        await db.conversations.put({ id, title, messages, createdAt: now, updatedAt: now });
      }
    } catch (err) {
      console.error('[aiStore] persist conversation failed:', err);
    }
  }, 800);
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      messages: [],
      activeConversationId: null,
      loading: false,
      error: null,
      localModelReady: false,

      setConfig: (partial) =>
        set((state) => ({
          config: { ...state.config, ...partial },
        })),

      setLocalModel: (model) =>
        set((state) => ({
          config: { ...state.config, localModel: model },
        })),

      setLocalModelReady: (ready) => set({ localModelReady: ready }),

      addMessage: (msg) => {
        const id = crypto.randomUUID();
        set((state) => {
          const newMsg = {
            ...msg,
            content: msg.content || '',
            id,
            timestamp: new Date().toISOString(),
          };
          let messages = [...state.messages, newMsg];
          if (messages.length > MAX_MESSAGES) {
            messages = messages.slice(messages.length - MAX_MESSAGES);
          }
          // 若无活跃会话 id，自动创建一个
          const activeConversationId = state.activeConversationId ?? crypto.randomUUID();
          return { messages, activeConversationId };
        });
        schedulePersist(() => get().messages, () => get().activeConversationId);
        return id;
      },

      updateMessage: (id, content) => {
        set((state) => ({
          messages: state.messages.map(m => m.id === id ? { ...m, content } : m),
        }));
        schedulePersist(() => get().messages, () => get().activeConversationId);
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      clearMessages: () => {
        // 语义升级：新开对话
        get().startNewConversation();
      },

      startNewConversation: () => {
        // 先落库当前会话（如有）
        const { messages, activeConversationId } = get();
        if (activeConversationId && messages.length > 0) {
          const title = messages.find(m => m.role === 'user')?.content.slice(0, 20) || '新对话';
          const now = new Date().toISOString();
          db.conversations.get(activeConversationId).then(existing => {
            if (existing) {
              db.conversations.update(activeConversationId, { messages, title, updatedAt: now });
            } else {
              db.conversations.put({ id: activeConversationId, title, messages, createdAt: now, updatedAt: now });
            }
          }).catch(() => { /* ignore */ });
        }
        if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
        set({ messages: [], activeConversationId: null });
      },

      loadConversation: async (id) => {
        try {
          const conv = await db.conversations.get(id);
          if (conv) {
            if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
            set({ messages: conv.messages, activeConversationId: id });
          }
        } catch (err) {
          console.error('[aiStore] load conversation failed:', err);
        }
      },
    }),
    {
      name: 'lifeos_ai_config',
      partialize: (state) => ({
        config: state.config,
        activeConversationId: state.activeConversationId,
        // 不再持久化 messages body：启动时由 App.tsx 调 startNewConversation 进入新会话
      }),
    }
  )
);
