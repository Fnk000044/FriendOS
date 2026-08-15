import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../db';
import { getToday } from '../../utils/date';
<<<<<<< HEAD
import InterventionFeedback from '../common/InterventionFeedback';
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

type BreathingPattern = '478' | 'box' | 'simple' | 'resonance';

// 参考：
// - 4-7-8呼吸法：Andrew Weil博士
// - 方块呼吸法：美国海军陆战队使用
// - 腹式呼吸：标准呼吸教学
// - 共振频率呼吸：Zaccaro et al., 2018 (5.5秒吸+5.5秒呼=每分钟5.5次呼吸)
const PATTERNS: Record<BreathingPattern, { name: string; description: string; guidance: string; phases: { label: string; duration: number; instruction?: string }[] }> = {
  '478': {
    name: '4-7-8 呼吸法',
    description: '帮助放松和入睡（Andrew Weil博士推荐）',
    guidance: '将舌尖放在上排牙齿后方，通过鼻子吸气，通过嘴呼气。',
    phases: [
      { label: '吸气', duration: 4, instruction: '通过鼻子缓慢吸气' },
      { label: '屏息', duration: 7, instruction: '屏住呼吸' },
      { label: '呼气', duration: 8, instruction: '通过嘴缓慢呼气' },
    ],
  },
  box: {
    name: '方块呼吸法',
    description: '帮助集中注意力（美国海军陆战队使用）',
    guidance: '想象一个正方形，每条边代表一个呼吸阶段。',
    phases: [
      { label: '吸气', duration: 4, instruction: '通过鼻子吸气' },
      { label: '屏息', duration: 4, instruction: '屏住呼吸' },
      { label: '呼气', duration: 4, instruction: '通过嘴呼气' },
      { label: '屏息', duration: 4, instruction: '屏住呼吸' },
    ],
  },
  simple: {
    name: '腹式呼吸',
    description: '简单放松，适合初学者',
    guidance: '将一只手放在胸部，另一只手放在腹部。吸气时腹部应该膨胀，胸部保持不动。',
    phases: [
      { label: '吸气', duration: 5, instruction: '通过鼻子吸气，感受腹部膨胀' },
      { label: '呼气', duration: 5, instruction: '通过嘴呼气，感受腹部收缩' },
    ],
  },
  resonance: {
    name: '共振频率呼吸',
    description: '每分钟5.5次呼吸，已被研究证实最有效（Zaccaro et al., 2018）',
    guidance: '这种呼吸频率可以最大化心率变异性（HRV），帮助调节自主神经系统。',
    phases: [
      { label: '吸气', duration: 5.5, instruction: '通过鼻子缓慢吸气' },
      { label: '呼气', duration: 5.5, instruction: '通过嘴缓慢呼气' },
    ],
  },
};

interface BreathingExerciseProps {
  onComplete?: (moodBefore: number, moodAfter: number) => void;
}

export default function BreathingExercise({ onComplete }: BreathingExerciseProps) {
  const [pattern, setPattern] = useState<BreathingPattern>('478');
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const [targetCycles, setTargetCycles] = useState(3);
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [showMoodAfter, setShowMoodAfter] = useState(false);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  const phases = PATTERNS[pattern].phases;
  const totalDuration = phases.reduce((acc, p) => acc + p.duration, 0);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Set initial time when starting or changing phase
    setTimeLeft(phases[currentPhase].duration);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next phase
          const nextPhase = (currentPhase + 1) % phases.length;
          if (nextPhase === 0) {
            setTotalCycles(c => {
              const newCycles = c + 1;
              if (newCycles >= targetCycles) {
                setIsRunning(false);
                setShowMoodAfter(true);
              }
              return newCycles;
            });
          }
          setCurrentPhase(nextPhase);
          return phases[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentPhase, phases, targetCycles]);

  const handleStart = () => {
    setIsRunning(true);
    setCurrentPhase(0);
    setTotalCycles(0);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentPhase(0);
    setTimeLeft(0);
    setTotalCycles(0);
    setShowMoodAfter(false);
    setCompleted(false);
  };

  const handleComplete = async () => {
    try {
      await db.therapyRecords.add({
        id: crypto.randomUUID(),
        type: 'breathing',
        date: getToday(),
        data: {
          pattern,
          cycles: totalCycles,
          duration: totalCycles * totalDuration,
        },
        moodBefore,
        moodAfter,
        createdAt: new Date().toISOString(),
      });
      setCompleted(true);
      onComplete?.(moodBefore, moodAfter);
    } catch (err) {
      console.error('Failed to save breathing record:', err);
      toast.error('保存失败');
    }
  };

  // 获取当前阶段的动画样式
  const getCircleAnimation = () => {
    if (!isRunning) return {};
    const phase = phases[currentPhase];
    const duration = phase.duration;

    if (phase.label === '吸气') {
      return {
        animation: `breatheIn ${duration}s ease-in-out forwards`,
      };
    } else if (phase.label === '呼气') {
      return {
        animation: `breatheOut ${duration}s ease-in-out forwards`,
      };
    }
    // 屏息 - 保持当前大小
    return {
      transform: currentPhase === 1 ? 'scale(1.5)' : 'scale(1)',
    };
  };

  if (completed) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-500" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">练习完成！</h3>
        <p className="text-text-secondary mb-4">
          你完成了 {totalCycles} 个循环的 {PATTERNS[pattern].name}
        </p>
        {moodAfter < moodBefore && (
          <p className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
            情绪强度从 {moodBefore} 降低到 {moodAfter}，降低了 {moodBefore - moodAfter} 点！
          </p>
        )}
<<<<<<< HEAD
        <div className="mt-4 flex justify-center">
          <InterventionFeedback interventionType="breathing" />
        </div>
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
        <button
          onClick={handleReset}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-btn hover:opacity-90 transition-opacity cursor-pointer"
        >
          再次练习
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="glass-card glass-glow rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
          <h2 className="text-white font-bold text-lg">呼吸练习</h2>
          <p className="text-white/80 text-sm mt-1">通过呼吸调节情绪</p>
        </div>

        {/* Pattern Selection */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PATTERNS).map(([key, { name }]) => (
              <button
                key={key}
                onClick={() => {
                  setPattern(key as BreathingPattern);
                  handleReset();
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  pattern === key
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">{PATTERNS[pattern].description}</p>
          {/* 技术指导 */}
          <p className="text-xs text-blue-600 mt-1 bg-blue-50 rounded p-2">
            💡 {PATTERNS[pattern].guidance}
          </p>
        </div>

        {/* Mood Before */}
        {!isRunning && !showMoodAfter && (
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">练习前情绪评分</span>
              <span className="text-sm font-medium text-blue-600">{moodBefore} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodBefore}
              onChange={(e) => setMoodBefore(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>很差</span>
              <span>很好</span>
            </div>
          </div>
        )}

        {/* Breathing Circle */}
        <div className="px-6 pt-8 pb-4 flex flex-col items-center">
          <div className="relative h-56 w-56 flex items-center justify-center mb-4">
            {/* Outer ring */}
            <div className="absolute inset-4 rounded-full border-2 pointer-events-none" style={{ borderColor: 'var(--glass-border)' }} />

            {/* Animated circle - clickable */}
            <div
              ref={circleRef}
              role="button"
              tabIndex={0}
              aria-label={isRunning ? '暂停' : '点击开始'}
              onClick={() => {
                if (isRunning) {
                  handlePause();
                } else {
                  handleStart();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isRunning) {
                    handlePause();
                  } else {
                    handleStart();
                  }
                }
              }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              style={getCircleAnimation()}
            >
              <div className="text-center text-white pointer-events-none">
                {isRunning ? (
                  <>
                    <p className="text-2xl font-bold">{timeLeft}</p>
                    <p className="text-sm">{phases[currentPhase].label}</p>
                  </>
                ) : (
                  <p className="text-sm">点击开始</p>
                )}
              </div>
            </div>
          </div>

          {/* 指导文字 */}
          {isRunning && phases[currentPhase].instruction && (
            <p className="text-xs text-blue-600 text-center mb-2">
              {phases[currentPhase].instruction}
            </p>
          )}

          {/* Progress */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              {totalCycles} / {targetCycles} 个循环
            </p>
            {/* Phase indicators */}
            <div className="flex justify-center gap-2 mt-2">
              {phases.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentPhase && isRunning ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Target Cycles */}
        {!isRunning && !showMoodAfter && (
          <div className="px-6 py-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">目标循环数</span>
              <div className="flex items-center gap-2">
                {[3, 5, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => setTargetCycles(n)}
                    className={`px-2 py-1 text-sm rounded ${
                      targetCycles === n
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mood After */}
        {showMoodAfter && (
          <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">练习后情绪评分</span>
              <span className="text-sm font-medium text-blue-600">{moodAfter} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodAfter}
              onChange={(e) => setMoodAfter(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <button
              onClick={handleComplete}
              className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-btn hover:opacity-90 transition-opacity cursor-pointer"
            >
              完成并保存
            </button>
          </div>
        )}

        {/* Controls */}
        {!showMoodAfter && (
          <div className="px-6 py-4 border-t flex justify-center gap-4" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}>
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-btn hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Play className="w-4 h-4" />
                开始
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-500 text-white rounded-btn hover:bg-slate-600 transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                暂停
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 text-text-muted hover:bg-surface-hover rounded-btn cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
