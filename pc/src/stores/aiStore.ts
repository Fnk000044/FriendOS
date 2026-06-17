import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIConfig, ChatMessage, ToneType, ProviderType, LocalModel } from '../services/ai/types';

interface AIStore {
  config: AIConfig;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  localModelReady: boolean;
  setConfig: (config: Partial<AIConfig>) => void;
  setLocalModel: (model: LocalModel | null) => void;
  setLocalModelReady: (ready: boolean) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

const defaultConfig: AIConfig = {
  provider: 'local',
  tone: 'friendly',
  apiKey: '',
  onlineProvider: 'deepseek',
  model: 'deepseek-v4-flash',
  localModel: null,
  localModelPath: '',
};

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      config: defaultConfig,
      messages: [],
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
            id,
            timestamp: new Date().toISOString(),
          };
          return {
            messages: [...state.messages, newMsg],
          };
        });
        return id;
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'lifeos_ai_config',
      partialize: (state) => {
        const recentMessages = state.messages.slice(-50);
        // API Key 仅存储在 Electron safeStorage 中，不写入 localStorage
        const { apiKey: _apiKey, ...configWithoutKey } = state.config;
        return { config: configWithoutKey, messages: recentMessages };
      },
    }
  )
);
