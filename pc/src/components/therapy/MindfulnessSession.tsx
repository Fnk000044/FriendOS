/**
 * MindfulnessSession - Guided mindfulness meditation component
 * Offers body scan, breath awareness, and loving-kindness meditation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { db } from '../../db';
import { getToday } from '../../utils/date';

type MeditationType = 'body_scan' | 'breath_awareness' | 'loving_kindness';

// 禁忌症筛查问卷
// 参考：Goyal et al., 2014, JAMA - 正念冥想可能不适用于PTSD/精神病患者
const SCREENING_QUESTIONS = [
  {
    id: 'ptsd',
    question: '你是否曾被诊断为创伤后应激障碍（PTSD）？',
    description: '正念冥想可能会触发创伤记忆，建议在专业指导下进行。',
  },
  {
    id: 'psychosis',
    question: '你是否曾经历过幻觉、妄想或与现实脱节的感觉？',
    description: '正念练习可能会加重这些症状，建议先咨询精神科医生。',
  },
  {
    id: 'crisis',
    question: '你目前正在经历严重的精神健康危机吗？',
    description: '如果你正处于危机中，建议先寻求专业帮助。',
  },
];

interface MeditationOption {
  id: MeditationType;
  name: string;
  description: string;
  duration: number; // seconds
  color: string;
  steps: string[];
}

const MEDITATIONS: MeditationOption[] = [
  {
    id: 'body_scan',
    name: '身体扫描',
    description: '从头到脚逐步感受身体各部位，释放紧张和压力。',
    duration: 300, // 5 minutes
    color: 'green',
    steps: [
      '找一个舒适的姿势，轻轻闭上眼睛。',
      '深呼吸三次，感受空气进入和离开你的身体。',
      '将注意力集中到头顶，感受那里的任何感觉。',
      '慢慢将注意力下移到额头、眼睛、脸颊。',
      '感受你的脖子和肩膀，释放那里的紧张。',
      '将注意力移到手臂和双手。',
      '感受你的胸腔和腹部随呼吸起伏。',
      '将注意力下移到背部、臀部。',
      '感受你的大腿、膝盖、小腿。',
      '最后感受你的双脚和脚趾。',
      '感受整个身体作为一个整体。',
      '慢慢睁开眼睛，带着觉察回到当下。',
    ],
  },
  {
    id: 'breath_awareness',
    name: '觉察呼吸',
    description: '专注于呼吸的节奏，培养对当下的觉察力。',
    duration: 180, // 3 minutes
    color: 'blue',
    steps: [
      '舒适地坐好，轻轻闭上眼睛。',
      '不要改变呼吸，只是观察它。',
      '注意空气从鼻孔进入的感觉。',
      '感受胸腔和腹部的起伏。',
      '注意呼吸之间的短暂停顿。',
      '如果思绪飘走，温柔地把注意力带回呼吸。',
      '不需要评判，只需要观察。',
      '继续专注于每一次呼吸。',
      '感受呼吸带来的平静。',
      '慢慢睁开眼睛，保持这份觉察。',
    ],
  },
  {
    id: 'loving_kindness',
    name: '慈悲冥想',
    description: '培养对自己和他人的善意与慈悲。',
    duration: 240, // 4 minutes
    color: 'pink',
    steps: [
      '舒适地坐好，轻轻闭上眼睛。',
      '深呼吸几次，让身体放松。',
      '在心中默念："愿我平安，愿我健康，愿我快乐。"',
      '感受这些话语带来的温暖。',
      '想象一个你爱的人。',
      '对他们默念："愿你平安，愿你健康，愿你快乐。"',
      '想象一个中性的人（如邻居）。',
      '对他们也送上同样的祝福。',
      '现在，将这份善意扩展到所有人。',
      '默念："愿所有众生平安、健康、快乐。"',
      '感受这份慈悲充满你的心。',
      '慢慢睁开眼睛，带着这份善意回到生活中。',
    ],
  },
];

interface MindfulnessSessionProps {
  onComplete: () => void;
}

export default function MindfulnessSession({ onComplete }: MindfulnessSessionProps) {
  const [selectedType, setSelectedType] = useState<MeditationType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<'select' | 'screening' | 'mood_before' | 'session' | 'mood_after' | 'complete'>('select');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meditation = MEDITATIONS.find(m => m.id === selectedType);

  // Timer logic
  useEffect(() => {
    if (isPlaying && meditation) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          // Auto-advance steps
          const stepDuration = Math.floor(meditation.duration / meditation.steps.length);
          const newStep = Math.min(Math.floor(next / stepDuration), meditation.steps.length - 1);
          setCurrentStep(newStep);

          if (next >= meditation.duration) {
            setIsPlaying(false);
            setPhase('mood_after');
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, meditation]);

  const handleSelectType = (type: MeditationType) => {
    setSelectedType(type);
    setPhase('screening');
  };

  const handleScreeningComplete = () => {
    // 检查是否有任何禁忌症
    const hasContraindication = Object.values(screeningAnswers).some(v => v === true);
    if (hasContraindication) {
      // 有禁忌症，返回选择界面
      setPhase('select');
      setSelectedType(null);
      setScreeningAnswers({});
    } else {
      // 无禁忌症，继续
      setPhase('mood_before');
    }
  };

  const handleStart = () => {
    setPhase('session');
    setIsPlaying(true);
    setElapsed(0);
    setCurrentStep(0);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setElapsed(0);
    setCurrentStep(0);
  };

  const handleComplete = useCallback(async () => {
    if (!meditation || !moodBefore || !moodAfter) return;

    // Save therapy record
    await db.therapyRecords.add({
      id: crypto.randomUUID(),
      type: 'mindfulness',
      date: getToday(),
      data: {
        meditationType: meditation.id,
        meditationName: meditation.name,
        duration: elapsed,
        stepsCompleted: currentStep + 1,
        totalSteps: meditation.steps.length,
      },
      moodBefore,
      moodAfter,
      createdAt: new Date().toISOString(),
    });

    setPhase('complete');
  }, [meditation, elapsed, currentStep, moodBefore, moodAfter]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const colorMap: Record<string, { bg: string; text: string; light: string }> = {
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50' },
  };

  // Type selection
  if (phase === 'select') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">正念冥想</h2>
        <p className="text-sm text-slate-500">选择一种冥想方式，开始你的练习。</p>
        <div className="grid grid-cols-1 gap-4">
          {MEDITATIONS.map(m => {
            const colors = colorMap[m.color];
            return (
              <button
                key={m.id}
                onClick={() => handleSelectType(m.id)}
                className={`${colors.light} rounded-xl p-5 text-left hover:shadow-md transition-shadow border`}
              >
                <h3 className={`font-bold ${colors.text} mb-1`}>{m.name}</h3>
                <p className="text-sm text-slate-600 mb-2">{m.description}</p>
                <span className="text-xs text-slate-400">{formatTime(m.duration)}</span>
              </button>
            );
          })}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700">
            💡 正念冥想可能不适用于所有人。如果你有严重的精神健康问题，建议先咨询专业人士。
          </p>
        </div>
      </div>
    );
  }

  // 禁忌症筛查
  // 参考：Goyal et al., 2014, JAMA
  if (phase === 'screening') {
    const hasContraindication = Object.values(screeningAnswers).some(v => v === true);
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">安全筛查</h2>
        <p className="text-sm text-slate-500">
          开始冥想前，请回答以下问题以确保练习的安全性。
        </p>
        <div className="space-y-3">
          {SCREENING_QUESTIONS.map(q => (
            <div key={q.id} className="rounded-lg border p-4" style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--glass-border)' }}>
              <p className="text-sm font-medium text-slate-700 mb-2">{q.question}</p>
              <p className="text-xs text-slate-500 mb-3">{q.description}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setScreeningAnswers(prev => ({ ...prev, [q.id]: true }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    screeningAnswers[q.id] === true
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  是
                </button>
                <button
                  onClick={() => setScreeningAnswers(prev => ({ ...prev, [q.id]: false }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    screeningAnswers[q.id] === false
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  否
                </button>
              </div>
            </div>
          ))}
        </div>
        {hasContraindication && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium mb-1">⚠️ 建议暂停练习</p>
            <p className="text-xs text-red-600">
              根据你的回答，正念冥想可能不适合你当前的状态。建议先咨询精神科医生或心理咨询师，在专业指导下进行练习。
            </p>
            <p className="text-xs text-red-600 mt-2">
              心理援助热线：400-161-9995（24小时）
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setPhase('select');
              setSelectedType(null);
              setScreeningAnswers({});
            }}
            className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
          >
            返回
          </button>
          <button
            onClick={handleScreeningComplete}
            disabled={Object.keys(screeningAnswers).length < SCREENING_QUESTIONS.length}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              Object.keys(screeningAnswers).length < SCREENING_QUESTIONS.length
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : hasContraindication
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {hasContraindication ? '返回选择' : '继续'}
          </button>
        </div>
      </div>
    );
  }

  // Mood before
  if (phase === 'mood_before') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">冥想前的心情</h2>
        <p className="text-sm text-slate-500">开始前，请评估你当前的心情（1-10）。</p>
        <div className="flex flex-wrap gap-2 justify-center py-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
            <button
              key={v}
              onClick={() => setMoodBefore(v)}
              className={`w-12 h-12 rounded-full text-lg font-bold transition-all ${
                moodBefore === v
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {moodBefore && (
          <button
            onClick={handleStart}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            开始冥想
          </button>
        )}
      </div>
    );
  }

  // Session
  if (phase === 'session' && meditation) {
    const colors = colorMap[meditation.color];
    const progress = elapsed / meditation.duration;
    const remaining = meditation.duration - elapsed;

    return (
      <div className="space-y-6">
        <div className={`${colors.light} rounded-2xl p-8 text-center`}>
          <h2 className={`text-xl font-bold ${colors.text} mb-2`}>{meditation.name}</h2>
          <p className="text-sm text-slate-500 mb-6">{formatTime(remaining)} 剩余</p>

          {/* Progress circle */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="2" />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={meditation.color === 'green' ? '#22c55e' : meditation.color === 'blue' ? '#3b82f6' : '#ec4899'}
                strokeWidth="2"
                strokeDasharray={`${progress * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-700">{formatTime(elapsed)}</span>
            </div>
          </div>

          {/* Current step */}
          <div className="rounded-xl p-4 mb-6 min-h-[80px] flex items-center justify-center" style={{ background: 'var(--bg-card-solid)' }}>
            <p className="text-base text-slate-700 leading-relaxed">
              {meditation.steps[currentStep]}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-1 mb-6">
            {meditation.steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep
                    ? colors.bg
                    : i < currentStep
                    ? 'bg-slate-300'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleReset}
              className="w-14 h-14 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              style={{ background: 'var(--bg-card-solid)' }}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm`}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mood after
  if (phase === 'mood_after') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">冥想后的心情</h2>
        <p className="text-sm text-slate-500">冥想结束了，请再次评估你的心情（1-10）。</p>
        <div className="flex flex-wrap gap-2 justify-center py-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
            <button
              key={v}
              onClick={() => setMoodAfter(v)}
              className={`w-12 h-12 rounded-full text-lg font-bold transition-all ${
                moodAfter === v
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {moodAfter && (
          <button
            onClick={handleComplete}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            完成
          </button>
        )}
      </div>
    );
  }

  // Complete
  if (phase === 'complete') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">冥想完成</h2>
        {moodBefore && moodAfter && (
          <p className="text-sm text-slate-600">
            心情从 {moodBefore} 变为 {moodAfter}
            {moodAfter > moodBefore && '，有所改善！'}
            {moodAfter === moodBefore && '，保持稳定。'}
            {moodAfter < moodBefore && '，继续加油。'}
          </p>
        )}
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return null;
}
