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

// ── 危机伦理统一话术与热线（P0-7）─────────────────────────────
// 危机文本恒走固定回复（热线 + 安全确认 + 不替代专业医疗），不允许模板随机化绕过。
export const CRISIS_HOTLINES = [
  { name: '全国心理援助热线', number: '400-161-9995', desc: '24 小时' },
  { name: '全国统一心理援助热线', number: '12356', desc: '24 小时' },
  { name: '北京心理危机研究与干预中心', number: '010-82951332', desc: '24 小时' },
] as const;

export const CRISIS_DISCLAIMER = '我不能替代专业医疗。如果你正在经历痛苦时刻，请立即联系专业机构或拨打上方热线。';

export const CRISIS_RESPONSE_TEXT =
  '我注意到你现在可能很难受。我想先确认一件事——你现在安全吗？' +
  '我不能替代专业医疗。如果你正在经历很痛苦的时刻，请拨打全国心理援助热线 400-161-9995 或 12356，' +
  '那里有人 24 小时愿意听你说。你不是一个人。';

// ── 风险评分信号权重（与 RiskScoringEngine.cjs WEIGHTS 对齐，P0-3）──
export const RISK_SIGNAL_WEIGHTS = {
  emotion: 0.30,
  behavior: 0.25,
  assessment: 0.25,
  chat: 0.10,
  diary: 0.10,
} as const;

// ── 演示数据故事线（30 天确定性，P0-2）────────────────────────
// 故事线：正常(10d) → 压力(8d) → 焦虑(6d) → 危机(2d) → 恢复(4d)，含 2 次预警事件
export const DEMO_STORY_DAYS = 30;

export const DEMO_STORY_PHASES = [
  { name: 'normal', days: 10 },
  { name: 'stress', days: 8 },
  { name: 'anxiety', days: 6 },
  { name: 'crisis', days: 2 },
  { name: 'recovery', days: 4 },
] as const;

export const DEMO_STORAGE_KEY = 'friendos_demo_injected';
