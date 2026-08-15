export type CaptureType = 'todo' | 'diary' | 'idea' | 'memory' | 'uncategorized';

interface KeywordRule {
  type: CaptureType;
  keywords: string[];
  weight: number;
}

const rules: KeywordRule[] = [
  {
    type: 'todo',
    keywords: [
      '需做', '要做', '记得', '务必', '必须', '完成', '处理', '安排', '计划',
      '买', '办', '联系', '提醒', '待办', '任务', '截止', 'deadline', 'todo',
      '需要', '应该', '得去',
    ],
    weight: 2,
  },
  {
    type: 'diary',
    keywords: [
      '今天', '感觉', '心情', '开心', '难过', '郁闷', '兴奋', '发生了',
      '遇到', '和朋友', '吃了', '去了', '看了', '听了', '今天天气',
    ],
    weight: 1.5,
  },
  {
    type: 'idea',
    keywords: [
      '想法', '灵感', '建议', '创意', '如果', '也许可以', '说不定',
      '优化', '改进', '点子', 'idea', 'maybe', 'perhaps', 'imagine',
    ],
    weight: 2,
  },
  {
    type: 'memory',
    keywords: [
      '知识', '学习', '学到', '发现', '原来', '原理', '方法', '技巧',
      '工具', '资源', '网站', '教程', '经验', '总结',
    ],
    weight: 1.5,
  },
];

export function classifyContent(content: string): CaptureType {
  if (!content.trim()) return 'uncategorized';

  const lower = content.toLowerCase();
  const scores: Record<CaptureType, number> = {
    todo: 0, diary: 0, idea: 0, memory: 0, uncategorized: 0,
  };

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[rule.type] += rule.weight;
      }
    }
  }

  const threshold = 2;
  const entries = Object.entries(scores) as [CaptureType, number][];
  entries.sort((a, b) => b[1] - a[1]);

  return entries[0][1] >= threshold ? entries[0][0] : 'uncategorized';
}
