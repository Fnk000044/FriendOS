const categoryKeywords: Record<string, string[]> = {
  '学习笔记': ['学习', '学到', '知识', '教程', '课程', '读书', '阅读', '书', '笔记', '方法', '技巧', '技能'],
  '生活感悟': ['感悟', '人生', '生活', '成长', '改变', '体会', '领悟', '反思', '心情'],
  '工作经验': ['工作', '项目', '经验', '总结', '方案', '需求', 'bug', '优化', '技术', '代码', '架构'],
  '健康生活': ['健康', '运动', '跑步', '健身', '饮食', '作息', '睡眠', '冥想', '习惯'],
  '灵感创意': ['灵感', '创意', '想法', '点子', '创新', '设想', '策划', '计划'],
};

const defaultCategories = ['默认', '学习笔记', '生活感悟', '工作经验', '健康生活', '灵感创意'];

export function suggestCategory(content: string, title?: string): string {
  const text = `${title || ''} ${content}`.toLowerCase();
  let bestMatch = '默认';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}

export function suggestTags(content: string): string[] {
  const tags: string[] = [];
  const text = content.toLowerCase();

  const tagRules: [string, string[]][] = [
    ['学习', ['学习', '学到', '课程', '教程']],
    ['读书', ['读书', '阅读', '书']],
    ['工作', ['工作', '项目', '需求']],
    ['健康', ['健康', '运动', '跑步', '健身']],
    ['技术', ['技术', '代码', '编程', 'bug']],
    ['灵感', ['灵感', '创意', '想法']],
    ['反思', ['反思', '感悟', '体会', '领悟']],
  ];

  for (const [tag, keywords] of tagRules) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.push(tag);
        break;
      }
    }
  }

  return tags.slice(0, 4);
}

export { defaultCategories };
