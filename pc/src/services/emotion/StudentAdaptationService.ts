/**
 * Student Adaptation Service
 * 为中国学生群体提供专门的心理健康适配功能
 *
 * 参考：
 * - Unlocking Mental Health (2025) - 大学生心理健康研究
 * - Predicting College Mental Health (2025) - 学业压力预测
 * - 中国青少年心理健康调查
 *
 * 0.0.6 改进：detectSemesterPhase 现优先读用户配置的校历
 *   （getTermConfig），未配置时回退到硬编码月份。
 *   新增 getTermPhaseDescription / getAcademicStressMultiplier。
 */

import { formatLocalDate } from '../../utils/date';

// ── 用户可配置校历 ────────────────────────────────────────────

export interface TermConfig {
  termStart: string;
  examWeekStart: string;
  examWeekEnd: string;
  vacationStart?: string;
}

const TERM_STORAGE_KEY = 'friendos_term_config';

/**
 * 读取学期配置（用户设置页配置）
 */
export function getTermConfig(): TermConfig | null {
  try {
    const raw = localStorage.getItem(TERM_STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    if (!cfg.termStart || !cfg.examWeekStart || !cfg.examWeekEnd) return null;
    return cfg;
  } catch {
    return null;
  }
}

/**
 * 保存学期配置
 */
export function setTermConfig(cfg: TermConfig): void {
  localStorage.setItem(TERM_STORAGE_KEY, JSON.stringify(cfg));
}

// ── 学期节奏识别 ──────────────────────────────────────────────

export type SemesterPhase = 'vacation' | 'regular' | 'midterm' | 'final' | 'exam_week';

interface SemesterInfo {
  phase: SemesterPhase;
  label: string;
  stressLevel: number; // 0-100
  description: string;
}

/**
 * 识别当前学期阶段
 * 优先读用户配置的校历，未配置时回退到硬编码中国高校典型校历。
 */
export function detectSemesterPhase(date: Date = new Date()): SemesterInfo {
  // 1. 优先读用户配置
  const cfg = getTermConfig();
  if (cfg) {
    return detectFromConfig(cfg, date);
  }

  // 2. 回退：硬编码月份
  return detectFromHardcodedMonth(date);
}

function detectFromConfig(cfg: TermConfig, date: Date): SemesterInfo {
  const today = formatLocalDate(date);

  if (cfg.vacationStart && today >= cfg.vacationStart) {
    return { phase: 'vacation', label: '假期', stressLevel: 20, description: '假期休息期，适当放松' };
  }
  if (today > cfg.examWeekEnd) {
    return { phase: 'regular', label: '考后休整', stressLevel: 35, description: '考试结束，调整状态' };
  }
  if (today >= cfg.examWeekStart && today <= cfg.examWeekEnd) {
    return { phase: 'exam_week', label: '期末考试周', stressLevel: 95, description: '高压时期，务必保证睡眠和饮食' };
  }

  const examStart = new Date(cfg.examWeekStart);
  const preExamStart = new Date(examStart);
  preExamStart.setDate(preExamStart.getDate() - 14);
  const preExamStartStr = formatLocalDate(preExamStart);
  if (today >= preExamStartStr && today < cfg.examWeekStart) {
    const daysToExam = Math.max(0, Math.ceil((examStart.getTime() - date.getTime()) / 86400000));
    const progress = Math.max(0, Math.min(1, 1 - daysToExam / 14));
    return {
      phase: 'final',
      label: '期末复习期',
      stressLevel: Math.round(60 + progress * 25),
      description: `距考试还有 ${daysToExam} 天，注意劳逸结合`,
    };
  }

  const termStartPlus14 = new Date(cfg.termStart);
  termStartPlus14.setDate(termStartPlus14.getDate() + 14);
  if (today >= cfg.termStart && today < formatLocalDate(termStartPlus14)) {
    return { phase: 'regular', label: '开学初', stressLevel: 45, description: '适应期，逐步调整状态' };
  }

  return { phase: 'regular', label: '正常学期', stressLevel: 50, description: '正常学习期' };
}

function detectFromHardcodedMonth(date: Date): SemesterInfo {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // 寒假 (1月中-2月底)
  if ((month === 1 && day >= 15) || (month === 2 && day <= 28)) {
    return { phase: 'vacation', label: '寒假', stressLevel: 20, description: '假期休息期，适当放松' };
  }

  // 暑假 (7月-8月)
  if (month === 7 || month === 8) {
    return { phase: 'vacation', label: '暑假', stressLevel: 15, description: '假期休息期，注意规律作息' };
  }

  // 期中考试周 (4月中、10月中)
  if ((month === 4 && day >= 10 && day <= 20) || (month === 10 && day >= 10 && day <= 20)) {
    return { phase: 'midterm', label: '期中考试周', stressLevel: 65, description: '考试期间，注意劳逸结合' };
  }

  // 期末考试周 (1月上旬、6月下旬-7月上旬)
  if ((month === 1 && day <= 14) || (month === 6 && day >= 20) || (month === 7 && day <= 10)) {
    return { phase: 'final', label: '期末考试周', stressLevel: 80, description: '高压时期，务必保证睡眠和饮食' };
  }

  // 开学季 (3月初、9月初)
  if ((month === 3 && day <= 15) || (month === 9 && day <= 15)) {
    return { phase: 'regular', label: '开学季', stressLevel: 45, description: '适应期，逐步调整状态' };
  }

  // 正常学期
  return { phase: 'regular', label: '正常学期', stressLevel: 30, description: '正常学习期' };
}

/**
 * 获取学期阶段描述（供对话上下文与 Dashboard）
 */
export function getTermPhaseDescription(date: Date = new Date()) {
  const info = detectSemesterPhase(date);
  const cfg = getTermConfig();
  let daysToExams: number | null = null;
  if (cfg && (info.phase === 'final' || info.phase === 'regular' || info.phase === 'midterm')) {
    const examStart = new Date(cfg.examWeekStart);
    daysToExams = Math.max(0, Math.ceil((examStart.getTime() - date.getTime()) / 86400000));
  }
  return { ...info, daysToExams, hasConfig: !!cfg };
}

/**
 * 考试周学业压力权重倍数（供 RiskScoringEngine 使用）
 */
export function getAcademicStressMultiplier(date: Date = new Date()): number {
  const { phase } = detectSemesterPhase(date);
  switch (phase) {
    case 'exam_week': return 1.5;
    case 'final': return 1.2;
    case 'vacation': return 0.8;
    default: return 1.0;
  }
}

/**
 * 根据学期阶段调整AI策略
 */
export function getSemesterAdjustedPrompts(phase: SemesterPhase): string {
  const prompts: Record<SemesterPhase, string> = {
    vacation: `
当前处于假期阶段，建议：
- 关注用户的作息规律（假期容易昼夜颠倒）
- 询问假期计划和社交活动
- 提醒适度放松，不要完全放纵`,

    regular: `
当前处于正常学期，建议：
- 关注学习进度和任务管理
- 询问社交和课外活动
- 提醒保持规律作息`,

    midterm: `
当前处于期中考试周，建议：
- 关注用户的压力水平
- 提供减压技巧（呼吸练习、正念）
- 提醒合理安排复习时间，不要熬夜`,

    final: `
当前处于期末考试周，这是一个高压时期，建议：
- 高度关注用户的心理状态
- 提供具体的减压方法
- 强调睡眠和饮食的重要性
- 如果用户表现出过度焦虑，建议寻求帮助`,

    exam_week: `
当前处于考试周，建议：
- 关注用户的压力和焦虑水平
- 提供即时的放松技巧
- 提醒考试不是人生的全部`,
  };

  return prompts[phase] || prompts.regular;
}

// ── 学业压力检测 ──────────────────────────────────────────────

const ACADEMIC_STRESS_KEYWORDS = [
  // 考试相关
  '考试', '期末', '期中', '考研', '高考', '中考', '四级', '六级',
  '托福', '雅思', 'GRE', '考博', '公务员考试',
  // 学业相关
  '作业', '论文', '毕业', '答辩', '学分', '绩点', 'GPA',
  '挂科', '补考', '重修', '退学', '休学',
  // 压力表达
  '学业压力', '学习压力', '考前焦虑', '考试焦虑',
  '毕不了业', '学不进去', '看不进书', '复习不完',
  // 比较和期望
  '别人比我', '不如别人', '父母期望', '家长期望',
  '保研', '奖学金', '竞赛',
];

/**
 * 检测学业压力水平
 * @param {string} text - 用户文本
 * @returns {object} 学业压力分析结果
 */
export function detectAcademicStress(text: string): {
  hasAcademicStress: boolean;
  stressLevel: number; // 0-100
  keywords: string[];
  suggestions: string[];
} {
  if (!text) {
    return {
      hasAcademicStress: false,
      stressLevel: 0,
      keywords: [],
      suggestions: [],
    };
  }

  const cleanText = text.replace(/[，。！？、；：""''（）【】《》\s,.!?;:()\[\]{}<>]/g, '');
  const matchedKeywords: string[] = [];

  for (const keyword of ACADEMIC_STRESS_KEYWORDS) {
    if (cleanText.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }

  const stressLevel = Math.min(100, matchedKeywords.length * 20);
  const hasAcademicStress = matchedKeywords.length > 0;

  const suggestions: string[] = [];
  if (hasAcademicStress) {
    suggestions.push('学习压力是正常的，适当的压力可以转化为动力');
    suggestions.push('记得劳逸结合，每学习45分钟休息10分钟');
    if (stressLevel > 60) {
      suggestions.push('如果感到过度焦虑，可以尝试呼吸练习或正念冥想');
      suggestions.push('和朋友或家人聊聊，不要独自承受压力');
    }
  }

  return {
    hasAcademicStress,
    stressLevel,
    keywords: matchedKeywords,
    suggestions,
  };
}

// ── 校园欺凌检测 ──────────────────────────────────────────────

const BULLYING_KEYWORDS = [
  // 直接欺凌
  '欺负', '霸凌', '被欺负', '被霸凌', '校园暴力',
  '被打', '被骂', '被孤立', '被排挤', '被嘲笑',
  // 间接欺凌
  '传谣言', '说坏话', '背后说', '被人说',
  '不理我', '不跟我玩', '没人理', '被忽视',
  // 网络欺凌
  '网暴', '网络暴力', '被人骂', '被喷', '被黑',
  // 情感表达
  '不想上学', '害怕上学', '不想去学校', '讨厌学校',
  '在学校不开心', '同学欺负我',
];

/**
 * 检测校园欺凌相关内容
 * @param {string} text - 用户文本
 * @returns {object} 欺凌检测结果
 */
export function detectBullying(text: string): {
  hasBullying: boolean;
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
  response: string;
} {
  if (!text) {
    return {
      hasBullying: false,
      severity: 'low',
      keywords: [],
      response: '',
    };
  }

  const cleanText = text.replace(/[，。！？、；：""''（）【】《》\s,.!?;:()\[\]{}<>]/g, '');
  const matchedKeywords: string[] = [];

  for (const keyword of BULLYING_KEYWORDS) {
    if (cleanText.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }

  if (matchedKeywords.length === 0) {
    return {
      hasBullying: false,
      severity: 'low',
      keywords: [],
      response: '',
    };
  }

  // 判断严重程度
  let severity: 'low' | 'medium' | 'high' = 'low';
  if (matchedKeywords.some(k => ['被打', '校园暴力', '霸凌'].includes(k))) {
    severity = 'high';
  } else if (matchedKeywords.some(k => ['被欺负', '被孤立', '被排挤'].includes(k))) {
    severity = 'medium';
  }

  // 生成回应
  let response = '';
  if (severity === 'high') {
    response = `我听到你说的情况了，这听起来很严重。校园欺凌是不对的，你不需要独自面对。
建议你：
1. 告诉信任的成年人（老师、家长、辅导员）
2. 如果情况紧急，可以拨打12355青少年服务热线
3. 保留证据（截图、录音等）
你值得被尊重和善待。`;
  } else if (severity === 'medium') {
    response = `我理解你在学校的经历让你感到不舒服。被排挤或孤立的感觉确实很难受。
建议你：
1. 和信任的朋友或家人聊聊
2. 老师或学校心理咨询师可以提供帮助
3. 记住这不是你的错
如果你想聊聊具体的情况，我在这里听你说。`;
  } else {
    response = `我注意到你提到了一些在学校不太愉快的经历。如果你愿意，可以多说一些。
记住，寻求帮助是勇敢的表现，老师和家长都愿意帮助你。`;
  }

  return {
    hasBullying: true,
    severity,
    keywords: matchedKeywords,
    response,
  };
}

// ── 学生健康画像扩展 ──────────────────────────────────────────

/**
 * 扩展健康画像，添加学业压力维度
 * @param {object} baseDimensions - 原有6个维度
 * @param {string} recentText - 近期文本
 * @returns {object} 扩展后的维度（包含学业压力）
 */
export function extendHealthDimensions(
  baseDimensions: { mood: number; stress: number; energy: number; social: number; sleep: number; selfCare: number },
  recentText: string
): { mood: number; stress: number; energy: number; social: number; sleep: number; selfCare: number; academicStress: number } {
  const { stressLevel } = detectAcademicStress(recentText);

  return {
    ...baseDimensions,
    academicStress: stressLevel,
  };
}
