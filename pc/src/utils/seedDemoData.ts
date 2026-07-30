/**
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
 */

import { db } from '../db';
import { getToday, getDaysAgo } from './date';

/** 获取偏移日期（负数为过去） */
function getDateOffset(days: number): string {
  if (days >= 0) return getToday();
  return getDaysAgo(-days);
}

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
    await db.transaction('rw', [
      db.diaries, db.tasks, db.habits, db.habitLogs,
      db.emotionRecords, db.assessments, db.therapyRecords,
      db.behaviorRecords, db.healthProfiles, db.conversationSummaries,
      db.crisisLogs,
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
      triggerSource: 'diary',
      triggerContent: '活着没意思',
      riskLevel: 'critical',
      handled: true,
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

  } catch (err) {
    console.error('[Seed] ❌ 填充失败:', err);
    return { success: false, error: err };
  }
}

// 暴露到全局，所有模式可用（演示/答辩时方便加载；需在 SettingsPage 加确认弹窗防误清空）
if (typeof window !== 'undefined') {
  (window as any).seedDemoData = seedDemoData;
}
