import { create } from 'zustand';
import type { RiskLevel } from '../db/models';

interface CrisisState {
  visible: boolean;
  riskLevel: RiskLevel | null;
  triggerSource: 'diary' | 'chat' | null;
  triggerContent: string;
  show: (riskLevel: RiskLevel, source: 'diary' | 'chat', content: string) => void;
  hide: () => void;
}

export const useCrisisStore = create<CrisisState>((set) => ({
  visible: false,
  riskLevel: null,
  triggerSource: null,
  triggerContent: '',
  show: (riskLevel, source, content) =>
    set({ visible: true, riskLevel, triggerSource: source, triggerContent: content }),
  hide: () =>
    set({ visible: false, riskLevel: null, triggerSource: null, triggerContent: '' }),
}));
