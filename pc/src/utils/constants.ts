export const PRIORITY_LABELS = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
} as const;

export const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#94A3B8',
} as const;

export const MOOD_LABELS: Record<number, string> = {
  1: '很差',
  2: '不好',
  3: '一般',
  4: '不错',
  5: '很棒',
};

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😡',
  2: '😞',
  3: '😐',
  4: '😊',
  5: '😄',
};

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const DEFAULT_CATEGORIES = [
  { name: '默认', color: '#14B8A6' },
  { name: '工作', color: '#3B82F6' },
  { name: '学习', color: '#8B5CF6' },
  { name: '生活', color: '#22C55E' },
  { name: '健康', color: '#F59E0B' },
];
