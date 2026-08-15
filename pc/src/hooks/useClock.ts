import { useEffect, useState } from 'react';
import { shouldReduceMotion } from '../utils/reduceMotion';

/**
 * 全局实时时钟 hook
 *
 * - 默认每秒刷新，精确到秒，与本地系统时间同步
 * - 当用户在外观设置开启"减少动效"时降级到 60 秒刷新（减少重绘）
 * - 多个组件共用本 hook 时各自持有独立 timer（开销极小），
 *   若未来需要全局唯一可改为 Zustand store，当前简单实现已足够
 *
 * @returns 当前时间 Date 对象，每秒更新
 */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // 尊重用户显式设置：应用内 reduceMotion 开关开启时降到分钟级刷新
    // （历史上读 OS matchMedia，会无视应用开关；现统一由 shouldReduceMotion 决策）
    const reduce = shouldReduceMotion();
    const interval = reduce ? 60000 : 1000;

    const timer = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(timer);
  }, []);

  return now;
}

/**
 * 格式化时钟显示文本
 * - zh-CN：M月D日 周X HH:mm:ss
 * - 其他：EEE, MMM d HH:mm:ss
 */
export function formatClockDisplay(now: Date, lang: string): string {
  if (lang === 'zh-CN') {
    const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getMonth() + 1}月${now.getDate()}日 周${week} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  // en：用 Intl 简化
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/**
 * 根据小时返回问候语
 */
export function getGreeting(now: Date, lang: string): string {
  const hour = now.getHours();
  if (lang === 'zh-CN') {
    return hour < 6 ? '夜深了，注意休息' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  }
  return hour < 6 ? 'Late night, rest well' : hour < 12 ? 'Good morning' : hour < 14 ? 'Good noon' : hour < 18 ? 'Good afternoon' : 'Good evening';
}
