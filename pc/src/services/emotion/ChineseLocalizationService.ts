/**
 * Chinese Localization Service
 * 中文本土化服务，处理含蓄表达理解
 *
 * 参考：中国微博自杀意念检测研究、中文情感分析本土化研究
 */

// ── 含蓄表达理解 ──────────────────────────────────────────────
// 中国文化中，人们往往不会直接表达负面情绪
// "我没事"可能意味着"我很不好"

interface ImplicitExpression {
  expression: string;
  possibleMeanings: string[];
  contextClues: string[];
  suggestedResponse: string;
}

const IMPLICIT_EXPRESSIONS: ImplicitExpression[] = [
  {
    expression: '我没事',
    possibleMeanings: ['可能在掩饰真实感受', '不想让别人担心', '习惯性回应'],
    contextClues: ['语气低落', '回避话题', '简短回应'],
    suggestedResponse: '你说"没事"，但我感觉你可能有些心事。如果你想聊聊，我在这里。',
  },
  {
    expression: '还好',
    possibleMeanings: ['不太好但不想说', '一般般', '勉强应付'],
    contextClues: ['缺乏热情', '没有展开说', '转移话题'],
    suggestedResponse: '"还好"听起来不太确定，最近有什么让你不太舒心的事吗？',
  },
  {
    expression: '随便',
    possibleMeanings: ['失去兴趣', '感到无力', '不想做决定'],
    contextClues: ['多次使用', '对很多事情都无所谓', '缺乏动力'],
    suggestedResponse: '我注意到你对很多事情都说"随便"，是不是最近有些疲惫或迷茫？',
  },
  {
    expression: '都可以',
    possibleMeanings: ['无所谓', '放弃选择', '不想麻烦别人'],
    contextClues: ['被动回应', '没有偏好表达', '配合但不积极'],
    suggestedResponse: '你的感受很重要，有什么是你真正想要的吗？',
  },
  {
    expression: '算了',
    possibleMeanings: ['放弃', '感到无力', '不想继续'],
    contextClues: ['终止话题', '表达挫败', '失去希望'],
    suggestedResponse: '"算了"有时候是一种保护，但也可以是一种逃避。你想聊聊发生了什么吗？',
  },
  {
    expression: '你忙吧',
    possibleMeanings: ['不想打扰你', '感到孤独', '测试你是否真的关心'],
    contextClues: ['对话结束时', '语气失落', '主动结束交流'],
    suggestedResponse: '我不忙，你的事情对我来说很重要。有什么想说的吗？',
  },
  {
    expression: '没什么',
    possibleMeanings: ['不想说', '不知道怎么表达', '觉得说了也没用'],
    contextClues: ['被问到感受时', '回避直接回答', '沉默'],
    suggestedResponse: '有时候"没什么"其实"有什么"。如果你愿意，可以试着说说看。',
  },
];

/**
 * 检测含蓄表达
 * @param text - 用户文本
 * @returns 匹配的含蓄表达或 null
 */
export function detectImplicitExpression(text: string): ImplicitExpression | null {
  if (!text) return null;

  for (const expr of IMPLICIT_EXPRESSIONS) {
    if (text.includes(expr.expression)) {
      return expr;
    }
  }

  return null;
}
