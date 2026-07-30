import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';

/**
 * 打字行为追踪 hook（参考 StudentLife 2014）
 *
 * 从 DiaryEditor.tsx 抽出。负责无感采集用户在日记编辑过程中的打字行为：
 * - 平均速度（字/分钟）
 * - 删除率（删除键 / 总按键）
 * - 停顿率（停顿次数 / 分钟）
 * - 会话时长（分钟）
 *
 * 调用方：
 *   const typing = useTypingTracker();
 *   window.addEventListener('keydown', typing.handleKeyDown);
 *   const metrics = typing.calculateMetrics(); // 在保存时调用
 */
export interface TypingSession {
  startTime: number;
  keyCount: number;
  deleteCount: number;
  pauseCount: number;
  lastKeyTime: number;
  totalChars: number;
}

export interface TypingMetrics {
  avgSpeed: number;
  deleteRate: number;
  pauseRate: number;
  sessionDuration: number;
}

const PAUSE_THRESHOLD = 2000; // 2秒无输入视为停顿

export function useTypingTracker() {
  const typingSessionRef = useRef<TypingSession>({
    startTime: Date.now(),
    keyCount: 0,
    deleteCount: 0,
    pauseCount: 0,
    lastKeyTime: Date.now(),
    totalChars: 0,
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const session = typingSessionRef.current;
    const now = Date.now();

    // 检测停顿（超过2秒无输入）
    if (now - session.lastKeyTime > PAUSE_THRESHOLD && session.lastKeyTime > session.startTime) {
      session.pauseCount++;
    }

    session.keyCount++;
    session.lastKeyTime = now;

    // 检测删除键
    if (e.key === 'Backspace' || e.key === 'Delete') {
      session.deleteCount++;
    }
  }, []);

  const updateTotalChars = useCallback((chars: number) => {
    typingSessionRef.current.totalChars = chars;
  }, []);

  const calculateTypingMetrics = useCallback((): TypingMetrics | null => {
    const session = typingSessionRef.current;
    const durationMinutes = (Date.now() - session.startTime) / 60000;

    if (durationMinutes < 0.1 || session.keyCount < 10) {
      return null; // 数据不足
    }

    const avgSpeed = Math.round(session.totalChars / durationMinutes);
    const deleteRate = session.keyCount > 0 ? session.deleteCount / session.keyCount : 0;
    const pauseRate = session.pauseCount / durationMinutes;

    return {
      avgSpeed,
      deleteRate: Math.round(deleteRate * 100) / 100,
      pauseRate: Math.round(pauseRate * 10) / 10,
      sessionDuration: Math.round(durationMinutes * 10) / 10,
    };
  }, []);

  return { typingSessionRef, handleKeyDown, updateTotalChars, calculateTypingMetrics };
}

/**
 * 从 URL hash 解析 ?date= 参数，用于日记编辑器指定日期
 * （React Router v6 HashRouter 下，search params 在 hash 之后）
 */
export function useDateParam(): string {
  const [date, setDate] = useState(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return urlParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  });
  return date;
}
