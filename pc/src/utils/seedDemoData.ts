/**
 * 演示数据种子脚本
 * 用于预填充应用数据，方便演示和答辩
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

// ── 演示数据 ──────────────────────────────────────────────────

const DEMO_DIARIES = [
  {
    date: getDateOffset(-6),
    title: '新的开始',
    content: '今天决定开始记录自己的心情。最近考试压力有点大，但和朋友聊了聊感觉好多了。晚上做了一次呼吸练习，感觉放松了不少。',
    mood: 4,
    weather: '☀️',
    tags: ['心情', '考试'],
  },
  {
    date: getDateOffset(-5),
    title: '忙碌的一天',
    content: '从早到晚都在图书馆复习，感觉好累。晚上头疼，睡得不太好。希望明天能轻松一点。',
    mood: 2,
    weather: '☁️',
    tags: ['学习', '疲惫'],
  },
  {
    date: getDateOffset(-4),
    title: '有点焦虑',
    content: '明天就要考试了，感觉还有很多没复习完。心跳加速，手心出汗，很紧张。试着做了正念冥想，稍微好了一点。',
    mood: 2,
    weather: '🌧️',
    tags: ['考试', '焦虑'],
  },
  {
    date: getDateOffset(-3),
    title: '考试结束',
    content: '终于考完了！虽然不确定考得怎么样，但至少松了一口气。和同学去吃了火锅，聊了很多开心的事。',
    mood: 4,
    weather: '☀️',
    tags: ['考试', '社交'],
  },
  {
    date: getDateOffset(-2),
    title: '低落的一天',
    content: '今天心情不太好，一个人待在宿舍不想出门。感觉很孤独，不知道为什么突然这么消沉。给妈妈打了个电话，聊了聊家里的事。',
    mood: 2,
    weather: '☁️',
    tags: ['孤独', '情绪低落'],
  },
  {
    date: getDateOffset(-1),
    title: '慢慢恢复',
    content: '今天去操场跑了两圈，出了一身汗感觉好多了。下午看了一部电影，晚上和室友一起做饭。生活还是要继续的。',
    mood: 3,
    weather: '🌤️',
    tags: ['运动', '恢复'],
  },
  {
    date: getToday(),
    content: '今天阳光很好，早起去食堂吃了早餐。上午整理了笔记，下午打算去图书馆。感觉状态比前几天好多了，希望能保持下去。',
    title: '阳光明媚',
    mood: 4,
    weather: '☀️',
    tags: ['日常', '积极'],
  },
];

const DEMO_TASKS = [
  { title: '复习高等数学', priority: 'high' as const, scheduledDate: getDateOffset(-2), status: 'completed' as const },
  { title: '写英语作文', priority: 'medium' as const, scheduledDate: getDateOffset(-1), status: 'completed' as const },
  { title: '整理笔记', priority: 'medium' as const, scheduledDate: getToday(), status: 'pending' as const },
  { title: '去图书馆还书', priority: 'low' as const, scheduledDate: getToday(), status: 'pending' as const },
  { title: '给妈妈打电话', priority: 'high' as const, scheduledDate: getToday(), status: 'completed' as const },
  { title: '做呼吸练习', priority: 'medium' as const, scheduledDate: getToday(), status: 'pending' as const },
];

const DEMO_HABITS = [
  { name: '早起', color: '#F59E0B', icon: '☀️', frequency: 'daily' as const, targetCount: 1 },
  { name: '运动', color: '#10B981', icon: '🏃', frequency: 'daily' as const, targetCount: 1 },
  { name: '阅读', color: '#8B5CF6', icon: '📖', frequency: 'daily' as const, targetCount: 1 },
  { name: '冥想', color: '#EC4899', icon: '🧘', frequency: 'daily' as const, targetCount: 1 },
];

// ── 种子函数 ──────────────────────────────────────────────────

export async function seedDemoData() {
  console.log('[Seed] 开始填充演示数据...');

  try {
    // 清空现有数据
    await db.transaction('rw', [
      db.diaries, db.tasks, db.habits, db.habitLogs,
      db.emotionRecords, db.assessments, db.therapyRecords,
    ], async () => {
      await db.diaries.clear();
      await db.tasks.clear();
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.emotionRecords.clear();
      await db.assessments.clear();
      await db.therapyRecords.clear();
    });

    // 1. 添加日记
    for (const diary of DEMO_DIARIES) {
      await db.diaries.add({
        id: crypto.randomUUID(),
        ...diary,
        mood: diary.mood as 1 | 2 | 3 | 4 | 5,
        createdAt: new Date(diary.date + 'T20:00:00+08:00').toISOString(),
        updatedAt: new Date(diary.date + 'T20:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${DEMO_DIARIES.length} 篇日记`);

    // 2. 添加任务
    for (const task of DEMO_TASKS) {
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
    console.log(`[Seed] 添加 ${DEMO_TASKS.length} 个任务`);

    // 3. 添加习惯
    const habitIds: string[] = [];
    for (const habit of DEMO_HABITS) {
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
    console.log(`[Seed] 添加 ${DEMO_HABITS.length} 个习惯`);

    // 4. 添加习惯打卡记录（最近7天）
    for (const habitId of habitIds) {
      for (let i = 6; i >= 0; i--) {
        const date = getDateOffset(-i);
        // 随机打卡（80%概率）
        if (Math.random() > 0.2) {
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
    const emotionData = [
      { date: getDateOffset(-6), sentimentScore: 0.6, riskLevel: 'low' as const },
      { date: getDateOffset(-5), sentimentScore: 0.3, riskLevel: 'low' as const },
      { date: getDateOffset(-4), sentimentScore: 0.2, riskLevel: 'medium_low' as const },
      { date: getDateOffset(-3), sentimentScore: 0.7, riskLevel: 'low' as const },
      { date: getDateOffset(-2), sentimentScore: 0.2, riskLevel: 'medium' as const },
      { date: getDateOffset(-1), sentimentScore: 0.5, riskLevel: 'low' as const },
      { date: getToday(), sentimentScore: 0.6, riskLevel: 'low' as const },
    ];

    for (const emo of emotionData) {
      await db.emotionRecords.add({
        id: crypto.randomUUID(),
        date: emo.date,
        source: 'diary' as const,
        sentimentScore: emo.sentimentScore,
        emotions: {
          joy: Math.random() * 0.5 + 0.3,
          sadness: Math.random() * 0.3,
          anger: Math.random() * 0.1,
          fear: Math.random() * 0.2,
          surprise: Math.random() * 0.1,
          disgust: Math.random() * 0.05,
        },
        riskLevel: emo.riskLevel,
        keywords: [],
        createdAt: new Date(emo.date + 'T20:00:00+08:00').toISOString(),
      });
    }
    console.log(`[Seed] 添加 ${emotionData.length} 条情感记录`);

    // 6. 添加评估记录
    await db.assessments.add({
      id: crypto.randomUUID(),
      type: 'PHQ9',
      date: getDateOffset(-3),
      scores: [1, 1, 2, 1, 0, 1, 1, 0, 0],
      totalScore: 7,
      level: 'mild',
      suggestions: '',
      createdAt: new Date(getDateOffset(-3) + 'T15:00:00+08:00').toISOString(),
    });

    await db.assessments.add({
      id: crypto.randomUUID(),
      type: 'GAD7',
      date: getDateOffset(-3),
      scores: [2, 1, 2, 1, 1, 0, 1],
      totalScore: 8,
      level: 'mild',
      suggestions: '',
      createdAt: new Date(getDateOffset(-3) + 'T15:05:00+08:00').toISOString(),
    });
    console.log('[Seed] 添加评估记录');

    // 7. 添加治疗练习记录
    await db.therapyRecords.add({
      id: crypto.randomUUID(),
      type: 'breathing',
      date: getDateOffset(-4),
      data: { exercise: '4-7-8', duration: 300 },
      moodBefore: 2,
      moodAfter: 3,
      createdAt: new Date(getDateOffset(-4) + 'T22:00:00+08:00').toISOString(),
    });

    await db.therapyRecords.add({
      id: crypto.randomUUID(),
      type: 'mindfulness',
      date: getDateOffset(-1),
      data: { exercise: 'body_scan', duration: 600 },
      moodBefore: 2,
      moodAfter: 4,
      createdAt: new Date(getDateOffset(-1) + 'T21:00:00+08:00').toISOString(),
    });
    console.log('[Seed] 添加治疗练习记录');

    console.log('[Seed] ✅ 演示数据填充完成！');
    return { success: true };

  } catch (err) {
    console.error('[Seed] ❌ 填充失败:', err);
    return { success: false, error: err };
  }
}

// 暴露到全局，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).seedDemoData = seedDemoData;
}
