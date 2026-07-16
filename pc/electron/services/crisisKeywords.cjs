/**
 * Crisis Keywords - 统一的危机关键词词表
 *
 * 此前危机关键词在三个文件重复定义且 exclusion 列表不同步：
 * - SentimentService.cjs
 * - RiskScoringEngine.cjs (calculateChatScore, calculateDiaryScore)
 *
 * 现统一从此处引用，确保关键词表一致、exclusion 同步
 */

// 危机关键词（直接触发危机检测）
const CRISIS_KEYWORDS = [
  '想死', '不想活', '自杀', '结束生命', '活着没意思',
  '想结束', '了结自己', '解脱', '离开这个世界', '消失',
  '伤害自己', '自我伤害', '自残', '割腕', '吞药',
  '跳楼', '跳下去', '了此一生', '生无可恋', '厌世',
  '活不下去', '撑不下去了', '不想面对', '世界没有我会更好',
  '我死了算了'
];

// 否定词（危机词前 5 字符窗口内出现则否定）
const NEGATION_WORDS = [
  '不会', '没有', '不想', '别', '莫', '不', '没', '勿',
  '并未', '并未', '未曾'
];

// 危机排除词（成语/网络用语误报，不触发危机）
// 注意：'想死了'/'想去死' 已从排除列表移除 —— 这些表达可能是真实危机信号，
// 关键词层命中即判 medium，交由 ONNX+Qwen 确认是否升级 high，避免漏报。
const CRISIS_EXCLUSIONS = [
  '九死一生', '生不如死', '笑死', '困死了', '无聊到想死',
  '烦死了', '笑死我了', '累死了', '急死了', '气死了',
  '热死了', '冷死了', '饿死了', '撑死了', '搞笑死了',
];

// 负面情感关键词（风险评分用）
const NEGATIVE_KEYWORDS = [
  '悲伤', '焦虑', '沮丧', '绝望', '无助', '痛苦',
  '孤独', '害怕', '紧张', '愤怒', '低落', '压抑'
];

module.exports = {
  CRISIS_KEYWORDS,
  NEGATION_WORDS,
  CRISIS_EXCLUSIONS,
  NEGATIVE_KEYWORDS,
};
