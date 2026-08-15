/**
<<<<<<< HEAD
 * 演示数据种子脚本 — 30 天确定性故事线（P0-2）
 *
 * 故事线：虚拟用户"小明"的心理变化轨迹
 * - 正常 10 天 → 压力 8 天 → 焦虑 6 天 → 危机 2 天 → 恢复 4 天
 * - 含 2 次预警事件：
 *   ① offset -7（深度焦虑 + PHQ-9 中重度 + GAD-7 中度）→ 证据链演示（high）
 *   ② offset -4（危机日记"活着没意思" + C-SSRS 意念）→ 危机伦理演示（critical）
 *
 * 确定性保证：
 * - **移除 Math.random()**，习惯打卡用固定打卡模式表；
 * - 所有 id 使用固定字符串（demo_*），时间戳由固定日期推导，
 *   两次运行产出**完全一致**的数据。
 *
 * 导出：
 * - seedDemoData(flag?)   注入演示数据（flag=true 时写 localStorage 标记）
 * - clearDemoData()       清空全部业务表（保留偏好 localStorage）
=======
 * 演示数据种子脚本 - 完整2周故事线
 * 用于预填充应用数据，方便演示和答辩
 *
 * 故事线：虚拟用户"小明"的心理变化轨迹
 * - Day 1-5: 正常状态，心情好，任务完成率高
 * - Day 6-8: 压力上升，心情下降，任务完成率降低
 * - Day 9-11: 焦虑加重，日记字数减少，出现消极内容
 * - Day 12: 危机触发，出现"活着没意思"
 * - Day 13-14: 使用呼吸练习/正念，心情回升
 *
 * 使用方法：在浏览器控制台调用 seedDemoData()
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
 */

import { db } from '../db';
import { getToday, getDaysAgo } from './date';
<<<<<<< HEAD
import { DEMO_STORAGE_KEY } from './constants';

/** 获取偏移日期（负数为过去；0=今天） */
=======

/** 获取偏移日期（负数为过去） */
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
function getDateOffset(days: number): string {
  if (days >= 0) return getToday();
  return getDaysAgo(-days);
}

<<<<<<< HEAD
/** 确定性 id */
const DID = (i: number) => `demo_diary_${String(i).padStart(3, '0')}`;
const TID = (i: number) => `demo_task_${String(i).padStart(3, '0')}`;
const HID = (i: number) => `demo_habit_${i}`;
const EID = (i: number) => `demo_emotion_${String(i).padStart(3, '0')}`;
const BID = (i: number) => `demo_behavior_${String(i).padStart(3, '0')}`;

/** 日期 + 固定时刻 → 确定性 ISO 时间戳 */
function iso(date: string, time = '20:00:00') {
  return new Date(`${date}T${time}+08:00`).toISOString();
}
function ms(date: string, time = '22:00:00') {
  return new Date(`${date}T${time}+08:00`).getTime();
}

// ── 阶段判定（offset 0=今天，-29..0 共 30 天）──────────────────
type Phase = 'normal' | 'stress' | 'anxiety' | 'crisis' | 'recovery';

function phaseOf(offset: number): Phase {
  if (offset >= -29 && offset <= -20) return 'normal';
  if (offset >= -19 && offset <= -12) return 'stress';
  if (offset >= -11 && offset <= -6) return 'anxiety';
  if (offset >= -5 && offset <= -4) return 'crisis';
  return 'recovery'; // -3..0
}

const PHASE_MOOD: Record<Phase, number> = {
  normal: 4,
  stress: 3,
  anxiety: 2,
  crisis: 1,
  recovery: 3,
};

// ── 日记故事线（30 条，按阶段）────────────────────────────────
// [offset, title, content, mood]
const DIARY_SEED: Array<[number, string, string, number]> = [
  // 正常期（10 天）
  [-29, '新的学期开始了', '今天是开学第一天，见到了好久不见的同学们，大家都很兴奋。领了新书，制定了这学期的学习计划。下午和室友一起去操场跑步，晚上在食堂吃了好吃的。精力充沛，对新学期充满期待！', 5],
  [-28, '充实的一天', '上午上了高等数学课，老师讲得很清楚。下午去图书馆自习了3个小时，把上周的作业都完成了。晚上参加了社团活动，认识了几个新朋友。今天效率很高，感觉很棒。', 5],
  [-27, '和朋友聚餐', '今天和高中同学约了线上聚餐，开了视频聊了很多近况。大家都在各自的学校努力着，互相鼓励。回来的路上心情很好，觉得有这样的朋友很幸运。', 4],
  [-26, '学习状态不错', '今天在图书馆待了一整天，把数据结构的作业做完了。用 AI 工具辅助理解了几个难懂的算法，最后都自己解出来了，很有成就感。晚上做了30分钟运动，出了一身汗感觉很舒服。', 4],
  [-25, '周末放松', '终于到周末了！上午睡了个懒觉，下午和室友一起去逛街买了些日用品。晚上一起做饭，聊了很多有趣的事。生活节奏刚刚好，不紧不慢。', 4],
  [-24, '跑步的快乐', '傍晚去操场跑了三圈，风吹在脸上的感觉真好。回来的路上买了一瓶酸奶，坐在长椅上慢慢喝完。突然觉得生活有很多值得期待的小事。', 4],
  [-23, '图书馆的一天', '今天没有课，全天泡在图书馆。把这周的专业课都预习了一遍，还看了一本一直想读的小说。晚上出来时天已经黑了，路灯很亮，心情很平静。', 5],
  [-22, '社团招新', '今天帮社团招新，跟很多新生聊了天。虽然有点累，但看到大家热情的样子，自己也受到了感染。晚上和部长们开了个短会，一切顺利。', 4],
  [-21, '平凡但安心', '今天的日程很普通：上课、吃饭、写作业、散步。没有特别的事，但就是觉得安心。也许安稳本身就是一种幸福。', 4],
  [-20, '给家人打电话', '晚上给爸妈打了电话，聊了最近的课程和生活。妈妈说天凉了要记得加衣服。挂了电话觉得心里暖暖的，这就是被惦记的感觉吧。', 4],
  // 压力期（8 天）
  [-19, '作业有点多', '这周作业突然变多了，三门课都要交作业。从早到晚都在写，感觉时间不够用。晚上头疼，睡得不太好。', 3],
  [-18, '考试通知', '收到通知下周有期中考试，还有两篇论文要交。感觉压力一下子大了很多，心跳有点快。晚上失眠了，翻来覆去睡不着。', 2],
  [-17, '好累', '今天一直在复习，感觉好累。脑子里乱糟糟的，什么都记不住。不想说话，只想一个人待着。', 2],
  [-16, '熬夜赶论文', '论文还差一半，只能熬夜赶。凌晨一点还在改格式，眼睛酸得睁不开。希望快点结束这段日子。', 2],
  [-15, '压力山大', '考试和论文撞在一起，感觉自己要被压垮了。室友叫我吃饭都没心情去。深呼吸也压不住那种烦躁。', 2],
  [-14, '第一次做量表', '在应用的引导下做了 PHQ-9 量表，总分 6 分，提示轻度抑郁。有点意外，但也松了口气，至少知道该关注自己的状态了。', 3],
  [-13, '勉强撑住', '今天在图书馆坐了一整天，但效率很低。肩膀很酸，心里很闷。告诉自己再撑一撑，考完就好了。', 2],
  [-12, '连续失眠', '已经是第三天失眠了。凌晨两点还醒着，脑子里全是考试的题目。白天没精神，上课都在打瞌睡。', 2],
  // 焦虑期（6 天）
  [-11, '心跳很快', '今天在教室突然觉得心跳很快，手心出汗。去医院看了下，医生说可能是焦虑引起的。让我放松一点，可我就是放松不下来。', 2],
  [-10, '不想出门', '不想出门，不想见人。上午请了假，躲在宿舍里。刷手机也刷不进去，感觉做什么都没意思。', 1],
  [-9, '考试考砸了', '今天考了高数，好多题都不会。考完就知道砸了。复习了那么久，还是没考好，感觉自己很没用。', 1],
  [-8, '什么都没做', '一整天躺在床上，什么都没做。不想吃饭，不想说话。室友关心我，我假装没事。其实心里很难受。', 1],
  [-7, '深度焦虑的一夜', '凌晨三点还醒着，反复想考试的失败。做了第二次 PHQ-9，总分 16，提示中重度。还做了 GAD-7，总分 13，中度焦虑。看到结果心里更慌了。', 1],
  [-6, '感觉撑不住了', '今天试着做了 4-7-8 呼吸，但做的时候还是心慌。觉得自己越来越不对劲，但又不知道该怎么办。', 1],
  // 危机期（2 天）
  [-5, '彻底的低谷', '今天什么都没有做。脑子里全是负面的念头，觉得自己是所有人的负担。不想让任何人担心，但真的不知道还能撑多久。', 1],
  [-4, '', '活着没意思。每天都这么累，不知道为什么要坚持。不想见任何人，不想做任何事。', 1],
  // 恢复期（4 天）
  [-3, '试着走出来', '昨天应用弹出了危机干预提示，给了我热线号码，还有呼吸练习的建议。我做了一次 4-7-8 呼吸，感觉平静了一些。下午出门走了走，晒了晒太阳。虽然还是有点累，但比昨天好一点。', 3],
  [-2, '和室友说了心里话', '今天终于鼓起勇气，和室友说了最近的压力。他没有嘲笑我，反而陪我去食堂吃了饭。晚上做了正念冥想，身体放松了很多。', 3],
  [-1, '做了 PSS-10 量表', '在应用里做了 PSS-10 压力感知量表，总分 16，中等压力。比前几天好多了。把最近的事写了下来，感觉心里轻松了一点。', 3],
  [0, '慢慢好起来', '今天早上去操场慢跑了一圈，出了一身汗。下午把落下的作业补了一部分。晚上做了正念冥想，感觉整个人放松了很多。生活还是要继续，一步一步来。', 4],
];

// ── 任务（按阶段模式生成，确定性）────────────────────────────
function buildTasks(): Array<Record<string, unknown>> {
  const tasks: Array<Record<string, unknown>> = [];
  let idx = 0;
  const push = (title: string, priority: 'high' | 'medium' | 'low', offset: number, status: 'completed' | 'pending' | 'cancelled') => {
    tasks.push({ id: TID(idx++), title, priority, scheduledDate: getDateOffset(offset), status, isRollover: false, rolloverCount: 0, tags: [], createdAt: iso(getDateOffset(offset), '09:00:00'), updatedAt: iso(getDateOffset(offset), '21:00:00') });
  };
  // 正常期：全部完成
  push('预习高等数学第三章', 'high', -29, 'completed');
  push('完成英语作业', 'medium', -28, 'completed');
  push('参加社团活动', 'low', -27, 'completed');
  push('复习数据结构', 'high', -26, 'completed');
  push('整理课程笔记', 'medium', -25, 'completed');
  push('去操场跑步', 'low', -24, 'completed');
  push('预习线性代数', 'high', -23, 'completed');
  push('社团招新值班', 'low', -22, 'completed');
  push('写本周小结', 'medium', -21, 'completed');
  push('给家里打电话', 'low', -20, 'completed');
  // 压力期：完成率下降
  push('写高数作业', 'high', -19, 'completed');
  push('准备期中考试', 'high', -18, 'pending');
  push('写论文', 'high', -17, 'pending');
  push('修改论文格式', 'medium', -16, 'pending');
  push('复习英语单词', 'medium', -15, 'cancelled');
  push('整理错题本', 'medium', -14, 'pending');
  push('背知识点', 'high', -13, 'pending');
  push('早睡调整作息', 'low', -12, 'cancelled');
  // 焦虑期：基本不完成
  push('复习高数', 'high', -11, 'cancelled');
  push('交论文', 'high', -10, 'pending');
  push('补考准备', 'high', -9, 'cancelled');
  push('收拾宿舍', 'low', -8, 'cancelled');
  push('预约校医院', 'medium', -7, 'cancelled');
  push('联系辅导员', 'medium', -6, 'cancelled');
  // 危机期：全部搁置
  push('整理复习资料', 'high', -5, 'cancelled');
  push('提交作业', 'high', -4, 'cancelled');
  // 恢复期：逐步恢复
  push('做呼吸练习', 'medium', -3, 'completed');
  push('出门散步', 'low', -2, 'completed');
  push('补写落下的作业', 'medium', -1, 'completed');
  push('做正念冥想', 'medium', 0, 'pending');
  return tasks;
}

// ── 习惯打卡（固定模式表，无随机）─────────────────────────────
const HABIT_DEFS = [
  { name: '早起', color: '#F59E0B', icon: '☀️' },
  { name: '运动', color: '#10B981', icon: '🏃' },
  { name: '阅读', color: '#8B5CF6', icon: '📖' },
  { name: '冥想', color: '#EC4899', icon: '🧘' },
];

/** 每阶段每个习惯是否打卡（4 习惯 × 阶段） */
const HABIT_PATTERN: Record<Phase, [boolean, boolean, boolean, boolean]> = {
  normal: [true, true, true, true],
  stress: [true, false, true, false],
  anxiety: [false, false, false, false],
  crisis: [false, false, false, false],
  recovery: [true, true, false, true],
};

function buildHabitsAndLogs() {
  const habits = HABIT_DEFS.map((h, i) => ({
    id: HID(i + 1),
    name: h.name,
    color: h.color,
    icon: h.icon,
    frequency: 'daily' as const,
    targetCount: 1,
    archived: false,
    createdAt: iso(getDateOffset(-29), '08:00:00'),
  }));
  const logs: Array<Record<string, unknown>> = [];
  for (let offset = -29; offset <= 0; offset++) {
    const phase = phaseOf(offset);
    const pattern = HABIT_PATTERN[phase];
    pattern.forEach((checked, hi) => {
      if (checked) {
        logs.push({
          id: `demo_habitlog_${String(offset + 29).padStart(2, '0')}_${hi + 1}`,
          habitId: HID(hi + 1),
          date: getDateOffset(offset),
          count: 1,
          createdAt: iso(getDateOffset(offset), '08:00:00'),
        });
      }
    });
  }
  return { habits, logs };
}

// ── 情感记录（按阶段，确定性）────────────────────────────────
const EMOTION_SEED: Array<[number, number, 'low' | 'medium_low' | 'medium' | 'high' | 'critical', string[]]> = [
  [-29, 0.8, 'low', ['期待', '兴奋']], [-28, 0.7, 'low', ['充实', '成就感']], [-27, 0.6, 'low', ['开心', '幸运']],
  [-26, 0.7, 'low', ['成就感', '舒服']], [-25, 0.6, 'low', ['放松', '刚刚好']], [-24, 0.65, 'low', ['快乐', '期待']],
  [-23, 0.7, 'low', ['平静', '充实']], [-22, 0.6, 'low', ['热情', '开心']], [-21, 0.55, 'low', ['安心', '平稳']],
  [-20, 0.6, 'low', ['温暖', '被惦记']],
  [-19, 0.3, 'low', ['压力', '累']], [-18, 0.1, 'medium_low', ['焦虑', '失眠']], [-17, -0.1, 'medium', ['疲惫', '不想']],
  [-16, -0.15, 'medium', ['熬夜', '累']], [-15, -0.2, 'medium', ['烦躁', '压力']], [-14, 0.0, 'medium_low', ['担心', '关注']],
  [-13, -0.25, 'medium', ['效率低', '闷']], [-12, -0.3, 'medium', ['失眠', '焦虑']],
  [-11, -0.35, 'high', ['心慌', '焦虑']], [-10, -0.45, 'high', ['没意思', '逃避']], [-9, -0.5, 'high', ['失败', '无用']],
  [-8, -0.55, 'high', ['难受', '压抑']], [-7, -0.6, 'high', ['中重度', '恐慌']], [-6, -0.65, 'high', ['撑不住', '心慌']],
  [-5, -0.7, 'high', ['负面', '负担']], [-4, -0.8, 'critical', ['没意思', '危机']],
  [-3, 0.2, 'low', ['平静', '好一点']], [-2, 0.3, 'low', ['被理解', '放松']], [-1, 0.35, 'low', ['轻松', '倾诉']],
  [0, 0.5, 'low', ['放松', '继续']],
];

// ── 行为记录（按阶段，确定性）────────────────────────────────
const BEHAVIOR_PATTERN: Record<Phase, { mood: number; tasksRate: [number, number]; habitsRate: [number, number]; diaryWords: number; lateNight: boolean; activeHours: number[] }> = {
  normal: { mood: 4, tasksRate: [1, 1], habitsRate: [4, 4], diaryWords: 120, lateNight: false, activeHours: [8, 9, 10, 14, 15, 16, 20] },
  stress: { mood: 2, tasksRate: [0, 1], habitsRate: [1, 4], diaryWords: 50, lateNight: true, activeHours: [9, 10, 11, 22, 23, 0, 1] },
  anxiety: { mood: 1, tasksRate: [0, 1], habitsRate: [0, 4], diaryWords: 25, lateNight: true, activeHours: [0, 1, 2, 3, 10, 11] },
  crisis: { mood: 1, tasksRate: [0, 0], habitsRate: [0, 4], diaryWords: 10, lateNight: true, activeHours: [0, 1, 2, 3, 4] },
  recovery: { mood: 3, tasksRate: [1, 1], habitsRate: [3, 4], diaryWords: 90, lateNight: false, activeHours: [9, 10, 11, 14, 15, 16] },
};

function buildBehaviors() {
  const records: Array<Record<string, unknown>> = [];
  for (let offset = -29; offset <= 0; offset++) {
    const phase = phaseOf(offset);
    const p = BEHAVIOR_PATTERN[phase];
    records.push({
      id: BID(offset + 29),
      date: getDateOffset(offset),
      diaryWritten: true,
      diaryWordCount: p.diaryWords,
      moodRating: offset === -8 || offset === -6 ? 1 : p.mood,
      tasksCompleted: p.tasksRate[0],
      tasksTotal: p.tasksRate[1],
      habitsChecked: p.habitsRate[0],
      habitsTotal: p.habitsRate[1],
      activeHours: p.activeHours,
      chatMessages: 0,
      createdAt: iso(getDateOffset(offset), '23:00:00'),
    });
  }
  return records;
}

// ── 健康画像快照（关键节点）───────────────────────────────────
const HEALTH_SEED: Array<[number, number, 'low' | 'medium' | 'high' | 'critical', { mood: number; stress: number; energy: number; social: number; sleep: number; selfCare: number }]> = [
  [-29, 85, 'low', { mood: 85, stress: 20, energy: 80, social: 75, sleep: 80, selfCare: 70 }],
  [-20, 80, 'low', { mood: 80, stress: 25, energy: 75, social: 70, sleep: 75, selfCare: 65 }],
  [-14, 55, 'medium', { mood: 50, stress: 60, energy: 45, social: 40, sleep: 40, selfCare: 35 }],
  [-7, 30, 'high', { mood: 25, stress: 80, energy: 20, social: 15, sleep: 20, selfCare: 15 }],
  [-4, 15, 'critical', { mood: 10, stress: 90, energy: 10, social: 5, sleep: 10, selfCare: 5 }],
  [0, 60, 'low', { mood: 65, stress: 40, energy: 55, social: 50, sleep: 60, selfCare: 55 }],
];

// ── 评估记录（含 2 次预警事件对应的量表）───────────────────────
const ASSESSMENT_SEED: Array<{ type: 'PHQ9' | 'GAD7' | 'PSS10' | 'CSSRS'; dateOffset: number; scores: number[]; totalScore: number; level: string }> = [
  { type: 'PHQ9', dateOffset: -14, scores: [1, 1, 1, 1, 0, 1, 1, 0, 0], totalScore: 6, level: 'mild' },
  { type: 'PHQ9', dateOffset: -7, scores: [2, 2, 2, 2, 1, 2, 2, 1, 2], totalScore: 16, level: 'moderately_severe' },
  { type: 'GAD7', dateOffset: -7, scores: [2, 2, 2, 2, 2, 1, 2], totalScore: 13, level: 'moderate' },
  { type: 'CSSRS', dateOffset: -5, scores: [1, 0, 0, 0, 0, 1], totalScore: 2, level: 'ideation' },
  { type: 'PSS10', dateOffset: -1, scores: [2, 2, 2, 1, 1, 2, 1, 2, 1, 2], totalScore: 16, level: 'moderate' },
];

// ── 治疗练习记录 ─────────────────────────────────────────────
const THERAPY_SEED: Array<{ type: 'thought_record' | 'breathing' | 'mindfulness'; dateOffset: number; data: Record<string, unknown>; moodBefore: number; moodAfter: number }> = [
  { type: 'breathing', dateOffset: -6, data: { exercise: '4-7-8', duration: 300 }, moodBefore: 1, moodAfter: 2 },
  { type: 'mindfulness', dateOffset: -2, data: { exercise: 'body_scan', duration: 600 }, moodBefore: 2, moodAfter: 4 },
  { type: 'breathing', dateOffset: 0, data: { exercise: 'resonant', duration: 300 }, moodBefore: 3, moodAfter: 4 },
];

// ── 聊天摘要（含危机事件，喂 chat 信号通道）────────────────────
const CONVERSATION_SUMMARIES_SEED = [
  { dateOffset: -9, summary: '用户表达考试失败后的自责与无价值感，AI 共情并建议做量表评估', keyTopics: ['考试', '失败'], emotionalState: '自责，低落' },
  { dateOffset: -4, summary: '用户表达"活着没意思"，AI 触发危机干预：提供热线与安全确认，建议联系专业人员', keyTopics: ['危机', '热线'], emotionalState: '绝望' },
  { dateOffset: -2, summary: '用户表示尝试了呼吸练习和正念，感觉好了一些。AI 鼓励继续使用治疗工具', keyTopics: ['恢复', '呼吸练习'], emotionalState: '平静，略有希望' },
];

// ── 主流程 ──────────────────────────────────────────────────

/** 清空全部业务表（保留偏好 localStorage） */
export async function clearDemoData(): Promise<void> {
  try {
=======
// ── 完整2周故事线数据 ──────────────────────────────────────────

const STORYLINE_DIARIES = [
  // === Phase 1: 正常状态 (Day 1-5) ===
  {
    date: getDateOffset(-13),
    title: '新的学期开始了',
    content: '今天是开学第一天，见到了好久不见的同学们，大家都很兴奋。领了新书，制定了这学期的学习计划。下午和室友一起去操场跑步，晚上在食堂吃了好吃的。用 AI 工具整理了课程笔记，感觉效率提升了不少。精力充沛，对新学期充满期待！',
    mood: 5,
    weather: '☀️',
    tags: ['开学', '积极'],
  },
  {
    date: getDateOffset(-12),
    title: '充实的一天',
    content: '上午上了高等数学课，老师讲得很清楚。下午去图书馆自习了3个小时，用 AI 助手把上周的作业都完成了。晚上参加了社团活动，认识了几个新朋友。今天效率很高，感觉很棒。',
    mood: 5,
    weather: '☀️',
    tags: ['学习', '社交'],
  },
  {
    date: getDateOffset(-11),
    title: '和朋友聚餐',
    content: '今天和高中同学约了线上聚餐，开了视频聊了很多近况。大家都在各自的学校努力着，互相鼓励。回来的路上心情很好，觉得有这样的朋友很幸运。晚上看了一部电影放松了一下。',
    mood: 4,
    weather: '🌤️',
    tags: ['社交', '开心'],
  },
  {
    date: getDateOffset(-10),
    title: '学习状态不错',
    content: '今天在图书馆待了一整天，把数据结构的作业做完了。用 AI 工具辅助理解了几个难懂的算法，最后都自己解出来了，很有成就感。晚上做了30分钟运动，出了一身汗感觉很舒服。',
    mood: 4,
    weather: '☀️',
    tags: ['学习', '运动'],
  },
  {
    date: getDateOffset(-9),
    title: '周末放松',
    content: '终于到周末了！上午睡了个懒觉，下午和室友一起去逛街买了些日用品。晚上一起做饭，聊了很多有趣的事。生活节奏刚刚好，不紧不慢。',
    mood: 4,
    weather: '🌤️',
    tags: ['休息', '日常'],
  },

  // === Phase 2: 压力上升 (Day 6-8) ===
  {
    date: getDateOffset(-8),
    title: '作业有点多',
    content: '这周作业突然变多了，三门课都要交作业。从早到晚都在写，感觉时间不够用。晚上头疼，睡得不太好。',
    mood: 3,
    weather: '☁️',
    tags: ['作业', '压力'],
  },
  {
    date: getDateOffset(-7),
    title: '考试通知',
    content: '收到通知下周有期中考试，还有两篇论文要交。感觉压力一下子大了很多，心跳有点快。晚上失眠了，翻来覆去睡不着。',
    mood: 2,
    weather: '🌧️',
    tags: ['考试', '焦虑'],
  },
  {
    date: getDateOffset(-6),
    title: '好累',
    content: '今天一直在复习，感觉好累。脑子里乱糟糟的，什么都记不住。不想说话，只想一个人待着。',
    mood: 2,
    weather: '☁️',
    tags: ['疲惫', '压力'],
  },

  // === Phase 3: 焦虑加重 (Day 9-11) ===
  {
    date: getDateOffset(-5),
    title: '睡不着',
    content: '又失眠了。凌晨3点还醒着，脑子里全是考试的事。白天没精神，什么都不想做。',
    mood: 2,
    weather: '🌧️',
    tags: ['失眠', '焦虑'],
  },
  {
    date: getDateOffset(-4),
    title: '不想动',
    content: '今天什么都没做，就躺在床上。不想吃饭，不想出门。感觉好累好累。',
    mood: 1,
    weather: '☁️',
    tags: ['疲惫', '消极'],
  },
  {
    date: getDateOffset(-3),
    title: '考试考砸了',
    content: '今天考了高数，好多题都不会。考完就知道砸了。AI 助手帮我复习的内容好像都没考到。感觉一切都没有意义。',
    mood: 1,
    weather: '🌧️',
    tags: ['考试', '失败'],
  },

  // === Phase 4: 危机触发 (Day 12) ===
  {
    date: getDateOffset(-2),
    title: '',
    content: '活着没意思。每天都这么累，不知道为什么要坚持。不想见任何人，不想做任何事。',
    mood: 1,
    weather: '🌧️',
    tags: ['消极', '危机'],
  },

  // === Phase 5: 干预后恢复 (Day 13-14) ===
  {
    date: getDateOffset(-1),
    title: '试着走出来',
    content: '昨天AI助手关心了我，让我试试呼吸练习。今天做了一次4-7-8呼吸，感觉平静了一些。下午出门走了走，晒了晒太阳。虽然还是有点累，但比昨天好一点。',
    mood: 3,
    weather: '🌤️',
    tags: ['恢复', '呼吸练习'],
  },
  {
    date: getToday(),
    title: '慢慢好起来',
    content: '今天早上去操场慢跑了一圈，出了一身汗。下午和室友聊了聊，说了说最近的压力。晚上做了正念冥想，感觉整个人放松了很多。生活还是要继续，一步一步来。',
    mood: 4,
    weather: '☀️',
    tags: ['运动', '正念', '恢复'],
  },
];

// 任务数据
const STORYLINE_TASKS = [
  // 正常期任务
  { title: '预习高等数学第三章', priority: 'high' as const, scheduledDate: getDateOffset(-13), status: 'completed' as const },
  { title: '完成英语作业', priority: 'medium' as const, scheduledDate: getDateOffset(-12), status: 'completed' as const },
  { title: '参加社团活动', priority: 'low' as const, scheduledDate: getDateOffset(-11), status: 'completed' as const },
  { title: '复习数据结构', priority: 'high' as const, scheduledDate: getDateOffset(-10), status: 'completed' as const },
  { title: '整理笔记', priority: 'medium' as const, scheduledDate: getDateOffset(-9), status: 'completed' as const },
  // 压力期任务
  { title: '写高数作业', priority: 'high' as const, scheduledDate: getDateOffset(-8), status: 'completed' as const },
  { title: '准备期中考试', priority: 'high' as const, scheduledDate: getDateOffset(-7), status: 'pending' as const },
  { title: '写论文', priority: 'high' as const, scheduledDate: getDateOffset(-6), status: 'pending' as const },
  // 焦虑期任务（完成率下降）
  { title: '复习考试', priority: 'high' as const, scheduledDate: getDateOffset(-5), status: 'pending' as const },
  { title: '交论文', priority: 'high' as const, scheduledDate: getDateOffset(-4), status: 'pending' as const },
  { title: '复习高数', priority: 'high' as const, scheduledDate: getDateOffset(-3), status: 'cancelled' as const },
  // 恢复期任务
  { title: '做呼吸练习', priority: 'medium' as const, scheduledDate: getDateOffset(-1), status: 'completed' as const },
  { title: '出门散步', priority: 'low' as const, scheduledDate: getToday(), status: 'completed' as const },
  { title: '做正念冥想', priority: 'medium' as const, scheduledDate: getToday(), status: 'pending' as const },
];

// 习惯数据
const STORYLINE_HABITS = [
  { name: '早起', color: '#F59E0B', icon: '☀️', frequency: 'daily' as const, targetCount: 1 },
  { name: '运动', color: '#10B981', icon: '🏃', frequency: 'daily' as const, targetCount: 1 },
  { name: '阅读', color: '#8B5CF6', icon: '📖', frequency: 'daily' as const, targetCount: 1 },
  { name: '冥想', color: '#EC4899', icon: '🧘', frequency: 'daily' as const, targetCount: 1 },
];

// 情感记录（对应故事线）
const STORYLINE_EMOTIONS = [
  // 正常期
  { date: getDateOffset(-13), sentimentScore: 0.8, riskLevel: 'low' as const, keywords: ['期待', '兴奋'] },
  { date: getDateOffset(-12), sentimentScore: 0.7, riskLevel: 'low' as const, keywords: ['充实', '成就感'] },
  { date: getDateOffset(-11), sentimentScore: 0.6, riskLevel: 'low' as const, keywords: ['开心', '幸运'] },
  { date: getDateOffset(-10), sentimentScore: 0.7, riskLevel: 'low' as const, keywords: ['成就感', '舒服'] },
  { date: getDateOffset(-9), sentimentScore: 0.6, riskLevel: 'low' as const, keywords: ['放松', '刚刚好'] },
  // 压力期
  { date: getDateOffset(-8), sentimentScore: 0.3, riskLevel: 'low' as const, keywords: ['压力', '累'] },
  { date: getDateOffset(-7), sentimentScore: 0.1, riskLevel: 'medium_low' as const, keywords: ['焦虑', '失眠'] },
  { date: getDateOffset(-6), sentimentScore: -0.1, riskLevel: 'medium' as const, keywords: ['疲惫', '不想'] },
  // 焦虑期
  { date: getDateOffset(-5), sentimentScore: -0.2, riskLevel: 'medium' as const, keywords: ['失眠', '焦虑'] },
  { date: getDateOffset(-4), sentimentScore: -0.4, riskLevel: 'high' as const, keywords: ['不想', '累'] },
  { date: getDateOffset(-3), sentimentScore: -0.5, riskLevel: 'high' as const, keywords: ['失败', '无意义'] },
  // 危机
  { date: getDateOffset(-2), sentimentScore: -0.8, riskLevel: 'critical' as const, keywords: ['没意思', '不想'] },
  // 恢复期
  { date: getDateOffset(-1), sentimentScore: 0.2, riskLevel: 'low' as const, keywords: ['平静', '好一点'] },
  { date: getToday(), sentimentScore: 0.5, riskLevel: 'low' as const, keywords: ['放松', '继续'] },
];

// 行为记录
const STORYLINE_BEHAVIORS = [
  // 正常期
  { date: getDateOffset(-13), diaryWritten: true, diaryWordCount: 150, moodRating: 5, tasksCompleted: 1, tasksTotal: 1, habitsChecked: 3, habitsTotal: 4, activeHours: [8, 9, 10, 14, 15, 16, 20], chatMessages: 0 },
  { date: getDateOffset(-12), diaryWritten: true, diaryWordCount: 120, moodRating: 5, tasksCompleted: 1, tasksTotal: 1, habitsChecked: 4, habitsTotal: 4, activeHours: [8, 9, 10, 11, 14, 15, 16], chatMessages: 0 },
  { date: getDateOffset(-11), diaryWritten: true, diaryWordCount: 100, moodRating: 4, tasksCompleted: 1, tasksTotal: 1, habitsChecked: 3, habitsTotal: 4, activeHours: [10, 11, 12, 18, 19, 20], chatMessages: 0 },
  { date: getDateOffset(-10), diaryWritten: true, diaryWordCount: 110, moodRating: 4, tasksCompleted: 1, tasksTotal: 1, habitsChecked: 4, habitsTotal: 4, activeHours: [8, 9, 10, 11, 14, 15, 16, 17], chatMessages: 0 },
  { date: getDateOffset(-9), diaryWritten: true, diaryWordCount: 80, moodRating: 4, tasksCompleted: 1, tasksTotal: 1, habitsChecked: 3, habitsTotal: 4, activeHours: [9, 10, 11, 14, 15, 16], chatMessages: 0 },
  // 压力期
  { date: getDateOffset(-8), diaryWritten: true, diaryWordCount: 60, moodRating: 3, tasksCompleted: 1, tasksTotal: 1, habitsChecked: 2, habitsTotal: 4, activeHours: [9, 10, 11, 14, 15, 16, 17, 18], chatMessages: 0 },
  { date: getDateOffset(-7), diaryWritten: true, diaryWordCount: 50, moodRating: 2, tasksCompleted: 0, tasksTotal: 1, habitsChecked: 1, habitsTotal: 4, activeHours: [9, 10, 11, 22, 23, 0, 1], chatMessages: 0 },
  { date: getDateOffset(-6), diaryWritten: true, diaryWordCount: 30, moodRating: 2, tasksCompleted: 0, tasksTotal: 1, habitsChecked: 1, habitsTotal: 4, activeHours: [10, 11, 12, 23, 0, 1], chatMessages: 0 },
  // 焦虑期
  { date: getDateOffset(-5), diaryWritten: true, diaryWordCount: 25, moodRating: 2, tasksCompleted: 0, tasksTotal: 1, habitsChecked: 0, habitsTotal: 4, activeHours: [0, 1, 2, 3, 10, 11], chatMessages: 0 },
  { date: getDateOffset(-4), diaryWritten: true, diaryWordCount: 20, moodRating: 1, tasksCompleted: 0, tasksTotal: 1, habitsChecked: 0, habitsTotal: 4, activeHours: [0, 1, 2, 14, 15], chatMessages: 0 },
  { date: getDateOffset(-3), diaryWritten: true, diaryWordCount: 15, moodRating: 1, tasksCompleted: 0, tasksTotal: 1, habitsChecked: 0, habitsTotal: 4, activeHours: [0, 1, 2, 3, 10], chatMessages: 0 },
  // 危机
  { date: getDateOffset(-2), diaryWritten: true, diaryWordCount: 10, moodRating: 1, tasksCompleted: 0, tasksTotal: 0, habitsChecked: 0, habitsTotal: 4, activeHours: [0, 1, 2, 3, 4], chatMessages: 0 },
  // 恢复期
  { date: getDateOffset(-1), diaryWritten: true, diaryWordCount: 80, moodRating: 3, tasksCompleted: 1, tasksTotal: 1, habitsChecked: 2, habitsTotal: 4, activeHours: [9, 10, 11, 14, 15, 16], chatMessages: 0 },
  { date: getToday(), diaryWritten: true, diaryWordCount: 100, moodRating: 4, tasksCompleted: 1, tasksTotal: 2, habitsChecked: 3, habitsTotal: 4, activeHours: [8, 9, 10, 14, 15, 16, 17], chatMessages: 0 },
];

// 健康画像
const STORYLINE_HEALTH_PROFILES = [
  { date: getDateOffset(-13), emotionalHealthIndex: 85, riskLevel: 'low' as const, dimensions: { mood: 85, stress: 20, energy: 80, social: 75, sleep: 80, selfCare: 70 } },
  { date: getDateOffset(-10), emotionalHealthIndex: 80, riskLevel: 'low' as const, dimensions: { mood: 80, stress: 25, energy: 75, social: 70, sleep: 75, selfCare: 65 } },
  { date: getDateOffset(-7), emotionalHealthIndex: 55, riskLevel: 'medium' as const, dimensions: { mood: 50, stress: 60, energy: 45, social: 40, sleep: 40, selfCare: 35 } },
  { date: getDateOffset(-4), emotionalHealthIndex: 30, riskLevel: 'high' as const, dimensions: { mood: 25, stress: 80, energy: 20, social: 15, sleep: 20, selfCare: 15 } },
  { date: getDateOffset(-2), emotionalHealthIndex: 15, riskLevel: 'critical' as const, dimensions: { mood: 10, stress: 90, energy: 10, social: 5, sleep: 10, selfCare: 5 } },
  { date: getToday(), emotionalHealthIndex: 60, riskLevel: 'low' as const, dimensions: { mood: 65, stress: 40, energy: 55, social: 50, sleep: 60, selfCare: 55 } },
];

// 评估记录
const STORYLINE_ASSESSMENTS = [
  // 压力期做了一次PHQ-9
  {
    type: 'PHQ9' as const,
    date: getDateOffset(-7),
    scores: [1, 1, 1, 1, 0, 1, 1, 0, 0],
    totalScore: 6,
    level: 'mild',
  },
  // 焦虑期做了PHQ-9和GAD-7
  {
    type: 'PHQ9' as const,
    date: getDateOffset(-4),
    scores: [2, 2, 2, 2, 1, 2, 2, 1, 0],
    totalScore: 16,
    level: 'moderately_severe',
  },
  {
    type: 'GAD7' as const,
    date: getDateOffset(-4),
    scores: [2, 2, 2, 2, 2, 1, 2],
    totalScore: 13,
    level: 'moderate',
  },
  // 恢复期做了PSS-10
  {
    type: 'PSS10' as const,
    date: getDateOffset(-1),
    scores: [2, 2, 2, 1, 1, 2, 1, 2, 1, 2],
    totalScore: 16,
    level: 'moderate',
  },
];

// 治疗练习记录
const STORYLINE_THERAPY = [
  // 焦虑期做了呼吸练习
  {
    type: 'breathing' as const,
    date: getDateOffset(-5),
    data: { exercise: '4-7-8', duration: 300 },
    moodBefore: 2,
    moodAfter: 3,
  },
  // 危机后做了正念
  {
    type: 'mindfulness' as const,
    date: getDateOffset(-1),
    data: { exercise: 'body_scan', duration: 600 },
    moodBefore: 2,
    moodAfter: 4,
  },
  // 恢复期做了呼吸练习
  {
    type: 'breathing' as const,
    date: getToday(),
    data: { exercise: 'resonant', duration: 300 },
    moodBefore: 3,
    moodAfter: 4,
  },
];

// 聊天记录摘要
const STORYLINE_CONVERSATIONS = [
  {
    date: getDateOffset(-2),
    summary: '用户表达了消极情绪，AI助手提供了危机干预热线和呼吸练习建议',
    keyTopics: ['危机', '关怀'],
    emotionalState: '悲伤，绝望',
  },
  {
    date: getDateOffset(-1),
    summary: '用户表示尝试了呼吸练习，感觉好了一些。AI鼓励继续使用治疗工具',
    keyTopics: ['恢复', '呼吸练习'],
    emotionalState: '平静，略有希望',
  },
];

// ── 种子函数 ──────────────────────────────────────────────────

export async function seedDemoData() {
  console.log('[Seed] 开始填充演示数据（完整2周故事线）...');

  try {
    // 清空现有数据
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    await db.transaction('rw', [
      db.diaries, db.tasks, db.habits, db.habitLogs,
      db.emotionRecords, db.assessments, db.therapyRecords,
      db.behaviorRecords, db.healthProfiles, db.conversationSummaries,
<<<<<<< HEAD
      db.crisisLogs, db.conversations,
=======
      db.crisisLogs,
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    ], async () => {
      await db.diaries.clear();
      await db.tasks.clear();
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.emotionRecords.clear();
      await db.assessments.clear();
      await db.therapyRecords.clear();
      await db.behaviorRecords.clear();
      await db.healthProfiles.clear();
      await db.conversationSummaries.clear();
      await db.crisisLogs.clear();
<<<<<<< HEAD
      await db.conversations.clear();
    });
    // 清理演示标记（偏好保留）
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(DEMO_STORAGE_KEY); } catch { /* ignore */ }
    }
    console.log('[Seed] ✅ 演示数据已清理（偏好保留）');
  } catch (err) {
    console.error('[Seed] ❌ 清理失败:', err);
    throw err;
  }
}

/**
 * 注入 30 天确定性演示数据
 * @param flag 是否写入演示标记（默认 true；DataSettings 用 demoModeStore 管理状态，此标记作兜底）
 */
export async function seedDemoData(flag = true): Promise<{ success: boolean; error?: unknown }> {
  console.log('[Seed] 开始填充演示数据（30 天确定性故事线）...');

  try {
    await clearDemoData();

    // 1. 日记（30 条）
    for (let i = 0; i < DIARY_SEED.length; i++) {
      const [offset, title, content, mood] = DIARY_SEED[i];
      const date = getDateOffset(offset);
      await db.diaries.add({
        id: DID(i),
        date,
        title,
        content,
        mood: mood as 1 | 2 | 3 | 4 | 5,
        weather: mood >= 4 ? '☀️' : mood >= 2 ? '🌤️' : '🌧️',
        tags: [],
        createdAt: iso(date),
        updatedAt: iso(date),
      });
    }

    // 2. 任务
    const tasks = buildTasks();
    for (const t of tasks) await db.tasks.add(t as never);

    // 3. 习惯 + 打卡（固定模式表，无随机）
    const { habits, logs } = buildHabitsAndLogs();
    for (const h of habits) await db.habits.add(h as never);
    for (const l of logs) await db.habitLogs.add(l as never);

    // 4. 情感记录（30 天 + 对话通道 1 条）
    for (let i = 0; i < EMOTION_SEED.length; i++) {
      const [offset, score, riskLevel, keywords] = EMOTION_SEED[i];
      const date = getDateOffset(offset);
      await db.emotionRecords.add({
        id: EID(i),
        date,
        source: 'diary',
        sentimentScore: score,
        emotions: {
          joy: score > 0.5 ? score : 0,
          sadness: score < 0 ? Math.abs(score) : 0,
          anger: 0,
          fear: riskLevel === 'high' || riskLevel === 'critical' ? 0.6 : 0,
          surprise: 0,
          disgust: 0,
        },
        riskLevel,
        keywords,
        createdAt: iso(date),
      });
    }
    // 对话通道情感记录（喂 chat 信号）
    await db.emotionRecords.add({
      id: 'demo_emotion_chat_crisis',
      date: getDateOffset(-4),
      source: 'chat',
      sourceId: 'demo_conv_crisis',
      sentimentScore: -0.8,
      emotions: { joy: 0, sadness: 0.8, anger: 0, fear: 0.5, surprise: 0, disgust: 0 },
      riskLevel: 'critical',
      keywords: ['危机', '没意思'],
      analysis: '活着没意思',
      createdAt: iso(getDateOffset(-4), '22:05:00'),
    });

    // 5. 行为记录（30 天）
    const behaviors = buildBehaviors();
    for (const b of behaviors) await db.behaviorRecords.add(b as never);

    // 6. 健康画像快照
    for (let i = 0; i < HEALTH_SEED.length; i++) {
      const [offset, index, riskLevel, dims] = HEALTH_SEED[i];
      const date = getDateOffset(offset);
      await db.healthProfiles.add({
        id: `demo_health_${i}`,
        date,
        emotionalHealthIndex: index,
        riskLevel,
        dimensions: dims,
        emotionalVolatility: riskLevel === 'critical' ? 0.8 : riskLevel === 'high' ? 0.6 : 0.3,
        insights: [],
        suggestions: [],
        createdAt: iso(date, '22:00:00'),
      });
    }

    // 7. 评估记录
    for (let i = 0; i < ASSESSMENT_SEED.length; i++) {
      const a = ASSESSMENT_SEED[i];
      await db.assessments.add({
        id: `demo_assessment_${i}`,
        type: a.type,
        date: getDateOffset(a.dateOffset),
        scores: a.scores,
        totalScore: a.totalScore,
        level: a.level,
        suggestions: '',
        createdAt: iso(getDateOffset(a.dateOffset), '15:00:00'),
      });
    }

    // 8. 治疗练习记录
    for (let i = 0; i < THERAPY_SEED.length; i++) {
      const th = THERAPY_SEED[i];
      await db.therapyRecords.add({
        id: `demo_therapy_${i}`,
        type: th.type,
        date: getDateOffset(th.dateOffset),
        data: th.data,
        moodBefore: th.moodBefore,
        moodAfter: th.moodAfter,
        createdAt: iso(getDateOffset(th.dateOffset), '21:00:00'),
      });
    }

    // 9. 聊天摘要
    for (let i = 0; i < CONVERSATION_SUMMARIES_SEED.length; i++) {
      const c = CONVERSATION_SUMMARIES_SEED[i];
      await db.conversationSummaries.add({
        id: `demo_convsum_${i}`,
        date: getDateOffset(c.dateOffset),
        summary: c.summary,
        keyTopics: c.keyTopics,
        emotionalState: c.emotionalState,
        createdAt: iso(getDateOffset(c.dateOffset), '23:00:00'),
      });
    }

    // 10. 危机干预记录（危机伦理演示）
    await db.crisisLogs.add({
      id: 'demo_crisis_log',
      date: getDateOffset(-4),
=======
    });

    // 1. 添加日记
    for (const diary of STORYLINE_DIARIES) {
      await db.diaries.add({
        id: crypto.randomUUID(),
        ...diary,
        mood: diary.mood as 1 | 2 | 3 | 4 | 5,
        createdAt: new Date(diary.date + 'T20:00:00+08:00').toISOString(),
        updatedAt: new Date(diary.date + 'T20:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_DIARIES.length} 篇日记`);

    // 2. 添加任务
    for (const task of STORYLINE_TASKS) {
      await db.tasks.add({
        id: crypto.randomUUID(),
        title: task.title,
        priority: task.priority,
        status: task.status,
        scheduledDate: task.scheduledDate,
        isRollover: false,
        rolloverCount: 0,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_TASKS.length} 个任务`);

    // 3. 添加习惯
    const habitIds: string[] = [];
    for (const habit of STORYLINE_HABITS) {
      const id = crypto.randomUUID();
      habitIds.push(id);
      await db.habits.add({
        id,
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        archived: false,
        createdAt: new Date().toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_HABITS.length} 个习惯`);

    // 4. 添加习惯打卡记录（对应故事线）
    const habitCheckinPattern = [
      3, 4, 3, 4, 3,  // 正常期：大部分打卡
      2, 1, 1,         // 压力期：打卡减少
      0, 0, 0,         // 焦虑期：不打卡
      0,               // 危机
      2, 3,            // 恢复期：逐渐恢复
    ];

    for (const habitId of habitIds) {
      for (let i = 0; i < 14; i++) {
        const date = getDateOffset(-(13 - i));
        const maxCheckins = habitCheckinPattern[i] || 0;
        if (Math.random() < maxCheckins / 4) {
          await db.habitLogs.add({
            id: crypto.randomUUID(),
            habitId,
            date,
            count: 1,
            createdAt: new Date(date + 'T08:00:00+08:00').toISOString(),
          });
        }
      }
    }
    console.log('[Seed] 添加习惯打卡记录');

    // 5. 添加情感记录
    for (const emo of STORYLINE_EMOTIONS) {
      await db.emotionRecords.add({
        id: crypto.randomUUID(),
        date: emo.date,
        source: 'diary' as const,
        sentimentScore: emo.sentimentScore,
        emotions: {
          joy: emo.sentimentScore > 0.5 ? emo.sentimentScore : 0,
          sadness: emo.sentimentScore < 0 ? Math.abs(emo.sentimentScore) : 0,
          anger: 0,
          fear: emo.riskLevel === 'high' || emo.riskLevel === 'critical' ? 0.6 : 0,
          surprise: 0,
          disgust: 0,
        },
        riskLevel: emo.riskLevel,
        keywords: emo.keywords,
        createdAt: new Date(emo.date + 'T20:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_EMOTIONS.length} 条情感记录`);

    // 6. 添加行为记录
    for (const behavior of STORYLINE_BEHAVIORS) {
      await db.behaviorRecords.add({
        id: crypto.randomUUID(),
        ...behavior,
        createdAt: new Date(behavior.date + 'T23:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_BEHAVIORS.length} 条行为记录`);

    // 7. 添加健康画像
    for (const profile of STORYLINE_HEALTH_PROFILES) {
      await db.healthProfiles.add({
        id: crypto.randomUUID(),
        ...profile,
        emotionalVolatility: profile.riskLevel === 'critical' ? 0.8 : profile.riskLevel === 'high' ? 0.6 : 0.3,
        insights: [],
        suggestions: [],
        createdAt: new Date(profile.date + 'T22:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_HEALTH_PROFILES.length} 条健康画像`);

    // 8. 添加评估记录
    for (const assessment of STORYLINE_ASSESSMENTS) {
      await db.assessments.add({
        id: crypto.randomUUID(),
        ...assessment,
        suggestions: '',
        createdAt: new Date(assessment.date + 'T15:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_ASSESSMENTS.length} 条评估记录`);

    // 9. 添加治疗练习记录
    for (const therapy of STORYLINE_THERAPY) {
      await db.therapyRecords.add({
        id: crypto.randomUUID(),
        ...therapy,
        createdAt: new Date(therapy.date + 'T21:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_THERAPY.length} 条治疗记录`);

    // 10. 添加聊天记录摘要
    for (const conv of STORYLINE_CONVERSATIONS) {
      await db.conversationSummaries.add({
        id: crypto.randomUUID(),
        ...conv,
        createdAt: new Date(conv.date + 'T23:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${STORYLINE_CONVERSATIONS.length} 条聊天记录`);

    // 11. 添加危机干预记录
    await db.crisisLogs.add({
      id: crypto.randomUUID(),
      date: getDateOffset(-2),
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
      triggerSource: 'diary',
      triggerContent: '活着没意思',
      riskLevel: 'critical',
      handled: true,
<<<<<<< HEAD
      action: '显示危机干预弹窗，提供热线 400-161-9995 / 12356，建议联系专业人员',
      createdAt: iso(getDateOffset(-4), '20:30:00'),
    });

    // 11. AI 对话历史（危机前后，确定性时间戳）
    const convId = 'demo_conv_crisis';
    await db.conversations.add({
      id: convId,
      title: '最近的对话',
      sessionId: convId,
      provider: 'fallback',
      createdAt: iso(getDateOffset(-9), '22:00:00'),
      updatedAt: iso(getDateOffset(-2), '21:30:00'),
      messages: [
        { role: 'assistant', content: '晚上好，今天辛苦了。想聊聊吗？', timestamp: ms(getDateOffset(-9), '22:00:00') },
        { role: 'user', content: '最近复习压力好大，感觉有点喘不过气。', timestamp: ms(getDateOffset(-9), '22:01:00') },
        { role: 'assistant', content: '听出来你扛着不少东西，辛苦了。要不要试试 4-7-8 呼吸，两分钟就能让心跳慢下来？', timestamp: ms(getDateOffset(-9), '22:02:00') },
        { role: 'user', content: '考试考砸了，感觉自己很没用。', timestamp: ms(getDateOffset(-8), '22:00:00') },
        { role: 'assistant', content: '一次考试不能定义你。你愿意说出来，已经在认真面对自己的状态了。', timestamp: ms(getDateOffset(-8), '22:01:00') },
        { role: 'user', content: '有时候觉得活着没意思。', timestamp: ms(getDateOffset(-4), '22:00:00') },
        { role: 'assistant', content: '我注意到你现在可能很难受。我想先确认一件事——你现在安全吗？我不能替代专业医疗。如果你正在经历很痛苦的时刻，请拨打全国心理援助热线 400-161-9995 或 12356，那里有人 24 小时愿意听你说。你不是一个人。', timestamp: ms(getDateOffset(-4), '22:01:00') },
        { role: 'user', content: '我试着做了呼吸练习，感觉好一点了。', timestamp: ms(getDateOffset(-2), '21:30:00') },
        { role: 'assistant', content: '听到你这么说我也安心。记得今晚早点休息，明天再继续。', timestamp: ms(getDateOffset(-2), '21:31:00') },
      ],
    });

    // 12. 演示标记（flag 控制）
    if (flag && typeof window !== 'undefined') {
      try { localStorage.setItem(DEMO_STORAGE_KEY, '1'); } catch { /* ignore */ }
    }

    console.log('[Seed] ✅ 30 天演示数据填充完成（确定性，无随机）');
    return { success: true };
=======
      action: '显示危机干预弹窗，提供热线号码，建议呼吸练习',
      createdAt: new Date(getDateOffset(-2) + 'T20:30:00+08:00').toISOString(),
    });
    console.log('[Seed] 添加危机干预记录');

    // 12. 添加 AI 对话历史（0.0.5+ 演示用）
    const sessionId = `sess_${getToday()}`;
    await db.conversations.add({
      id: sessionId,
      title: '最近的对话',
      sessionId,
      provider: 'fallback',
      createdAt: new Date(getDateOffset(-3) + 'T22:00:00+08:00').toISOString(),
      updatedAt: new Date(getDateOffset(-1) + 'T21:30:00+08:00').toISOString(),
      messages: [
        { role: 'assistant', content: '晚上好，今天辛苦了。想聊聊吗？', timestamp: Date.now() - 3 * 86400000 },
        { role: 'user', content: '最近期末复习压力好大，感觉有点喘不过气。', timestamp: Date.now() - 3 * 86400000 + 60000 },
        { role: 'assistant', content: '听出来你扛着不少东西，辛苦了。期末复习确实是一段高强度的日子。要不要试试 4-7-8 呼吸，两分钟就能让心跳慢下来？', timestamp: Date.now() - 3 * 86400000 + 120000 },
        { role: 'user', content: '好的，我试试。', timestamp: Date.now() - 3 * 86400000 + 180000 },
        { role: 'assistant', content: '嗯，慢慢来。做完可以告诉我感觉怎么样。', timestamp: Date.now() - 3 * 86400000 + 200000 },
        { role: 'user', content: '做完呼吸感觉好一点了，谢谢。', timestamp: Date.now() - 1 * 86400000 },
        { role: 'assistant', content: '听到你这么说我也安心。记得今晚早点休息，明天再继续。', timestamp: Date.now() - 1 * 86400000 + 60000 },
      ],
    });

    // 对应对话情感记录（喂 RiskScoringEngine chat 通道）
    await db.emotionRecords.add({
      id: crypto.randomUUID(),
      date: getDateOffset(-3),
      source: 'chat',
      sourceId: sessionId,
      sentimentScore: -0.4,
      emotions: { joy: 0.1, sadness: 0.5, anger: 0.1, fear: 0.3, surprise: 0, disgust: 0 },
      riskLevel: 'medium',
      keywords: ['压力', '喘不过气'],
      analysis: '期末复习压力好大',
      createdAt: new Date(getDateOffset(-3) + 'T22:05:00+08:00').toISOString(),
    });
    console.log('[Seed] 添加 AI 对话历史 + 对话情感记录');

    console.log('[Seed] ✅ 演示数据填充完成！');
    console.log('[Seed] 故事线：小明经历了"正常→压力→焦虑→危机→恢复"的完整心理变化');
    return { success: true };

>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  } catch (err) {
    console.error('[Seed] ❌ 填充失败:', err);
    return { success: false, error: err };
  }
}

<<<<<<< HEAD
// 暴露到全局（演示/答辩方便）
if (typeof window !== 'undefined') {
  (window as any).seedDemoData = seedDemoData;
  (window as any).clearDemoData = clearDemoData;
=======
// 暴露到全局，所有模式可用（演示/答辩时方便加载；需在 SettingsPage 加确认弹窗防误清空）
if (typeof window !== 'undefined') {
  (window as any).seedDemoData = seedDemoData;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}
