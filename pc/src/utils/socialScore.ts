/**
 * socialScore.ts — 本地社交分数计算（P2-1）
 *
 * 与主进程 EmotionAnalysisEngine.cjs 的 calculateSocialScore 完全一致
 * （相同关键词表 + 相同计分规则：命中一次 +10，上限 100）。
 * 日记保存时社交分数无需再走 IPC + ONNX 推理——这是"保存时重复跑第二次
 * ONNX"的来源之一，改为纯本地关键词计数后每次保存省一次 IPC + 推理。
 */

const SOCIAL_KEYWORDS = [
  '朋友', '家人', '同学', '同事', '聚会', '聊天', '见面', '约会', '社交', '交流',
  '陪伴', '关心', '支持', '理解', '包容', '信任', '亲密', '友好', '和睦', '融洽',
  '默契', '孤独', '寂寞', '孤立', '排斥',
];

export function calculateSocialScore(text: string | undefined | null): number {
  if (!text) return 0;
  const cleanText = text.replace(/[，。！？、；：""''（）【】《》\s,.!?;:()\[\]{}<>]/g, '');
  let score = 0;
  for (const keyword of SOCIAL_KEYWORDS) {
    if (cleanText.includes(keyword)) {
      score += 10;
    }
  }
  return Math.min(100, score);
}
